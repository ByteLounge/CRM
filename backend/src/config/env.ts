import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from root or local directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform((val) => parseInt(val, 10)).default('4000'),
  CLIENT_URL: z.string().default('http://localhost:5173'),

  // Database
  DATABASE_URL: z.string().optional(),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_JWT_SECRET: z.string().default('flowcrm-local-jwt-secret-key-32chars-min!'),

  // WooCommerce
  WOOCOMMERCE_MOCK_MODE: z.string().transform((val) => val === 'true').default('true'),
  WOOCOMMERCE_STORE_URL: z.string().default('https://demo.flowcrm.store'),
  WOOCOMMERCE_CONSUMER_KEY: z.string().default('ck_mock_flowcrm_key'),
  WOOCOMMERCE_CONSUMER_SECRET: z.string().default('cs_mock_flowcrm_secret'),
  WOOCOMMERCE_WEBHOOK_SECRET: z.string().default('flowcrm_webhook_secret_key_123'),

  // AI
  GEMINI_API_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
