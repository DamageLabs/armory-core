import { describe, it, expect } from 'vitest';
import type { StockChangeType, StockHistoryEntry, StockHistoryFilter } from './StockHistory';

describe('StockHistory types', () => {
  describe('StockChangeType', () => {
    it('accepts all valid change types', () => {
      const types: StockChangeType[] = ['created', 'updated', 'deleted', 'adjusted', 'category_changed'];
      expect(types).toHaveLength(5);
    });
  });

  describe('StockHistoryEntry interface', () => {
    it('accepts valid entry with all fields', () => {
      const entry: StockHistoryEntry = {
        id: 1,
        itemId: 10,
        itemName: 'Glock 19',
        changeType: 'adjusted',
        previousQuantity: 8,
        newQuantity: 12,
        previousValue: 199.60,
        newValue: 299.40,
        previousCategory: null,
        newCategory: null,
        notes: 'Restock',
        userId: 1,
        userEmail: 'admin@example.com',
        timestamp: '2026-01-01T00:00:00Z',
      };
      expect(entry.changeType).toBe('adjusted');
      expect(entry.previousQuantity).toBe(8);
    });

    it('accepts entry with null quantities (deleted)', () => {
      const entry: StockHistoryEntry = {
        id: 2,
        itemId: 10,
        itemName: 'Glock 19',
        changeType: 'deleted',
        previousQuantity: 8,
        newQuantity: null,
        previousValue: 199.60,
        newValue: null,
        previousCategory: null,
        newCategory: null,
        notes: '',
        userId: null,
        userEmail: null,
        timestamp: '2026-01-01T00:00:00Z',
      };
      expect(entry.newQuantity).toBeNull();
    });
  });

  describe('StockHistoryFilter interface', () => {
    it('accepts partial filter', () => {
      const filter: StockHistoryFilter = { changeType: 'created' };
      expect(filter.changeType).toBe('created');
      expect(filter.itemId).toBeUndefined();
    });

    it('accepts full filter', () => {
      const filter: StockHistoryFilter = {
        itemId: 1,
        changeType: 'updated',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        userId: 1,
      };
      expect(filter.startDate).toBe('2026-01-01');
    });

    it('accepts empty filter', () => {
      const filter: StockHistoryFilter = {};
      expect(Object.keys(filter)).toHaveLength(0);
    });
  });
});
