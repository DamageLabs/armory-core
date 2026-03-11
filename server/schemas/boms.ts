import { z } from 'zod';

const bomItemSchema = z.object({
  itemId: z.number().int().positive(),
  quantity: z.number().int().min(1).default(1),
});

export const createBomSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().default(''),
  items: z.array(bomItemSchema).default([]),
});

export const updateBomSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  items: z.array(bomItemSchema).optional(),
});

export const duplicateBomSchema = z.object({
  name: z.string().optional(),
});
