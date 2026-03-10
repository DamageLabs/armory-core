import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ItemFilters from './ItemFilters';
import * as categoryService from '../../services/categoryService';
import * as inventoryTypeService from '../../services/inventoryTypeService';

vi.mock('../../services/categoryService');
vi.mock('../../services/inventoryTypeService');

describe('ItemFilters', () => {
  const defaultProps = {
    searchTerm: '',
    onSearchChange: vi.fn(),
    categoryFilter: '',
    onCategoryChange: vi.fn(),
    typeFilter: '',
    onTypeChange: vi.fn(),
    onReset: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(inventoryTypeService.getAllTypes).mockResolvedValue([
      { id: 1, name: 'Electronics', icon: 'FaMicrochip', schema: [], createdAt: '', updatedAt: '' },
    ]);
    vi.mocked(categoryService.getCategoryNames).mockResolvedValue(['Resistors', 'Capacitors']);
    vi.mocked(categoryService.getCategoryNamesByType).mockResolvedValue(['Resistors']);
  });

  it('renders search input with placeholder', async () => {
    render(<ItemFilters {...defaultProps} />);
    expect(screen.getByPlaceholderText(/search by name/i)).toBeInTheDocument();
  });

  it('loads and displays inventory types', async () => {
    render(<ItemFilters {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });
  });

  it('loads categories on mount', async () => {
    render(<ItemFilters {...defaultProps} />);
    await waitFor(() => {
      expect(categoryService.getCategoryNames).toHaveBeenCalled();
    });
  });

  it('calls onSearchChange when typing', () => {
    render(<ItemFilters {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/search by name/i), { target: { value: 'test' } });
    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('test');
  });

  it('calls onReset when Reset clicked', async () => {
    render(<ItemFilters {...defaultProps} searchTerm="test" />);
    screen.getByText('Reset').click();
    expect(defaultProps.onReset).toHaveBeenCalledOnce();
  });

  it('disables Reset when no filters active', () => {
    render(<ItemFilters {...defaultProps} />);
    expect(screen.getByText('Reset').closest('button')).toBeDisabled();
  });

  it('enables Reset when filters are active', () => {
    render(<ItemFilters {...defaultProps} searchTerm="test" />);
    expect(screen.getByText('Reset').closest('button')).not.toBeDisabled();
  });
});
