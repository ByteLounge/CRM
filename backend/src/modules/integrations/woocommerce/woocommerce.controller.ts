import { Request, Response } from 'express';
import { env } from '../../../config/env';
import { repo } from '../../../repositories/database.repository';
import { logger } from '../../../utils/logger';
import { verifyWooCommerceWebhookSignature } from './webhook.verifier';
import { wcService } from './woocommerce.service';

export class WooCommerceController {
  async getStatus(req: Request, res: Response): Promise<void> {
    const orgId = req.user!.orgId;
    const integration = await repo.getIntegrationByOrg(orgId, 'woocommerce');
    const adapter = await wcService.getAdapter(orgId);

    res.json({
      provider: 'woocommerce',
      connectionStatus: integration?.connection_status || (adapter.isMock ? 'demo' : 'disconnected'),
      isMock: adapter.isMock,
      storeUrl: integration?.store_url || (adapter.isMock ? 'https://demo.flowcrm.store' : env.WOOCOMMERCE_STORE_URL),
      lastSyncAt: integration?.last_sync_at || null,
      hasCredentials: Boolean(
        integration?.encrypted_credentials?.consumer_key &&
        integration?.encrypted_credentials?.consumer_secret
      ),
    });
  }

  async testConnection(req: Request, res: Response): Promise<void> {
    const orgId = req.user!.orgId;
    const result = await wcService.testConnection(orgId);
    res.json(result);
  }

  async updateSettings(req: Request, res: Response): Promise<void> {
    const orgId = req.user!.orgId;
    const { storeUrl, consumerKey, consumerSecret, isMock } = req.body;

    const current = await repo.getIntegrationByOrg(orgId, 'woocommerce');
    const creds = current?.encrypted_credentials || {};

    if (consumerKey) creds.consumer_key = consumerKey;
    if (consumerSecret) creds.consumer_secret = consumerSecret;
    if (isMock !== undefined) creds.is_mock = Boolean(isMock);

    const updated = await repo.upsertIntegration(orgId, {
      store_url: storeUrl || current?.store_url || env.WOOCOMMERCE_STORE_URL,
      encrypted_credentials: creds,
      connection_status: isMock ? 'demo' : 'connected',
    });

    res.json({
      success: true,
      integration: {
        id: updated.id,
        storeUrl: updated.store_url,
        connectionStatus: updated.connection_status,
        isMock: creds.is_mock,
      },
    });
  }

  async triggerSync(req: Request, res: Response): Promise<void> {
    const orgId = req.user!.orgId;
    const result = await wcService.runFullSync(orgId);
    res.json(result);
  }

  async handleWebhook(req: Request, res: Response): Promise<void> {
    const orgId = (req.query.orgId as string) || (req.headers['x-organisation-id'] as string) || 'org_default_01';
    const topic = (req.headers['x-wc-webhook-topic'] as string) || '';
    const signature = (req.headers['x-wc-webhook-signature'] as string) || '';

    // Verify webhook signature
    const integration = await repo.getIntegrationByOrg(orgId, 'woocommerce');
    const secret =
      integration?.encrypted_credentials?.webhook_secret || env.WOOCOMMERCE_WEBHOOK_SECRET;

    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const isValid = verifyWooCommerceWebhookSignature(rawBody, signature, secret);

    if (!isValid && process.env.NODE_ENV === 'production') {
      logger.warn(`Invalid WooCommerce webhook signature for topic: ${topic}`);
      res.status(401).json({ error: 'Invalid webhook signature' });
      return;
    }

    try {
      const result = await wcService.processWebhook(orgId, topic, req.body);
      res.json({ success: true, ...result });
    } catch (err: any) {
      logger.error(`Webhook processing failure: ${err.message}`);
      res.status(500).json({ error: 'Webhook processing failed', details: err.message });
    }
  }
}

export const wcController = new WooCommerceController();
