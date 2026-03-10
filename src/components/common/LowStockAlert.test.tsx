import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LowStockAlert from './LowStockAlert';
import type { Item } from '../../types/Item';

const makeItem = (overrides: Partial<Item> = {}): Item => ({
  id: 1,
  name: 'Test',
  description: '',
  quantity: 10,
  unitValue: 5,
  value: 50,
  picture: null,
  category: 'Electronics',
  location: '',
  barcode: '',
  reorderPoint: 5,
  inventoryTypeId: 1,
  customFields: {},
  parentItemId: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('LowStockAlert', () => {
  it('returns null when no items are low or out of stock', () => {
    const { container } = render(
      <LowStockAlert items={[makeItem({ quantity: 10 })]} onFilterLowStock={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows out of stock count', () => {
    render(
      <LowStockAlert
        items={[makeItem({ quantity: 0 }), makeItem({ id: 2, quantity: 0 })]}
        onFilterLowStock={vi.fn()}
      />
    );
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText(/out of stock/)).toBeInTheDocument();
  });

  it('shows low stock count', () => {
    render(
      <LowStockAlert
        items={[makeItem({ quantity: 3 })]}
        onFilterLowStock={vi.fn()}
      />
    );
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText(/low stock/)).toBeInTheDocument();
  });

  it('calls onFilterLowStock when View Low Stock clicked', () => {
    const onFilter = vi.fn();
    render(
      <LowStockAlert
        items={[makeItem({ quantity: 0 })]}
        onFilterLowStock={onFilter}
      />
    );
    screen.getByText('View Low Stock').click();
    expect(onFilter).toHaveBeenCalledOnce();
  });

  it('respects custom threshold', () => {
    render(
      <LowStockAlert
        items={[makeItem({ quantity: 8 })]}
        onFilterLowStock={vi.fn()}
        threshold={10}
      />
    );
    expect(screen.getByText(/low stock/)).toBeInTheDocument();
  });

  it('filters by applicableTypeIds when provided', () => {
    const items = [
      makeItem({ id: 1, quantity: 0, inventoryTypeId: 1 }),
      makeItem({ id: 2, quantity: 0, inventoryTypeId: 2 }),
    ];
    render(
      <LowStockAlert
        items={items}
        onFilterLowStock={vi.fn()}
        applicableTypeIds={new Set([1])}
      />
    );
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText(/out of stock/)).toBeInTheDocument();
  });
});
