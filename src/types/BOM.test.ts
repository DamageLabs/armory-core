import { describe, it, expect } from 'vitest';
import type { BOMItem, BOM, BOMFormData, BOMCostBreakdown } from './BOM';

describe('BOM types', () => {
  describe('BOMItem interface', () => {
    it('accepts valid BOM item', () => {
      const item: BOMItem = { itemId: 1, quantity: 5, notes: 'Main board' };
      expect(item.itemId).toBe(1);
      expect(item.quantity).toBe(5);
    });
  });

  describe('BOM interface', () => {
    it('accepts valid BOM with items', () => {
      const bom: BOM = {
        id: 1,
        name: 'Sensor Kit',
        description: 'Basic sensor kit build',
        items: [
          { itemId: 1, quantity: 1, notes: '' },
          { itemId: 2, quantity: 3, notes: 'Spare included' },
        ],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };
      expect(bom.items).toHaveLength(2);
    });

    it('accepts BOM with empty items', () => {
      const bom: BOM = {
        id: 2,
        name: 'Empty BOM',
        description: '',
        items: [],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };
      expect(bom.items).toHaveLength(0);
    });
  });

  describe('BOMFormData type', () => {
    it('excludes id and timestamps', () => {
      const formData: BOMFormData = {
        name: 'New BOM',
        description: 'Desc',
        items: [{ itemId: 1, quantity: 2, notes: '' }],
      };
      expect(formData).not.toHaveProperty('id');
      expect(formData).not.toHaveProperty('createdAt');
    });
  });

  describe('BOMCostBreakdown interface', () => {
    it('accepts valid cost breakdown', () => {
      const breakdown: BOMCostBreakdown = {
        bomId: 1,
        totalCost: 45.90,
        itemCosts: [{
          itemId: 1,
          itemName: 'Arduino Uno',
          unitCost: 24.95,
          quantity: 1,
          lineCost: 24.95,
          available: 8,
          canBuild: true,
        }],
        canBuildQuantity: 8,
      };
      expect(breakdown.totalCost).toBe(45.90);
      expect(breakdown.itemCosts[0].canBuild).toBe(true);
    });
  });
});
