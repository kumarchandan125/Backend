import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(60),
    description: z.string().max(200).optional(),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    name: z.string().min(1).max(60).optional(),
    description: z.string().max(200).optional(),
  }),
});
