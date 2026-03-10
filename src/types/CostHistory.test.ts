import { describe, it, expect } from 'vitest';
import type { CostHistoryEntry, CostStats } from './CostHistory';

describe('CostHistory types', () => {
  describe('CostHistoryEntry interface', () => {
    it('accepts valid entry', () => {
      const entry: CostHistoryEntry = {
        id: 1,
        itemId: 10,
        oldValue: 24.95,
        newValue: 29.95,
        source: 'manual',
        timestamp: '2026-01-01T00:00:00Z',
      };
      expect(entry.source).toBe('manual');
      expect(entry.newValue).toBe(29.95);
    });

    it('accepts all valid source types', () => {
      const sources: CostHistoryEntry['source'][] = ['manual', 'vendor_lookup', 'import'];
      expect(sources).toHaveLength(3);
    });
  });

  describe('CostStats interface', () => {
    it('accepts valid stats with upward trend', () => {
      const stats: CostStats = {
        min: 20.00,
        max: 35.00,
        avg: 27.50,
        current: 29.95,
        changeCount: 4,
        trend: 'up',
        firstRecorded: '2026-01-01T00:00:00Z',
        lastChanged: '2026-03-01T00:00:00Z',
      };
      expect(stats.trend).toBe('up');
      expect(stats.changeCount).toBe(4);
    });

    it('accepts all valid trend values', () => {
      const trends: CostStats['trend'][] = ['up', 'down', 'stable'];
      expect(trends).toHaveLength(3);
    });

    it('accepts stats with null dates', () => {
      const stats: CostStats = {
        min: 0, max: 0, avg: 0, current: 0,
        changeCount: 0, trend: 'stable',
        firstRecorded: null, lastChanged: null,
      };
      expect(stats.firstRecorded).toBeNull();
    });
  });
});
