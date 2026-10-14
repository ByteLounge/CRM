import { z } from 'zod';

export const listOrdersQuerySchema = z.object({
  customerId: z.string().optional(),
  search: z.string().optional(),
  status: z.enum([
    'pending',
    'processing',
    'on-hold',
    'completed',
    'cancelled',
    'refunded',
    'failed',
  ]).optional(),
  sortBy: z.enum(['placed_at', 'total_amount', 'order_number']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.string().transform((val) => parseInt(val, 10)).optional(),
  offset: z.string().transform((val) => parseInt(val, 10)).optional(),
});
