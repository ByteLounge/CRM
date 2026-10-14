import { env } from '../../../config/env';
import { repo } from '../../../repositories/database.repository';
import { Customer, CustomerSegment } from '../../../types/models';
import { WCExternalCustomer, WCExternalOrder } from '../../../types/woocommerce';
import { logger } from '../../../utils/logger';
import { WooCommerceMockAdapter } from './adapters/woocommerce-mock.adapter';
import { WooCommerceRestAdapter } from './adapters/woocommerce-rest.adapter';
import { IWooCommerceAdapter } from './adapters/woocommerce.interface';

export class WooCommerceService {
  async getAdapter(orgId: string): Promise<IWooCommerceAdapter> {
    const integration = await repo.getIntegrationByOrg(orgId, 'woocommerce');
    const creds = integration?.encrypted_credentials || {};

    const isMockExplicit = creds.is_mock !== undefined ? creds.is_mock : env.WOOCOMMERCE_MOCK_MODE;
    const consumerKey = creds.consumer_key || env.WOOCOMMERCE_CONSUMER_KEY;
    const consumerSecret = creds.consumer_secret || env.WOOCOMMERCE_CONSUMER_SECRET;
    const storeUrl = (creds.store_url || integration?.store_url || env.WOOCOMMERCE_STORE_URL || '').replace('http://', 'https://');

    const hasLiveCreds =
      consumerKey &&
      consumerSecret &&
      consumerKey.startsWith('ck_') &&
      consumerSecret.startsWith('cs_') &&
      !consumerKey.includes('mock');

    if (!isMockExplicit && hasLiveCreds) {
      logger.info(`Using WooCommerce REST Adapter for org ${orgId} (${storeUrl})`);
      return new WooCommerceRestAdapter({
        storeUrl,
        consumerKey: consumerKey as string,
        consumerSecret: consumerSecret as string,
      });
    }

    logger.info(`Using WooCommerce Mock Adapter [DEMO MODE] for org ${orgId}`);
    return new WooCommerceMockAdapter();
  }

  async testConnection(orgId: string): Promise<{ success: boolean; isMock: boolean; storeName?: string; error?: string }> {
    const adapter = await this.getAdapter(orgId);
    const result = await adapter.testConnection();
    return {
      ...result,
      isMock: adapter.isMock,
    };
  }

  async syncCustomers(orgId: string, adapter: IWooCommerceAdapter): Promise<number> {
    let page = 1;
    let totalProcessed = 0;
    let hasMore = true;

    while (hasMore) {
      const { customers, total } = await adapter.fetchCustomers(page, 50);
      if (!customers || customers.length === 0) {
        break;
      }

      for (const wcCust of customers) {
        await this.upsertWcCustomer(orgId, wcCust);
        totalProcessed++;
      }

      if (totalProcessed >= total || customers.length < 50 || adapter.isMock) {
        hasMore = false;
      } else {
        page++;
      }
    }

    return totalProcessed;
  }

  async upsertWcCustomer(orgId: string, wcCust: WCExternalCustomer): Promise<Customer> {
    const email = (wcCust.email || wcCust.billing?.email || '').toLowerCase().trim();
    const firstName = wcCust.first_name || wcCust.billing?.first_name || '';
    const lastName = wcCust.last_name || wcCust.billing?.last_name || '';
    const phone = wcCust.billing?.phone || null;

    return repo.upsertCustomer(orgId, {
      external_customer_id: wcCust.id,
      first_name: firstName,
      last_name: lastName,
      email: email || `customer_${wcCust.id}@flowcrm.store`,
      phone,
      billing_address: wcCust.billing,
      shipping_address: wcCust.shipping,
      is_guest: false,
    });
  }

  async syncOrders(orgId: string, adapter: IWooCommerceAdapter): Promise<{ ordersProcessed: number; customerIds: Set<string> }> {
    let page = 1;
    let totalProcessed = 0;
    let hasMore = true;
    const affectedCustomerIds = new Set<string>();

    while (hasMore) {
      const { orders, total } = await adapter.fetchOrders(page, 50);
      if (!orders || orders.length === 0) {
        break;
      }

      for (const wcOrder of orders) {
        const customerId = await this.upsertWcOrder(orgId, wcOrder);
        if (customerId) {
          affectedCustomerIds.add(customerId);
        }
        totalProcessed++;
      }

      if (totalProcessed >= total || orders.length < 50 || adapter.isMock) {
        hasMore = false;
      } else {
        page++;
      }
    }

    return { ordersProcessed: totalProcessed, customerIds: affectedCustomerIds };
  }

