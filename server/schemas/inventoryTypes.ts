import { z } from 'zod';

const fieldDefinitionSchema = z.object({
  name: z.string(),
  label: z.string(),
  type: z.string(),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
});

export const createInventoryTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  icon: z.string().default(''),
  schema: z.array(fieldDefinitionSchema).default([]),
});

export const updateInventoryTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  icon: z.string().optional(),
  schema: z.array(fieldDefinitionSchema).optional(),
});
