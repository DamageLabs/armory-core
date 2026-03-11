import { describe, it, expect } from 'vitest';
import {
  toSnakeCase,
  toCamelCase,
  mapRowToEntity,
  mapEntityToRow,
  buildInsertSQL,
  buildUpdateSQL,
} from '../mapper';

describe('mapper', () => {
  describe('toSnakeCase', () => {
    it('converts camelCase to snake_case', () => {
      expect(toSnakeCase('unitValue')).toBe('unit_value');
      expect(toSnakeCase('parentItemId')).toBe('parent_item_id');
      expect(toSnakeCase('name')).toBe('name');
    });
  });

  describe('toCamelCase', () => {
    it('converts snake_case to camelCase', () => {
      expect(toCamelCase('unit_value')).toBe('unitValue');
      expect(toCamelCase('parent_item_id')).toBe('parentItemId');
      expect(toCamelCase('name')).toBe('name');
    });
  });

  describe('mapRowToEntity', () => {
    it('converts snake_case row to camelCase entity', () => {
      const row = { unit_value: 10, parent_item_id: null };
      const entity = mapRowToEntity<{ unitValue: number; parentItemId: null }>(row);
      expect(entity).toEqual({ unitValue: 10, parentItemId: null });
    });

    it('parses JSON fields', () => {
      const row = { custom_fields: '{"key":"value"}' };
      const entity = mapRowToEntity<{ customFields: Record<string, unknown> }>(row, ['customFields']);
      expect(entity.customFields).toEqual({ key: 'value' });
    });
  });

  describe('mapEntityToRow', () => {
    it('converts camelCase entity to snake_case row', () => {
      const entity = { unitValue: 10, parentItemId: null };
      const row = mapEntityToRow(entity);
      expect(row).toEqual({ unit_value: 10, parent_item_id: null });
    });

    it('stringifies JSON fields', () => {
      const entity = { customFields: { key: 'value' } };
      const row = mapEntityToRow(entity, ['customFields']);
      expect(row.custom_fields).toBe('{"key":"value"}');
    });
  });

  describe('buildInsertSQL', () => {
    it('builds valid INSERT SQL for known columns', () => {
      const data = { name: 'Test', quantity: 5, unitValue: 10 };
      const { sql, params } = buildInsertSQL('items', data);
      expect(sql).toBe('INSERT INTO items (name, quantity, unit_value) VALUES (?, ?, ?)');
      expect(params).toEqual(['Test', 5, 10]);
    });

    it('throws for unknown column names', () => {
      const data = { name: 'Test', evilColumn: 'hack' };
      expect(() => buildInsertSQL('items', data)).toThrow('Unknown column "evil_column" for table "items"');
    });

    it('throws for columns with injection characters', () => {
      const data = { 'name; DROP TABLE items--': 'hack' };
      expect(() => buildInsertSQL('items', data)).toThrow('Invalid column name');
    });

    it('throws for unknown table', () => {
      const data = { name: 'Test' };
      expect(() => buildInsertSQL('fake_table', data)).toThrow('Unknown table');
    });
  });

  describe('buildUpdateSQL', () => {
    it('builds valid UPDATE SQL for known columns', () => {
      const data = { name: 'Updated', quantity: 10 };
      const { sql, params } = buildUpdateSQL('items', data, 'id = ?', [1]);
      expect(sql).toBe('UPDATE items SET name = ?, quantity = ? WHERE id = ?');
      expect(params).toEqual(['Updated', 10, 1]);
    });

    it('throws for unknown column names', () => {
      const data = { name: 'Test', badField: 'hack' };
      expect(() => buildUpdateSQL('items', data, 'id = ?', [1])).toThrow(
        'Unknown column "bad_field" for table "items"'
      );
    });

    it('throws for columns with injection characters', () => {
      const data = { 'name OR 1=1': 'hack' };
      expect(() => buildUpdateSQL('items', data, 'id = ?', [1])).toThrow('Invalid column name');
    });

    it('throws for unknown table', () => {
      const data = { name: 'Test' };
      expect(() => buildUpdateSQL('nonexistent', data, 'id = ?', [1])).toThrow('Unknown table');
    });
  });
});
