import { describe, it, expect } from 'vitest';
import type { ItemTemplate, ItemTemplateFormData, ItemTemplateDefaultFields } from './ItemTemplate';

describe('ItemTemplate types', () => {
  describe('ItemTemplateDefaultFields interface', () => {
    it('accepts known fields', () => {
      const fields: ItemTemplateDefaultFields = {
        vendorName: 'Adafruit',
        vendorUrl: 'https://adafruit.com',
        location: 'Shelf A',
        reorderPoint: 5,
        description: 'Default desc',
      };
      expect(fields.vendorName).toBe('Adafruit');
    });

    it('accepts arbitrary custom fields via index signature', () => {
      const fields: ItemTemplateDefaultFields = {
        customKey: 'customValue',
        anotherKey: 42,
      };
      expect(fields['customKey']).toBe('customValue');
    });

    it('accepts empty fields', () => {
      const fields: ItemTemplateDefaultFields = {};
      expect(Object.keys(fields)).toHaveLength(0);
    });
  });

  describe('ItemTemplate interface', () => {
    it('accepts valid template', () => {
      const template: ItemTemplate = {
        id: 1,
        name: 'Arduino Template',
        category: 'Arduino',
        defaultFields: { vendorName: 'Adafruit', location: 'H1' },
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };
      expect(template.name).toBe('Arduino Template');
      expect(template.defaultFields.vendorName).toBe('Adafruit');
    });
  });

  describe('ItemTemplateFormData type', () => {
    it('excludes id and timestamps', () => {
      const formData: ItemTemplateFormData = {
        name: 'New Template',
        category: 'Sensors',
        defaultFields: { reorderPoint: 10 },
      };
      expect(formData).not.toHaveProperty('id');
      expect(formData).not.toHaveProperty('createdAt');
      expect(formData).not.toHaveProperty('updatedAt');
    });
  });
});
