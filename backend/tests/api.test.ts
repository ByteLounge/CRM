import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { env } from '../src/config/env';
import { WooCommerceMockAdapter } from '../src/modules/integrations/woocommerce/adapters/woocommerce-mock.adapter';
import { verifyWooCommerceWebhookSignature } from '../src/modules/integrations/woocommerce/webhook.verifier';
import { wcService } from '../src/modules/integrations/woocommerce/woocommerce.service';
import { repo } from '../src/repositories/database.repository';

const app = createApp();

describe('FlowCRM API & Integration Test Suite', { timeout: 30000 }, () => {
  const testOrgA = 'a0000000-0000-4000-a000-000000000001';
  const testOrgB = 'b0000000-0000-4000-a000-000000000002';
  let tokenOrgA: string;
  let tokenOrgB: string;

  beforeAll(async () => {
    env.WOOCOMMERCE_MOCK_MODE = true;
    // Setup test organizations
    await repo.createOrganisation('Alpha Store', testOrgA);
    await repo.createOrganisation('Beta Store', testOrgB);

    await repo.addOrganisationMember(testOrgA, 'user_alpha', 'owner');
    await repo.addOrganisationMember(testOrgB, 'user_beta', 'owner');

    tokenOrgA = jwt.sign(
      { sub: 'user_alpha', email: 'alpha@example.com', orgId: testOrgA, role: 'owner' },
      env.SUPABASE_JWT_SECRET,
      { expiresIn: '1h' }
    );

    tokenOrgB = jwt.sign(
      { sub: 'user_beta', email: 'beta@example.com', orgId: testOrgB, role: 'owner' },
      env.SUPABASE_JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  // Test 1: Health check endpoint
  it('GET /api/health should return ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('FlowCRM API');
  });

  // Test 2: WooCommerce customer normalisation & order sync idempotency
  it('WooCommerce sync should import customers, orders, and calculate segments idempotently', async () => {
    const syncRes1 = await wcService.runFullSync(testOrgA);
    expect(syncRes1.success).toBe(true);
    expect(syncRes1.customersSynced).toBeGreaterThan(0);
    expect(syncRes1.ordersSynced).toBeGreaterThan(0);

    const customersAfter1 = await repo.listCustomers(testOrgA);
    const count1 = customersAfter1.total;

    // Run sync again - must be idempotent (no duplicate customers)
    const syncRes2 = await wcService.runFullSync(testOrgA);
    expect(syncRes2.success).toBe(true);

    const customersAfter2 = await repo.listCustomers(testOrgA);
    expect(customersAfter2.total).toBe(count1);
  }, 45000);

  // Test 3: Guest checkout orders reconciliation
  it('Guest checkout orders should create a guest customer without ID collision', async () => {
    const mockAdapter = new WooCommerceMockAdapter();
    const guestOrder = (await mockAdapter.fetchOrders()).orders.find((o) => o.customer_id === 0);
    expect(guestOrder).toBeDefined();

    const guestCustId = await wcService.upsertWcOrder(testOrgA, guestOrder!);
    expect(guestCustId).toBeTruthy();

    const guestCust = await repo.getCustomerById(testOrgA, guestCustId!);
    expect(guestCust).not.toBeNull();
    expect(guestCust?.is_guest).toBe(true);
    expect(guestCust?.email).toBe(guestOrder?.billing.email.toLowerCase().trim());
  });

  // Test 4: Organisation data isolation (Org A cannot see Org B's data)
  it('Multi-tenancy isolation: Org B should not see Org A customers', async () => {
    // Org A has synced customers
    const resA = await request(app)
      .get('/api/v1/customers')
      .set('Authorization', `Bearer ${tokenOrgA}`)
      .set('X-Organisation-ID', testOrgA);

    expect(resA.status).toBe(200);
    expect(resA.body.total).toBeGreaterThan(0);

    // Org B should have 0 customers before its own sync
    const resB = await request(app)
      .get('/api/v1/customers')
      .set('Authorization', `Bearer ${tokenOrgB}`)
      .set('X-Organisation-ID', testOrgB);

    expect(resB.status).toBe(200);
    expect(resB.body.total).toBe(0);
  });

  // Test 5: Customer search and filtering
  it('Customer directory search should filter by name or email', async () => {
    const res = await request(app)
      .get('/api/v1/customers?search=elena')
      .set('Authorization', `Bearer ${tokenOrgA}`)
      .set('X-Organisation-ID', testOrgA);

    expect(res.status).toBe(200);
    expect(res.body.customers.length).toBeGreaterThanOrEqual(1);
    expect(res.body.customers[0].first_name).toBe('Elena');
  });

  // Test 6: Order list and item inspection
  it('Order list should return orders with correct status and customer linkage', async () => {
    const res = await request(app)
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${tokenOrgA}`)
      .set('X-Organisation-ID', testOrgA);

    expect(res.status).toBe(200);
    expect(res.body.orders.length).toBeGreaterThan(0);

    const firstOrder = res.body.orders[0];
    const detailRes = await request(app)
      .get(`/api/v1/orders/${firstOrder.id}`)
      .set('Authorization', `Bearer ${tokenOrgA}`)
      .set('X-Organisation-ID', testOrgA);

    expect(detailRes.status).toBe(200);
    expect(detailRes.body.order.items.length).toBeGreaterThan(0);
  });

  // Test 7: Communication draft-and-approval workflow
  it('Communication workflow should enforce draft -> approval transition', async () => {
    const customers = await repo.listCustomers(testOrgA, { limit: 1 });
    const targetCust = customers.customers[0];

    // Create draft
    const createRes = await request(app)
      .post('/api/v1/communications')
      .set('Authorization', `Bearer ${tokenOrgA}`)
      .set('X-Organisation-ID', testOrgA)
      .send({
        customerId: targetCust.id,
        purpose: 'thank_you',
        subject: 'Thank you for choosing FlowCRM Store!',
        message: 'We appreciate your business.',
        status: 'draft',
      });

    expect(createRes.status).toBe(201);
    const commId = createRes.body.communication.id;
    expect(createRes.body.communication.status).toBe('draft');

    // Update status to approved
    const approveRes = await request(app)
      .patch(`/api/v1/communications/${commId}/status`)
      .set('Authorization', `Bearer ${tokenOrgA}`)
      .set('X-Organisation-ID', testOrgA)
      .send({ status: 'approved' });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.communication.status).toBe('approved');
    expect(approveRes.body.communication.approved_by).toBe('user_alpha');
  });

  // Test 8: FlowAI Customer Insights (Grounded schema validation)
  it('FlowAI insights should return structured behavioral metrics matching schema', async () => {
    const customers = await repo.listCustomers(testOrgA, { limit: 1 });
    const custId = customers.customers[0].id;

    const res = await request(app)
      .post('/api/v1/ai/insights')
      .set('Authorization', `Bearer ${tokenOrgA}`)
      .set('X-Organisation-ID', testOrgA)
      .send({ customerId: custId });

    expect(res.status).toBe(200);
    expect(res.body.summary).toBeDefined();
    expect(['low', 'medium', 'high']).toContain(res.body.churnRisk);
    expect(res.body.keyMetrics).toBeDefined();
    expect(typeof res.body.keyMetrics.totalSpent).toBe('number');
  }, 15000);

  // Test 9: FlowAI Retention Agent heuristic scanner
  it('FlowAI retention scan should identify churning opportunities', async () => {
    const res = await request(app)
      .post('/api/v1/ai/retention-scan')
      .set('Authorization', `Bearer ${tokenOrgA}`)
      .set('X-Organisation-ID', testOrgA);

    expect(res.status).toBe(200);
    expect(res.body.totalScanned).toBeGreaterThan(0);
    expect(Array.isArray(res.body.opportunities)).toBe(true);
  });

  // Test 10: Webhook signature verification
  it('WooCommerce webhook HMAC-SHA256 signature verification works correctly', () => {
    const payload = JSON.stringify({ id: 999, status: 'completed' });
    const secret = 'test_webhook_secret_key';

    const crypto = require('crypto');
    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('base64');

    expect(verifyWooCommerceWebhookSignature(payload, validSignature, secret)).toBe(true);
    expect(verifyWooCommerceWebhookSignature(payload, 'invalid_sig', secret)).toBe(false);
  });
});
