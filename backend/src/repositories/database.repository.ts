import crypto from 'crypto';
import { db } from '../db/client';
import {
  ActivityLog,
  Address,
  Communication,
  Customer,
  CustomerNote,
  CustomerSegment,
  Integration,
  Order,
  OrderItem,
  Organisation,
  OrganisationMember,
  SyncLog,
} from '../types/models';

function parseJson<T>(val: any, fallback: T): T {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

function stringifyJson(val: any): string {
  if (typeof val === 'string') return val;
  return JSON.stringify(val ?? {});
}

export class DatabaseRepository {
  // ==========================================
  // Organisations & Members
  // ==========================================
  async getOrganisationById(id: string): Promise<Organisation | null> {
    const rows = await db.query<Organisation>(
      'SELECT id, name, created_at, updated_at FROM organisations WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  }

  async createOrganisation(name: string, customId?: string): Promise<Organisation> {
    const id = customId || crypto.randomUUID();
    const now = new Date().toISOString();
    await db.execute(
      'INSERT INTO organisations (id, name, created_at, updated_at) VALUES ($1, $2, $3, $4)',
      [id, name, now, now]
    );
    return { id, name, created_at: now, updated_at: now };
  }

  async listOrganisations(): Promise<Organisation[]> {
    return db.query<Organisation>('SELECT id, name, created_at, updated_at FROM organisations ORDER BY created_at ASC');
  }

  async getMemberByOrgAndUser(orgId: string, userId: string): Promise<OrganisationMember | null> {
    const rows = await db.query<OrganisationMember>(
      'SELECT id, organisation_id, user_id, role, created_at FROM organisation_members WHERE organisation_id = $1 AND user_id = $2',
      [orgId, userId]
    );
    return rows[0] || null;
  }

  async addOrganisationMember(orgId: string, userId: string, role: 'owner' | 'admin' | 'member' = 'member'): Promise<OrganisationMember> {
    const existing = await this.getMemberByOrgAndUser(orgId, userId);
    if (existing) return existing;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.execute(
      'INSERT INTO organisation_members (id, organisation_id, user_id, role, created_at) VALUES ($1, $2, $3, $4, $5)',
      [id, orgId, userId, role, now]
    );
    return { id, organisation_id: orgId, user_id: userId, role, created_at: now };
  }

  // ==========================================
  // Integrations
  // ==========================================
  async getIntegrationByOrg(orgId: string, provider = 'woocommerce'): Promise<Integration | null> {
    const rows = await db.query<any>(
      'SELECT * FROM integrations WHERE organisation_id = $1 AND provider = $2',
      [orgId, provider]
    );
    if (!rows[0]) return null;
    return {
      ...rows[0],
      encrypted_credentials: parseJson(rows[0].encrypted_credentials, {}),
    };
  }

  async upsertIntegration(
    orgId: string,
    data: {
      provider?: string;
      store_url: string;
      encrypted_credentials: any;
      connection_status: 'connected' | 'disconnected' | 'error' | 'demo';
      last_sync_at?: string | null;
    }
  ): Promise<Integration> {
    const existing = await this.getIntegrationByOrg(orgId, data.provider || 'woocommerce');
    const now = new Date().toISOString();
    const credsJson = stringifyJson(data.encrypted_credentials);

    if (existing) {
      await db.execute(
        `UPDATE integrations 
         SET store_url = $1, encrypted_credentials = $2, connection_status = $3, last_sync_at = $4, updated_at = $5 
         WHERE id = $6`,
        [
          data.store_url,
          credsJson,
          data.connection_status,
          data.last_sync_at !== undefined ? data.last_sync_at : existing.last_sync_at,
          now,
          existing.id,
        ]
      );
      return (await this.getIntegrationByOrg(orgId, data.provider || 'woocommerce'))!;
    } else {
      const id = crypto.randomUUID();
      await db.execute(
        `INSERT INTO integrations 
         (id, organisation_id, provider, store_url, encrypted_credentials, connection_status, last_sync_at, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          id,
          orgId,
          data.provider || 'woocommerce',
          data.store_url,
          credsJson,
          data.connection_status,
          data.last_sync_at || null,
          now,
          now,
        ]
      );
      return (await this.getIntegrationByOrg(orgId, data.provider || 'woocommerce'))!;
    }
  }

  // ==========================================
  // Customers
  // ==========================================
  private mapCustomerRow(row: any): Customer {
    return {
      ...row,
      total_orders: Number(row.total_orders || 0),
      total_spent: Number(row.total_spent || 0),
      is_guest: Boolean(row.is_guest),
      billing_address: parseJson<Address>(row.billing_address, {}),
      shipping_address: parseJson<Address>(row.shipping_address, {}),
    };
  }

  async getCustomerById(orgId: string, id: string): Promise<Customer | null> {
    const rows = await db.query<any>(
      'SELECT * FROM customers WHERE organisation_id = $1 AND id = $2',
      [orgId, id]
    );
    return rows[0] ? this.mapCustomerRow(rows[0]) : null;
  }

  async getCustomerByExternalId(orgId: string, externalId: number): Promise<Customer | null> {
    const rows = await db.query<any>(
      'SELECT * FROM customers WHERE organisation_id = $1 AND external_customer_id = $2',
      [orgId, externalId]
    );
    return rows[0] ? this.mapCustomerRow(rows[0]) : null;
  }

  async getCustomerByEmail(orgId: string, email: string): Promise<Customer | null> {
    const rows = await db.query<any>(
      'SELECT * FROM customers WHERE organisation_id = $1 AND LOWER(email) = LOWER($2)',
      [orgId, email]
    );
    return rows[0] ? this.mapCustomerRow(rows[0]) : null;
  }

  async listCustomers(
    orgId: string,
    options: {
      search?: string;
      segment?: CustomerSegment;
      sortBy?: 'created_at' | 'total_spent' | 'total_orders' | 'last_order_at' | 'first_name';
      sortOrder?: 'asc' | 'desc';
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ customers: Customer[]; total: number }> {
    const conditions: string[] = ['organisation_id = $1'];
    const params: any[] = [orgId];
    let paramIndex = 2;

    if (options.search && options.search.trim()) {
      const searchPattern = `%${options.search.trim().toLowerCase()}%`;
      conditions.push(`(
        LOWER(first_name) LIKE $${paramIndex} OR 
        LOWER(last_name) LIKE $${paramIndex} OR 
        LOWER(email) LIKE $${paramIndex} OR 
        LOWER(COALESCE(phone, '')) LIKE $${paramIndex}
      )`);
      params.push(searchPattern);
      paramIndex++;
    }

    if (options.segment) {
      conditions.push(`segment = $${paramIndex}`);
      params.push(options.segment);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Total count
    const countSql = `SELECT COUNT(*) as count FROM customers WHERE ${whereClause}`;
    const countRes = await db.query<{ count: number }>(countSql, params);
    const total = Number(countRes[0]?.count || 0);

    // Sorting & pagination
    const validSortCols = ['created_at', 'total_spent', 'total_orders', 'last_order_at', 'first_name'];
    const sortBy = validSortCols.includes(options.sortBy || '') ? options.sortBy : 'created_at';
    const sortOrder = options.sortOrder === 'asc' ? 'ASC' : 'DESC';

    const limit = options.limit || 20;
    const offset = options.offset || 0;

    const dataSql = `
      SELECT * FROM customers 
      WHERE ${whereClause} 
      ORDER BY ${sortBy} ${sortOrder} 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const rows = await db.query<any>(dataSql, [...params, limit, offset]);

    return {
      customers: rows.map(this.mapCustomerRow),
      total,
    };
  }

  async upsertCustomer(
    orgId: string,
    customer: {
      external_customer_id?: number | null;
      first_name: string;
      last_name: string;
      email: string;
      phone?: string | null;
      billing_address?: Address;
      shipping_address?: Address;
      total_orders?: number;
      total_spent?: number;
      currency?: string;
      segment?: CustomerSegment;
      is_guest?: boolean;
      last_order_at?: string | null;
    }
  ): Promise<Customer> {
    const now = new Date().toISOString();
    let existing: Customer | null = null;

    if (customer.external_customer_id) {
      existing = await this.getCustomerByExternalId(orgId, customer.external_customer_id);
    }
    if (!existing && customer.email) {
      existing = await this.getCustomerByEmail(orgId, customer.email);
    }

    const billingJson = stringifyJson(customer.billing_address || {});
    const shippingJson = stringifyJson(customer.shipping_address || {});

    if (existing) {
      const updatedExternalId = customer.external_customer_id ?? existing.external_customer_id;
      const updatedFirstName = customer.first_name || existing.first_name;
      const updatedLastName = customer.last_name || existing.last_name;
      const updatedPhone = customer.phone ?? existing.phone;
      const updatedTotalOrders = customer.total_orders ?? existing.total_orders;
      const updatedTotalSpent = customer.total_spent ?? existing.total_spent;
      const updatedCurrency = customer.currency || existing.currency;
      const updatedSegment = customer.segment || existing.segment;
      const updatedLastOrderAt = customer.last_order_at ?? existing.last_order_at;
      const updatedIsGuest = customer.is_guest !== undefined ? (customer.is_guest ? 1 : 0) : (existing.is_guest ? 1 : 0);

      await db.execute(
        `UPDATE customers 
         SET external_customer_id = $1, first_name = $2, last_name = $3, phone = $4, 
             billing_address = $5, shipping_address = $6, total_orders = $7, total_spent = $8, 
             currency = $9, segment = $10, is_guest = $11, last_order_at = $12, updated_at = $13 
         WHERE id = $14`,
        [
          updatedExternalId,
          updatedFirstName,
          updatedLastName,
          updatedPhone,
          billingJson,
          shippingJson,
          updatedTotalOrders,
          updatedTotalSpent,
          updatedCurrency,
          updatedSegment,
          updatedIsGuest,
          updatedLastOrderAt,
          now,
          existing.id,
        ]
      );
      return (await this.getCustomerById(orgId, existing.id))!;
    } else {
      const id = crypto.randomUUID();
      const isGuestNum = customer.is_guest ? 1 : 0;
      await db.execute(
        `INSERT INTO customers 
         (id, organisation_id, external_customer_id, first_name, last_name, email, phone, 
          billing_address, shipping_address, total_orders, total_spent, currency, segment, is_guest, last_order_at, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
        [
          id,
          orgId,
          customer.external_customer_id ?? null,
          customer.first_name || '',
          customer.last_name || '',
          customer.email.toLowerCase().trim(),
          customer.phone || null,
          billingJson,
          shippingJson,
          customer.total_orders || 0,
          customer.total_spent || 0.0,
          customer.currency || 'USD',
          customer.segment || 'new',
          isGuestNum,
          customer.last_order_at || null,
          now,
          now,
        ]
      );
      return (await this.getCustomerById(orgId, id))!;
    }
  }

  // ==========================================
  // Orders & Items
  // ==========================================
  private mapOrderRow(row: any): Order {
    return {
      ...row,
      total_amount: Number(row.total_amount || 0),
    };
  }

  async getOrderById(orgId: string, id: string): Promise<Order | null> {
    const rows = await db.query<any>(
      'SELECT * FROM orders WHERE organisation_id = $1 AND id = $2',
      [orgId, id]
    );
    if (!rows[0]) return null;
    const order = this.mapOrderRow(rows[0]);
    order.items = await this.getOrderItems(order.id);
    if (order.customer_id) {
      order.customer = await this.getCustomerById(orgId, order.customer_id);
    }
    return order;
  }

  async getOrderByExternalId(orgId: string, externalOrderId: number): Promise<Order | null> {
    const rows = await db.query<any>(
      'SELECT * FROM orders WHERE organisation_id = $1 AND external_order_id = $2',
      [orgId, externalOrderId]
    );
    if (!rows[0]) return null;
    const order = this.mapOrderRow(rows[0]);
    order.items = await this.getOrderItems(order.id);
    return order;
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    const rows = await db.query<any>(
      'SELECT * FROM order_items WHERE order_id = $1',
      [orderId]
    );
    return rows.map((r) => ({
      ...r,
      quantity: Number(r.quantity),
      unit_price: Number(r.unit_price),
      total_price: Number(r.total_price),
    }));
  }

  async listOrders(
    orgId: string,
    options: {
      customerId?: string;
      search?: string;
      status?: string;
      sortBy?: 'placed_at' | 'total_amount' | 'order_number';
      sortOrder?: 'asc' | 'desc';
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ orders: Order[]; total: number }> {
    const conditions: string[] = ['o.organisation_id = $1'];
    const params: any[] = [orgId];
    let paramIndex = 2;

    if (options.customerId) {
      conditions.push(`o.customer_id = $${paramIndex}`);
      params.push(options.customerId);
      paramIndex++;
    }

    if (options.status) {
      conditions.push(`o.status = $${paramIndex}`);
      params.push(options.status);
      paramIndex++;
    }

    if (options.search && options.search.trim()) {
      const searchPattern = `%${options.search.trim().toLowerCase()}%`;
      conditions.push(`(
        LOWER(o.order_number) LIKE $${paramIndex} OR 
        LOWER(COALESCE(c.email, '')) LIKE $${paramIndex} OR 
        LOWER(COALESCE(c.first_name, '')) LIKE $${paramIndex} OR 
        LOWER(COALESCE(c.last_name, '')) LIKE $${paramIndex}
      )`);
      params.push(searchPattern);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    const countSql = `
      SELECT COUNT(*) as count 
      FROM orders o 
      LEFT JOIN customers c ON o.customer_id = c.id 
      WHERE ${whereClause}
    `;
    const countRes = await db.query<{ count: number }>(countSql, params);
    const total = Number(countRes[0]?.count || 0);

    const validSort = ['placed_at', 'total_amount', 'order_number'];
    const sortBy = validSort.includes(options.sortBy || '') ? `o.${options.sortBy}` : 'o.placed_at';
    const sortOrder = options.sortOrder === 'asc' ? 'ASC' : 'DESC';

    const limit = options.limit || 20;
    const offset = options.offset || 0;

    const dataSql = `
      SELECT o.*, c.first_name, c.last_name, c.email as customer_email 
      FROM orders o 
      LEFT JOIN customers c ON o.customer_id = c.id 
      WHERE ${whereClause} 
      ORDER BY ${sortBy} ${sortOrder} 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const rows = await db.query<any>(dataSql, [...params, limit, offset]);

    const orders: Order[] = rows.map((r) => {
      const order = this.mapOrderRow(r);
      if (r.customer_email) {
        order.customer = {
          id: r.customer_id,
          first_name: r.first_name || '',
          last_name: r.last_name || '',
          email: r.customer_email,
        } as Customer;
      }
      return order;
    });

    return { orders, total };
  }

  async upsertOrder(
    orgId: string,
    orderData: {
      external_order_id: number;
      customer_id: string | null;
      order_number: string;
      status: string;
      currency: string;
      total_amount: number;
      payment_method: string;
      placed_at: string;
    },
    items: Array<{
      external_product_id?: number | null;
      product_name: string;
      quantity: number;
      unit_price: number;
      total_price: number;
    }> = []
  ): Promise<Order> {
    const existing = await this.getOrderByExternalId(orgId, orderData.external_order_id);
    const now = new Date().toISOString();
    let orderId: string;

    if (existing) {
      orderId = existing.id;
      await db.execute(
        `UPDATE orders 
         SET customer_id = $1, order_number = $2, status = $3, currency = $4, 
             total_amount = $5, payment_method = $6, placed_at = $7, updated_at = $8 
         WHERE id = $9`,
        [
          orderData.customer_id,
          orderData.order_number,
          orderData.status,
          orderData.currency,
          orderData.total_amount,
          orderData.payment_method,
          orderData.placed_at,
          now,
          orderId,
        ]
      );
    } else {
      orderId = crypto.randomUUID();
      await db.execute(
        `INSERT INTO orders 
         (id, organisation_id, external_order_id, customer_id, order_number, status, currency, total_amount, payment_method, placed_at, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          orderId,
          orgId,
          orderData.external_order_id,
          orderData.customer_id,
          orderData.order_number,
          orderData.status,
          orderData.currency,
          orderData.total_amount,
          orderData.payment_method,
          orderData.placed_at,
          now,
          now,
        ]
      );
    }

    // Replace order items
    await db.execute('DELETE FROM order_items WHERE order_id = $1', [orderId]);
    for (const item of items) {
      const itemId = crypto.randomUUID();
      await db.execute(
        `INSERT INTO order_items 
         (id, order_id, external_product_id, product_name, quantity, unit_price, total_price) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          itemId,
          orderId,
          item.external_product_id ?? null,
          item.product_name,
          item.quantity,
          item.unit_price,
          item.total_price,
        ]
      );
    }

    return (await this.getOrderById(orgId, orderId))!;
  }

  // ==========================================
  // Recalculate Customer Totals & Segmentation
  // ==========================================
  async recalculateCustomerMetrics(orgId: string, customerId: string): Promise<void> {
    const orders = await db.query<any>(
      `SELECT total_amount, placed_at, status 
       FROM orders 
       WHERE organisation_id = $1 AND customer_id = $2 AND status NOT IN ('cancelled', 'failed')
       ORDER BY placed_at DESC`,
      [orgId, customerId]
    );

    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    const lastOrderAt = orders.length > 0 ? orders[0].placed_at : null;

    // Deterministic segmentation calculation:
    // - high_value: totalSpent >= 500
    // - inactive: last order placed > 60 days ago
    // - repeat: totalOrders >= 2
    // - new: 1 order placed within last 30 days or default
    let segment: CustomerSegment = 'new';
    const nowMs = Date.now();
    const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;

    if (totalSpent >= 500) {
      segment = 'high_value';
    } else if (lastOrderAt && nowMs - new Date(lastOrderAt).getTime() > sixtyDaysMs) {
      segment = 'inactive';
    } else if (totalOrders >= 2) {
      segment = 'repeat';
    } else {
      segment = 'new';
    }

    const now = new Date().toISOString();
    await db.execute(
      `UPDATE customers 
       SET total_orders = $1, total_spent = $2, last_order_at = $3, segment = $4, updated_at = $5 
       WHERE id = $6`,
      [totalOrders, totalSpent, lastOrderAt, segment, now, customerId]
    );
  }

  // ==========================================
  // Communications
  // ==========================================
  async listCommunications(
    orgId: string,
    options: { customerId?: string; status?: string; limit?: number } = {}
  ): Promise<Communication[]> {
    const conditions: string[] = ['c.organisation_id = $1'];
    const params: any[] = [orgId];
    let pIdx = 2;

    if (options.customerId) {
      conditions.push(`c.customer_id = $${pIdx}`);
      params.push(options.customerId);
      pIdx++;
    }
    if (options.status) {
      conditions.push(`c.status = $${pIdx}`);
      params.push(options.status);
      pIdx++;
    }

    const limit = options.limit || 50;
    const sql = `
      SELECT c.*, cust.first_name as cust_first, cust.last_name as cust_last, cust.email as cust_email
      FROM communications c
      JOIN customers cust ON c.customer_id = cust.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY c.created_at DESC
      LIMIT $${pIdx}
    `;
    const rows = await db.query<any>(sql, [...params, limit]);
    return rows.map((r) => ({
      ...r,
      generated_by_ai: Boolean(r.generated_by_ai),
      customer: {
        id: r.customer_id,
        first_name: r.cust_first,
        last_name: r.cust_last,
        email: r.cust_email,
      } as Customer,
    }));
  }

  async getCommunicationById(orgId: string, id: string): Promise<Communication | null> {
    const rows = await db.query<any>(
      'SELECT * FROM communications WHERE organisation_id = $1 AND id = $2',
      [orgId, id]
    );
    if (!rows[0]) return null;
    return {
      ...rows[0],
      generated_by_ai: Boolean(rows[0].generated_by_ai),
    };
  }

  async createCommunication(
    orgId: string,
    data: {
      customer_id: string;
      order_id?: string | null;
      channel?: 'email' | 'sms' | 'note';
      purpose?: string;
      subject: string;
      message: string;
      status?: 'draft' | 'pending_approval' | 'approved' | 'sent';
      generated_by_ai?: boolean;
    }
  ): Promise<Communication> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const genAiNum = data.generated_by_ai ? 1 : 0;
    await db.execute(
      `INSERT INTO communications 
       (id, organisation_id, customer_id, order_id, channel, purpose, subject, message, status, generated_by_ai, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        id,
        orgId,
        data.customer_id,
        data.order_id || null,
        data.channel || 'email',
        data.purpose || 'general',
        data.subject,
        data.message,
        data.status || 'draft',
        genAiNum,
        now,
        now,
      ]
    );
    return (await this.getCommunicationById(orgId, id))!;
  }

  async updateCommunicationStatus(
    orgId: string,
    id: string,
    status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'failed',
    approvedBy?: string
  ): Promise<Communication | null> {
    const now = new Date().toISOString();
    await db.execute(
      `UPDATE communications 
       SET status = $1, approved_by = $2, approved_at = $3, updated_at = $4 
       WHERE organisation_id = $5 AND id = $6`,
      [status, approvedBy || null, status === 'approved' || status === 'sent' ? now : null, now, orgId, id]
    );
    return this.getCommunicationById(orgId, id);
  }

  // ==========================================
  // Customer Notes
  // ==========================================
  async listCustomerNotes(orgId: string, customerId: string): Promise<CustomerNote[]> {
    return db.query<CustomerNote>(
      'SELECT * FROM customer_notes WHERE organisation_id = $1 AND customer_id = $2 ORDER BY created_at DESC',
      [orgId, customerId]
    );
  }

  async addCustomerNote(orgId: string, customerId: string, authorId: string, content: string): Promise<CustomerNote> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.execute(
      'INSERT INTO customer_notes (id, organisation_id, customer_id, author_id, content, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [id, orgId, customerId, authorId, content, now, now]
    );
    return {
      id,
      organisation_id: orgId,
      customer_id: customerId,
      author_id: authorId,
      content,
      created_at: now,
      updated_at: now,
    };
  }

  async deleteCustomerNote(orgId: string, noteId: string): Promise<void> {
    await db.execute('DELETE FROM customer_notes WHERE organisation_id = $1 AND id = $2', [orgId, noteId]);
  }

  // ==========================================
  // Activity Logs & Sync Logs
  // ==========================================
  async logActivity(orgId: string, actorId: string, entityType: any, entityId: string, action: string, metadata: any = {}): Promise<void> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.execute(
      'INSERT INTO activity_logs (id, organisation_id, actor_id, entity_type, entity_id, action, metadata, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [id, orgId, actorId, entityType, entityId, action, stringifyJson(metadata), now]
    );
  }

  async listActivityLogs(orgId: string, limit = 20): Promise<ActivityLog[]> {
    const rows = await db.query<any>(
      'SELECT * FROM activity_logs WHERE organisation_id = $1 ORDER BY created_at DESC LIMIT $2',
      [orgId, limit]
    );
    return rows.map((r) => ({
      ...r,
      metadata: parseJson(r.metadata, {}),
    }));
  }

  async createSyncLog(orgId: string, integrationId: string | null, syncType: string): Promise<SyncLog> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.execute(
      'INSERT INTO sync_logs (id, organisation_id, integration_id, sync_type, status, records_processed, error_message, started_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [id, orgId, integrationId, syncType, 'in_progress', 0, null, now]
    );
    return {
      id,
      organisation_id: orgId,
      integration_id: integrationId,
      sync_type: syncType as any,
      status: 'in_progress',
      records_processed: 0,
      error_message: null,
      started_at: now,
      completed_at: null,
    };
  }

  async updateSyncLog(id: string, status: 'completed' | 'failed', recordsProcessed: number, errorMessage?: string | null): Promise<void> {
    const now = new Date().toISOString();
    await db.execute(
      'UPDATE sync_logs SET status = $1, records_processed = $2, error_message = $3, completed_at = $4 WHERE id = $5',
      [status, recordsProcessed, errorMessage || null, now, id]
    );
  }

  // ==========================================
  // Dashboard Analytics
  // ==========================================
  async getDashboardAnalytics(orgId: string) {
    const customersCount = await db.query<{ count: number }>(
      'SELECT COUNT(*) as count FROM customers WHERE organisation_id = $1',
      [orgId]
    );
    const ordersCount = await db.query<{ count: number }>(
      'SELECT COUNT(*) as count FROM orders WHERE organisation_id = $1',
      [orgId]
    );
    const revenueSum = await db.query<{ total: number }>(
      `SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE organisation_id = $1 AND status NOT IN ('cancelled', 'failed')`,
      [orgId]
    );

    const totalCustomers = Number(customersCount[0]?.count || 0);
    const totalOrders = Number(ordersCount[0]?.count || 0);
    const totalRevenue = Number(revenueSum[0]?.total || 0);
    const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Recent orders
    const recentOrders = await this.listOrders(orgId, { limit: 5, sortBy: 'placed_at', sortOrder: 'desc' });

    // Recent customers
    const recentCustomers = await this.listCustomers(orgId, { limit: 5, sortBy: 'created_at', sortOrder: 'desc' });

    // Status breakdown
    const statusRows = await db.query<{ status: string; count: number }>(
      'SELECT status, COUNT(*) as count FROM orders WHERE organisation_id = $1 GROUP BY status',
      [orgId]
    );
    const statusDistribution = statusRows.map((r) => ({
      status: r.status,
      count: Number(r.count),
    }));

    // Customer segments breakdown
    const segmentRows = await db.query<{ segment: string; count: number }>(
      'SELECT segment, COUNT(*) as count FROM customers WHERE organisation_id = $1 GROUP BY segment',
      [orgId]
    );
    const segmentDistribution = segmentRows.map((r) => ({
      segment: r.segment,
      count: Number(r.count),
    }));

    // Monthly revenue trend (last 6 months / recent order dates)
    const trendRows = await db.query<{ date: string; amount: number }>(
      `SELECT SUBSTR(placed_at, 1, 10) as date, SUM(total_amount) as amount 
       FROM orders 
       WHERE organisation_id = $1 AND status NOT IN ('cancelled', 'failed')
       GROUP BY SUBSTR(placed_at, 1, 10) 
       ORDER BY date ASC 
       LIMIT 14`,
      [orgId]
    );
    const revenueTrends = trendRows.map((r) => ({
      date: r.date,
      revenue: Number(r.amount),
    }));

    return {
      totalCustomers,
      totalOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      aov: Math.round(aov * 100) / 100,
      recentOrders: recentOrders.orders,
      recentCustomers: recentCustomers.customers,
      statusDistribution,
      segmentDistribution,
      revenueTrends,
    };
  }
}

export const repo = new DatabaseRepository();
