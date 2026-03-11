import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LowStockAlert from './LowStockAlert';

describe('LowStockAlert', () => {
  it('returns null when no items are low or out of stock', () => {
    const { container } = render(
      <LowStockAlert lowStockCount={0} outOfStockCount={0} onFilterLowStock={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows out of stock count', () => {
    render(
      <LowStockAlert lowStockCount={0} outOfStockCount={2} onFilterLowStock={vi.fn()} />
    );
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText(/out of stock/)).toBeInTheDocument();
  });

  it('shows low stock count', () => {
    render(
      <LowStockAlert lowStockCount={1} outOfStockCount={0} onFilterLowStock={vi.fn()} />
    );
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText(/low stock/)).toBeInTheDocument();
  });

  it('calls onFilterLowStock when View Low Stock clicked', () => {
    const onFilter = vi.fn();
    render(
      <LowStockAlert lowStockCount={0} outOfStockCount={1} onFilterLowStock={onFilter} />
    );
    screen.getByText('View Low Stock').click();
    expect(onFilter).toHaveBeenCalledOnce();
  });

  it('shows both low stock and out of stock counts', () => {
    render(
      <LowStockAlert lowStockCount={3} outOfStockCount={2} onFilterLowStock={vi.fn()} />
    );
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText(/out of stock/)).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText(/low stock/)).toBeInTheDocument();
  });
});
