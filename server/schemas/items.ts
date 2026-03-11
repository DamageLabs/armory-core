import { z } from 'zod';

export const createItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().default(''),
  quantity: z.number().int().min(0, 'Quantity cannot be negative').default(0),
  unitValue: z.number().min(0, 'Unit value cannot be negative').default(0),
  picture: z.string().nullable().default(null),
  category: z.string().default(''),
  location: z.string().default(''),
  barcode: z.string().default(''),
  reorderPoint: z.number().int().min(0, 'Reorder point cannot be negative').default(0),
  inventoryTypeId: z.number().int().positive().default(1),
  customFields: z.record(z.string(), z.unknown()).default({}),
  parentItemId: z.number().int().positive().nullable().default(null),
});

export const updateItemSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  quantity: z.number().int().min(0, 'Quantity cannot be negative').optional(),
  unitValue: z.number().min(0, 'Unit value cannot be negative').optional(),
  picture: z.string().nullable().optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  barcode: z.string().optional(),
  reorderPoint: z.number().int().min(0, 'Reorder point cannot be negative').optional(),
  inventoryTypeId: z.number().int().positive().optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
  parentItemId: z.number().int().positive().nullable().optional(),
});

const bulkItemSchema = z.object({
  name: z.string().default(''),
  description: z.string().default(''),
  quantity: z.number().default(0),
  unitValue: z.number().default(0),
  picture: z.string().nullable().default(null),
  category: z.string().default(''),
  location: z.string().default(''),
  barcode: z.string().default(''),
  reorderPoint: z.number().default(0),
  inventoryTypeId: z.number().default(1),
  customFields: z.record(z.string(), z.unknown()).default({}),
  parentItemId: z.number().nullable().default(null),
  id: z.number().optional(),
});

export const bulkCreateSchema = z.object({
  items: z.array(bulkItemSchema).min(1, 'Items array cannot be empty'),
});

export const bulkDeleteSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1, 'IDs array cannot be empty'),
});

export const bulkCategorySchema = z.object({
  ids: z.array(z.number().int().positive()).min(1, 'IDs array cannot be empty'),
  category: z.string({ error: 'Category is required' }),
});
