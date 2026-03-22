import { describe, it, expect } from 'vitest';
import type { ItemTemplate, ItemTemplateFormData, ItemTemplateDefaultFields } from './ItemTemplate';

describe('ItemTemplate types', () => {
  describe('ItemTemplateDefaultFields interface', () => {
    it('accepts known fields', () => {
      const fields: ItemTemplateDefaultFields = {
        manufacturer: 'Brownells',
        location: 'Shelf A',
        reorderPoint: 5,
        description: 'Default desc',
      };
      expect(fields.manufacturer).toBe('Brownells');
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
        name: 'Handgun Template',
        category: 'Handguns',
        defaultFields: { manufacturer: 'Brownells', location: 'H1' },
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };
      expect(template.name).toBe('Handgun Template');
      expect(template.defaultFields.manufacturer).toBe('Brownells');
    });
  });

  describe('ItemTemplateFormData type', () => {
    it('excludes id and timestamps', () => {
      const formData: ItemTemplateFormData = {
        name: 'New Template',
        category: 'Rifles',
        defaultFields: { reorderPoint: 10 },
      };
      expect(formData).not.toHaveProperty('id');
      expect(formData).not.toHaveProperty('createdAt');
      expect(formData).not.toHaveProperty('updatedAt');
    });
  });
});
