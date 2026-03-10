import { describe, it, expect } from 'vitest';
import type { Category, CategoryFormData } from './Category';

describe('Category types', () => {
  describe('Category interface', () => {
    it('accepts valid category', () => {
      const category: Category = {
        id: 1,
        name: 'Handguns',
        sortOrder: 0,
        inventoryTypeId: 2,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };
      expect(category.id).toBe(1);
      expect(category.name).toBe('Handguns');
      expect(category.inventoryTypeId).toBe(2);
    });
  });

  describe('CategoryFormData type', () => {
    it('includes only name, sortOrder, and inventoryTypeId', () => {
      const formData: CategoryFormData = {
        name: 'Red Dots',
        sortOrder: 0,
        inventoryTypeId: 4,
      };
      expect(formData.name).toBe('Red Dots');
      expect(formData).not.toHaveProperty('id');
      expect(formData).not.toHaveProperty('createdAt');
      expect(formData).not.toHaveProperty('updatedAt');
    });
  });
});
