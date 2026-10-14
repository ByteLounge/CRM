import cors from 'cors';
import express, { Express, Request, Response } from 'express';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import aiRoutes from './modules/ai/ai.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import authRoutes from './modules/auth/auth.routes';
import communicationRoutes from './modules/communications/communication.routes';
import customerRoutes from './modules/customers/customer.routes';
import woocommerceRoutes from './modules/integrations/woocommerce/woocommerce.routes';
import orderRoutes from './modules/orders/order.routes';

export function createApp(): Express {
  const app = express();

  // CORS
  app.use(
    cors({
      origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Organisation-ID', 'X-WC-Webhook-Topic', 'X-WC-Webhook-Signature'],
    })
  );

  // Preserve raw body for WooCommerce webhook signature verification
  app.use(
    express.json({
      verify: (req: Request, _res: Response, buf: Buffer) => {
        (req as any).rawBody = buf.toString();
      },
    })
  );
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'FlowCRM API',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      mockMode: env.WOOCOMMERCE_MOCK_MODE,
    });
  });

  // API v1 Modules
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/customers', customerRoutes);
  app.use('/api/v1/orders', orderRoutes);
  app.use('/api/v1/communications', communicationRoutes);
  app.use('/api/v1/integrations/woocommerce', woocommerceRoutes);
  app.use('/api/v1/analytics', analyticsRoutes);
  app.use('/api/v1/ai', aiRoutes);

  // Error Handler
  app.use(errorHandler);

  return app;
}
