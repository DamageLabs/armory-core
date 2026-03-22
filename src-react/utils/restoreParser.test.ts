import { describe, it, expect } from 'vitest';
import { parseBackupJSON, parseBackupCSV, validateRestoreItems } from './restoreParser';

describe('parseBackupJSON', () => {
  it('parses valid JSON array', () => {
    const content = JSON.stringify([
      { id: 1, name: 'Glock 19', quantity: 2, unitValue: 550, category: 'Handguns', inventoryTypeId: 1 },
      { id: 2, name: '9mm Ammo', quantity: 500, unitValue: 0.30, category: 'Ammo', inventoryTypeId: 2 },
    ]);
    const items = parseBackupJSON(content);
    expect(items).toHaveLength(2);
    expect(items[0].name).toBe('Glock 19');
    expect(items[0].oldId).toBe(1);
    expect(items[0].quantity).toBe(2);
    expect(items[0].unitValue).toBe(550);
    expect(items[0].valid).toBe(true);
    expect(items[0].errors).toEqual([]);
  });

  it('returns empty array for invalid JSON', () => {
    expect(parseBackupJSON('not json')).toEqual([]);
  });

  it('returns empty array for non-array JSON', () => {
    expect(parseBackupJSON('{"name":"test"}')).toEqual([]);
  });

  it('handles missing fields with defaults', () => {
    const content = JSON.stringify([{ name: 'Test' }]);
    const items = parseBackupJSON(content);
    expect(items[0].quantity).toBe(0);
    expect(items[0].unitValue).toBe(0);
    expect(items[0].category).toBe('');
    expect(items[0].inventoryTypeId).toBe(1);
    expect(items[0].oldId).toBeUndefined();
  });

  it('preserves customFields', () => {
    const content = JSON.stringify([{ name: 'AR-15', customFields: { caliber: '5.56' } }]);
    const items = parseBackupJSON(content);
    expect(items[0].customFields).toEqual({ caliber: '5.56' });
  });

  it('handles parentItemId', () => {
    const content = JSON.stringify([
      { name: 'Parent', id: 1 },
      { name: 'Child', id: 2, parentItemId: 1 },
    ]);
    const items = parseBackupJSON(content);
    expect(items[0].parentItemId).toBeNull();
    expect(items[1].parentItemId).toBe(1);
  });
});

describe('parseBackupCSV', () => {
  it('parses valid CSV with headers', () => {
    const csv = `ID,Name,Description,Quantity,Unit Value,Category,Location,Inventory Type ID,Barcode,Reorder Point
1,Glock 19,A pistol,2,550,Handguns,Safe A,1,AC-0001,1
2,9mm Ammo,Federal,500,0.30,Ammo,Shelf B,2,AC-0002,50`;
    const items = parseBackupCSV(csv);
    expect(items).toHaveLength(2);
    expect(items[0].name).toBe('Glock 19');
    expect(items[0].oldId).toBe(1);
    expect(items[0].quantity).toBe(2);
    expect(items[0].unitValue).toBe(550);
    expect(items[0].location).toBe('Safe A');
  });

  it('maps custom field columns to customFields', () => {
    const csv = `ID,Name,Quantity,Unit Value,Category,Inventory Type ID,Serial Number,Caliber
1,AR-15,1,1200,Rifles,1,SN123,5.56`;
    const items = parseBackupCSV(csv);
    expect(items[0].customFields).toEqual({ 'Serial Number': 'SN123', 'Caliber': '5.56' });
  });

  it('returns empty array for empty CSV', () => {
    expect(parseBackupCSV('')).toEqual([]);
  });

  it('ignores known non-mapped headers like Total Value', () => {
    const csv = `ID,Name,Quantity,Unit Value,Total Value,Category,Inventory Type ID,Created At
1,Test,5,10,50,Cat,1,2026-01-01`;
    const items = parseBackupCSV(csv);
    expect(items).toHaveLength(1);
    expect(items[0].customFields).toEqual({});
  });
});

describe('validateRestoreItems', () => {
  it('marks items with empty name as invalid', () => {
    const items = parseBackupJSON(JSON.stringify([
      { name: '', quantity: 1, inventoryTypeId: 1 },
    ]));
    const validated = validateRestoreItems(items, [1]);
    expect(validated[0].valid).toBe(false);
    expect(validated[0].errors).toContain('Name is required');
  });

  it('marks items with invalid inventoryTypeId as invalid', () => {
    const items = parseBackupJSON(JSON.stringify([
      { name: 'Test', quantity: 1, inventoryTypeId: 99 },
    ]));
    const validated = validateRestoreItems(items, [1, 2]);
    expect(validated[0].valid).toBe(false);
    expect(validated[0].errors[0]).toContain('Invalid inventory type ID');
  });

  it('marks valid items as valid', () => {
    const items = parseBackupJSON(JSON.stringify([
      { name: 'Valid Item', quantity: 5, inventoryTypeId: 1 },
    ]));
    const validated = validateRestoreItems(items, [1, 2]);
    expect(validated[0].valid).toBe(true);
    expect(validated[0].errors).toEqual([]);
  });

  it('can report multiple errors', () => {
    const items = parseBackupJSON(JSON.stringify([
      { name: '', inventoryTypeId: 99 },
    ]));
    const validated = validateRestoreItems(items, [1]);
    expect(validated[0].errors).toHaveLength(2);
  });
});
