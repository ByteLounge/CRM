import { z } from 'zod';

export const customerInsightsRequestSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
});

export const customerInsightsResponseSchema = z.object({
  summary: z.string(),
  churnRisk: z.enum(['low', 'medium', 'high']),
  churnReason: z.string(),
  recommendedAction: z.string(),
  keyMetrics: z.object({
    totalOrders: z.number(),
    totalSpent: z.number(),
    averageOrderValue: z.number(),
    daysSinceLastOrder: z.number().nullable(),
    segment: z.string(),
  }),
});

export const generateCommunicationRequestSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  orderId: z.string().optional().nullable(),
  purpose: z.enum([
    'order_followup',
    'thank_you',
    'customer_reengagement',
    'support_response',
    'general',
  ]),
  channel: z.enum(['email', 'sms', 'note']).default('email'),
  tone: z.enum(['professional', 'friendly', 'urgent', 'appreciative']).default('friendly'),
  additionalInstructions: z.string().optional(),
});

export const generateCommunicationResponseSchema = z.object({
  subject: z.string(),
  message: z.string(),
  suggestedAction: z.string(),
  confidenceScore: z.number(),
});

export const retentionOpportunitySchema = z.object({
  customerId: z.string(),
  customerName: z.string(),
  customerEmail: z.string(),
  segment: z.string(),
  totalSpent: z.number(),
  daysInactive: z.number(),
  churnRisk: z.enum(['high', 'medium', 'low']),
  diagnosis: z.string(),
  suggestedOffer: z.string(),
  draftSubject: z.string(),
  draftMessage: z.string(),
});