  async upsertWcOrder(orgId: string, wcOrder: WCExternalOrder): Promise<string | null> {
    let customerId: string | null = null;

    // 1. Check if linked to registered customer
    if (wcOrder.customer_id && wcOrder.customer_id > 0) {
      const existing = await repo.getCustomerByExternalId(orgId, wcOrder.customer_id);
      if (existing) {
        customerId = existing.id;
      }
    }

    // 2. Fallback to billing email lookup
    const billingEmail = (wcOrder.billing?.email || '').toLowerCase().trim();
    if (!customerId && billingEmail) {
      const existing = await repo.getCustomerByEmail(orgId, billingEmail);
      if (existing) {
        customerId = existing.id;
      }
    }

    // 3. If still no customer found (guest checkout or new unimported customer)
    if (!customerId && billingEmail) {
      const guestCust = await repo.upsertCustomer(orgId, {
        external_customer_id: wcOrder.customer_id > 0 ? wcOrder.customer_id : null,
        first_name: wcOrder.billing?.first_name || 'Guest',
        last_name: wcOrder.billing?.last_name || 'Customer',
        email: billingEmail,
        phone: wcOrder.billing?.phone || null,
        billing_address: wcOrder.billing,
        shipping_address: wcOrder.shipping,
        is_guest: wcOrder.customer_id === 0,
      });
      customerId = guestCust.id;
    }

    // 4. Map line items
    const lineItems = (wcOrder.line_items || []).map((item) => ({
      external_product_id: item.product_id || null,
      product_name: item.name || 'Product',
      quantity: item.quantity || 1,
      unit_price: Number(item.price || (item.total ? Number(item.total) / (item.quantity || 1) : 0)),
      total_price: Number(item.total || 0),
    }));

    // 5. Upsert Order
    const totalAmount = Number(wcOrder.total || 0);
    const placedAt = wcOrder.date_created || new Date().toISOString();

    await repo.upsertOrder(
      orgId,
      {
        external_order_id: wcOrder.id,
        customer_id: customerId,
        order_number: wcOrder.number || String(wcOrder.id),
        status: wcOrder.status,
        currency: wcOrder.currency || 'USD',
        total_amount: totalAmount,
        payment_method: wcOrder.payment_method_title || wcOrder.payment_method || 'Unknown',
        placed_at: placedAt,
      },
      lineItems
    );

    return customerId;
  }

  async runFullSync(orgId: string): Promise<{
    success: boolean;
    isMock: boolean;
    customersSynced: number;
    ordersSynced: number;
    lastSyncAt: string;
    error?: string;
  }> {
    const syncLog = await repo.createSyncLog(orgId, null, 'full');
    const startTime = Date.now();

    try {
      const adapter = await this.getAdapter(orgId);
      logger.info(`Starting full synchronisation for org ${orgId} (Adapter: ${adapter.isMock ? 'Mock' : 'Live'})`);

      // 1. Sync customers
      const customersSynced = await this.syncCustomers(orgId, adapter);

      // 2. Sync orders
      const { ordersProcessed, customerIds } = await this.syncOrders(orgId, adapter);

      // 3. Recalculate customer aggregate metrics (LTV, order count, segment)
      for (const customerId of customerIds) {
        await repo.recalculateCustomerMetrics(orgId, customerId);
      }

      // Also recalculate all customers in case any were missed
      const allCustomers = await repo.listCustomers(orgId, { limit: 200 });
      for (const c of allCustomers.customers) {
        await repo.recalculateCustomerMetrics(orgId, c.id);
      }

      const now = new Date().toISOString();
      const status = adapter.isMock ? 'demo' : 'connected';

      const existingInt = await repo.getIntegrationByOrg(orgId, 'woocommerce');
      const existingCreds = existingInt?.encrypted_credentials || {};

      // Update integration record
      await repo.upsertIntegration(orgId, {
        store_url: adapter.isMock ? 'https://demo.flowcrm.store [DEMO MODE]' : (existingInt?.store_url || env.WOOCOMMERCE_STORE_URL),
        encrypted_credentials: { ...existingCreds, is_mock: adapter.isMock },
        connection_status: status,
        last_sync_at: now,
      });

      const totalProcessed = customersSynced + ordersProcessed;
      await repo.updateSyncLog(syncLog.id, 'completed', totalProcessed);

      await repo.logActivity(orgId, 'system', 'sync', syncLog.id, 'synced', {
        customersSynced,
        ordersSynced: ordersProcessed,
        durationMs: Date.now() - startTime,
        isMock: adapter.isMock,
      });

      logger.info(`Full synchronisation completed successfully: ${customersSynced} customers, ${ordersProcessed} orders`);

      return {
        success: true,
        isMock: adapter.isMock,
        customersSynced,
        ordersSynced: ordersProcessed,
        lastSyncAt: now,
      };
    } catch (err: any) {
      const errMsg = err.message || 'Unknown error occurred during WooCommerce sync';
      logger.error(`Synchronisation failed for org ${orgId}: ${errMsg}`);
      await repo.updateSyncLog(syncLog.id, 'failed', 0, errMsg);
      return {
        success: false,
        isMock: false,
        customersSynced: 0,
        ordersSynced: 0,
        lastSyncAt: new Date().toISOString(),
        error: errMsg,
      };
    }
  }

  async processWebhook(orgId: string, topic: string, payload: any): Promise<{ handled: boolean; message: string }> {
    logger.info(`Processing WooCommerce webhook topic "${topic}" for org ${orgId}`);

    if (topic.startsWith('customer.')) {
      const wcCust = payload as WCExternalCustomer;
      const customer = await this.upsertWcCustomer(orgId, wcCust);
      await repo.logActivity(orgId, 'webhook', 'customer', customer.id, topic, { email: customer.email });
      return { handled: true, message: `Customer ${customer.id} updated via webhook` };
    }

    if (topic.startsWith('order.')) {
      const wcOrder = payload as WCExternalOrder;
      const customerId = await this.upsertWcOrder(orgId, wcOrder);
      if (customerId) {
        await repo.recalculateCustomerMetrics(orgId, customerId);
      }
      await repo.logActivity(orgId, 'webhook', 'order', String(wcOrder.id), topic, { order_number: wcOrder.number });
      return { handled: true, message: `Order ${wcOrder.id} processed via webhook` };
    }

    return { handled: false, message: `Unhandled topic ${topic}` };
  }
}

export const wcService = new WooCommerceService();
