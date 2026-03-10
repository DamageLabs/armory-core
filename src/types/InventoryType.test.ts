import { describe, it, expect } from 'vitest';
import type { FieldDefinition, InventoryType, InventoryTypeFormData, FieldType } from './InventoryType';

describe('InventoryType types', () => {
  describe('FieldDefinition interface', () => {
    it('accepts a text field', () => {
      const field: FieldDefinition = {
        key: 'modelNumber',
        label: 'Model Number',
        type: 'text',
        required: false,
        placeholder: 'e.g., R3',
      };
      expect(field.key).toBe('modelNumber');
      expect(field.type).toBe('text');
    });

    it('accepts a select field with options', () => {
      const field: FieldDefinition = {
        key: 'action',
        label: 'Action',
        type: 'select',
        required: false,
        options: ['Semi-Automatic', 'Bolt Action'],
      };
      expect(field.options).toHaveLength(2);
    });

    it('accepts all valid field types', () => {
      const types: FieldType[] = ['text', 'number', 'select', 'date', 'boolean'];
      expect(types).toHaveLength(5);
    });
  });

  describe('InventoryType interface', () => {
    it('accepts valid inventory type', () => {
      const type: InventoryType = {
        id: 1,
        name: 'Electronics',
        icon: 'FaMicrochip',
        schema: [{ key: 'model', label: 'Model', type: 'text', required: false }],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };
      expect(type.id).toBe(1);
      expect(type.schema).toHaveLength(1);
    });

    it('accepts empty schema', () => {
      const type: InventoryType = {
        id: 2,
        name: 'Custom',
        icon: '',
        schema: [],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };
      expect(type.schema).toHaveLength(0);
    });
  });

  describe('InventoryTypeFormData type', () => {
    it('includes only name, icon, and schema', () => {
      const formData: InventoryTypeFormData = {
        name: 'Firearms',
        icon: 'FaCrosshairs',
        schema: [],
      };
      expect(formData.name).toBe('Firearms');
      expect(formData).not.toHaveProperty('id');
      expect(formData).not.toHaveProperty('createdAt');
    });
  });
});
