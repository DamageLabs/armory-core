import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sortOrder: z.number().int().min(0).default(0),
  inventoryTypeId: z.number().int().positive().default(1),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  sortOrder: z.number().int().min(0).optional(),
  inventoryTypeId: z.number().int().positive().optional(),
});

export const reorderCategoriesSchema = z.object({
  orderedIds: z.array(z.number().int().positive()).min(1, 'Ordered IDs array cannot be empty'),
});
