import { describe, it, expect } from 'vitest';
import { validateTable, validateColumns, getValidTables, getValidColumns } from '../columns';

describe('columns', () => {
  describe('schema parsing', () => {
    it('extracts all expected tables', () => {
      const tables = getValidTables();
      expect(tables).toContain('items');
      expect(tables).toContain('users');
      expect(tables).toContain('categories');
      expect(tables).toContain('inventory_types');
      expect(tables).toContain('stock_history');
      expect(tables).toContain('cost_history');
      expect(tables).toContain('boms');
      expect(tables).toContain('item_templates');
      expect(tables).toContain('vendor_price_cache');
      expect(tables).toContain('email_rate_limits');
      expect(tables).toContain('app_metadata');
    });

    it('extracts correct columns for items table', () => {
      const columns = getValidColumns('items');
      expect(columns).toContain('id');
      expect(columns).toContain('name');
      expect(columns).toContain('description');
      expect(columns).toContain('quantity');
      expect(columns).toContain('unit_value');
      expect(columns).toContain('value');
      expect(columns).toContain('picture');
      expect(columns).toContain('category');
      expect(columns).toContain('location');
      expect(columns).toContain('barcode');
      expect(columns).toContain('reorder_point');
      expect(columns).toContain('inventory_type_id');
      expect(columns).toContain('custom_fields');
      expect(columns).toContain('parent_item_id');
      expect(columns).toContain('created_at');
      expect(columns).toContain('updated_at');
    });

    it('extracts correct columns for users table', () => {
      const columns = getValidColumns('users');
      expect(columns).toContain('id');
      expect(columns).toContain('email');
      expect(columns).toContain('password');
      expect(columns).toContain('role');
      expect(columns).toContain('sign_in_count');
      expect(columns).toContain('email_verified');
    });
  });

  describe('validateTable', () => {
    it('passes for valid table names', () => {
      expect(() => validateTable('items')).not.toThrow();
      expect(() => validateTable('users')).not.toThrow();
      expect(() => validateTable('categories')).not.toThrow();
    });

    it('throws for unknown table names', () => {
      expect(() => validateTable('nonexistent')).toThrow('Unknown table: "nonexistent"');
    });

    it('throws for table names with special characters', () => {
      expect(() => validateTable('items; DROP TABLE users')).toThrow('Invalid table name');
      expect(() => validateTable('items--')).toThrow('Invalid table name');
      expect(() => validateTable('items OR 1=1')).toThrow('Invalid table name');
    });

    it('throws for empty table name', () => {
      expect(() => validateTable('')).toThrow('Invalid table name');
    });
  });

  describe('validateColumns', () => {
    it('passes for valid columns', () => {
      expect(() => validateColumns('items', ['name', 'quantity', 'unit_value'])).not.toThrow();
    });

    it('throws for unknown columns', () => {
      expect(() => validateColumns('items', ['name', 'evil_column'])).toThrow(
        'Unknown column "evil_column" for table "items"'
      );
    });

    it('throws for columns with SQL injection characters', () => {
      expect(() => validateColumns('items', ['name; DROP TABLE items--'])).toThrow('Invalid column name');
      expect(() => validateColumns('items', ['name OR 1=1'])).toThrow('Invalid column name');
      expect(() => validateColumns('items', ['name,password'])).toThrow('Invalid column name');
    });

    it('throws for unknown table in column validation', () => {
      expect(() => validateColumns('fake_table', ['name'])).toThrow('Unknown table');
    });
  });
});
