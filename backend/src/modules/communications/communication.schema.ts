import { z } from 'zod';

export const createCommunicationSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  orderId: z.string().optional().nullable(),
  channel: z.enum(['email', 'sms', 'note']).default('email'),
  purpose: z.enum([
    'order_followup',
    'thank_you',
    'customer_reengagement',
    'support_response',
    'general',
  ]).default('general'),
  subject: z.string().min(1, 'Subject is required').max(255),
  message: z.string().min(1, 'Message is required'),
  status: z.enum(['draft', 'pending_approval', 'approved', 'sent']).default('draft'),
  generatedByAi: z.boolean().default(false),
});

export const updateCommunicationStatusSchema = z.object({
  status: z.enum(['draft', 'pending_approval', 'approved', 'sent', 'failed']),
});
