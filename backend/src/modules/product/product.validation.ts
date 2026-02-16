import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(120),
    sku: z.string().min(1).max(30),
    barcode: z.string().optional(),
    category: z.string().min(1, 'Category ID is required'),
    price: z.object({
      cost: z.number().min(0),
      selling: z.number().min(0),
    }),
    stock: z.object({
      current: z.number().min(0).default(0),
      minimum: z.number().min(0).default(10),
    }),
    unit: z.enum(['pcs', 'kg', 'litre', 'box', 'pack']).default('pcs'),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    name: z.string().min(1).max(120).optional(),
    barcode: z.string().optional(),
    category: z.string().optional(),
    price: z
      .object({
        cost: z.number().min(0).optional(),
        selling: z.number().min(0).optional(),
      })
      .optional(),
    stock: z
      .object({
        current: z.number().min(0).optional(),
        minimum: z.number().min(0).optional(),
      })
      .optional(),
    unit: z.enum(['pcs', 'kg', 'litre', 'box', 'pack']).optional(),
    isActive: z.boolean().optional(),
  }),
});
