import { z } from 'zod';

export const listCustomersQuerySchema = z.object({
  search: z.string().optional(),
  segment: z.enum(['new', 'repeat', 'high_value', 'inactive']).optional(),
  sortBy: z.enum(['created_at', 'total_spent', 'total_orders', 'last_order_at', 'first_name']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.string().transform((val) => parseInt(val, 10)).optional(),
  offset: z.string().transform((val) => parseInt(val, 10)).optional(),
});

export const addCustomerNoteSchema = z.object({
  content: z.string().min(1, 'Note content cannot be empty').max(2000),
});
