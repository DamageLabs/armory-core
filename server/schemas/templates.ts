import { z } from 'zod';

export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  defaultFields: z.record(z.string(), z.unknown()).default({}),
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  category: z.string().min(1, 'Category is required').optional(),
  defaultFields: z.record(z.string(), z.unknown()).optional(),
});
