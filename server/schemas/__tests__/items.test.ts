import { describe, it, expect } from 'vitest';
import {
  createItemSchema,
  updateItemSchema,
  bulkDeleteSchema,
  bulkCategorySchema,
  bulkCreateSchema,
} from '../items';

describe('item schemas', () => {
  describe('createItemSchema', () => {
    it('accepts valid complete body', () => {
      const result = createItemSchema.safeParse({
        name: 'Glock 19',
        description: 'A pistol',
        quantity: 5,
        unitValue: 599.99,
        category: 'Handguns',
        location: 'Safe 1',
        barcode: '123',
        reorderPoint: 2,
        inventoryTypeId: 1,
        customFields: { caliber: '9mm' },
        parentItemId: null,
        picture: null,
      });
      expect(result.success).toBe(true);
    });

    it('applies defaults for optional fields', () => {
      const result = createItemSchema.parse({ name: 'Test Item' });
      expect(result.quantity).toBe(0);
      expect(result.unitValue).toBe(0);
      expect(result.description).toBe('');
      expect(result.customFields).toEqual({});
      expect(result.parentItemId).toBeNull();
    });

    it('rejects missing name', () => {
      const result = createItemSchema.safeParse({ quantity: 5 });
      expect(result.success).toBe(false);
    });

    it('rejects empty name', () => {
      const result = createItemSchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });

    it('rejects negative quantity', () => {
      const result = createItemSchema.safeParse({ name: 'Test', quantity: -1 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Quantity cannot be negative');
      }
    });

    it('rejects negative unitValue', () => {
      const result = createItemSchema.safeParse({ name: 'Test', unitValue: -10 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Unit value cannot be negative');
      }
    });

    it('rejects non-integer quantity', () => {
      const result = createItemSchema.safeParse({ name: 'Test', quantity: 1.5 });
      expect(result.success).toBe(false);
    });

    it('rejects string for numeric field', () => {
      const result = createItemSchema.safeParse({ name: 'Test', quantity: 'abc' });
      expect(result.success).toBe(false);
    });
  });

  describe('updateItemSchema', () => {
    it('allows partial fields', () => {
      const result = updateItemSchema.safeParse({ name: 'Updated' });
      expect(result.success).toBe(true);
    });

    it('allows empty body', () => {
      const result = updateItemSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('rejects negative quantity', () => {
      const result = updateItemSchema.safeParse({ quantity: -5 });
      expect(result.success).toBe(false);
    });
  });

  describe('bulkDeleteSchema', () => {
    it('accepts valid ids array', () => {
      const result = bulkDeleteSchema.safeParse({ ids: [1, 2, 3] });
      expect(result.success).toBe(true);
    });

    it('rejects empty array', () => {
      const result = bulkDeleteSchema.safeParse({ ids: [] });
      expect(result.success).toBe(false);
    });

    it('rejects missing ids', () => {
      const result = bulkDeleteSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('rejects non-number ids', () => {
      const result = bulkDeleteSchema.safeParse({ ids: ['a', 'b'] });
      expect(result.success).toBe(false);
    });
  });

  describe('bulkCategorySchema', () => {
    it('accepts valid body', () => {
      const result = bulkCategorySchema.safeParse({ ids: [1, 2], category: 'Rifles' });
      expect(result.success).toBe(true);
    });

    it('rejects missing category', () => {
      const result = bulkCategorySchema.safeParse({ ids: [1] });
      expect(result.success).toBe(false);
    });

    it('rejects empty ids', () => {
      const result = bulkCategorySchema.safeParse({ ids: [], category: 'Rifles' });
      expect(result.success).toBe(false);
    });
  });

  describe('bulkCreateSchema', () => {
    it('accepts valid items array', () => {
      const result = bulkCreateSchema.safeParse({
        items: [{ name: 'Item 1', quantity: 5 }],
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty items array', () => {
      const result = bulkCreateSchema.safeParse({ items: [] });
      expect(result.success).toBe(false);
    });
  });
});
