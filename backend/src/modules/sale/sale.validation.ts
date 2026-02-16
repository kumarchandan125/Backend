import { z } from 'zod';

export const createSaleSchema = z.object({
  body: z.object({
    items: z
      .array(
        z.object({
          product: z.string().min(1, 'Product ID is required'),
          quantity: z.number().int().min(1, 'Quantity must be at least 1'),
        })
      )
      .min(1, 'At least one item is required'),
    paymentMethod: z.enum(['cash', 'upi', 'card']).default('cash'),
  }),
});

export const salesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1).optional(),
    limit: z.coerce.number().min(1).max(100).default(20).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});
