import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ParentItemSelector from './ParentItemSelector';
import * as itemService from '../../services/itemService';

vi.mock('../../services/itemService');

const mockItems = [
  {
    id: 1, name: 'Glock 19', description: '', quantity: 1, unitValue: 500,
    value: 500, picture: null, category: 'Handguns', location: '',
    barcode: '', reorderPoint: 0, inventoryTypeId: 2, customFields: {},
    parentItemId: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 2, name: 'Sig P365', description: '', quantity: 5, unitValue: 25,
    value: 125, picture: null, category: 'Handguns', location: '',
    barcode: '', reorderPoint: 0, inventoryTypeId: 2, customFields: {},
    parentItemId: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 3, name: 'TLR-7A', description: '', quantity: 1, unitValue: 120,
    value: 120, picture: null, category: 'Weapon Lights', location: '',
    barcode: '', reorderPoint: 0, inventoryTypeId: 5, customFields: {},
    parentItemId: 1, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
];

describe('ParentItemSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(itemService.getAllItems).mockResolvedValue(mockItems);
  });

  it('renders with "None" default option', async () => {
    render(<ParentItemSelector value={null} onChange={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('None (standalone item)')).toBeInTheDocument();
    });
  });

  it('loads and displays items grouped by category', async () => {
    render(<ParentItemSelector value={null} onChange={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Glock 19')).toBeInTheDocument();
      expect(screen.getByText('Sig P365')).toBeInTheDocument();
    });
  });

  it('excludes current item from options', async () => {
    render(<ParentItemSelector value={null} onChange={vi.fn()} currentItemId={1} />);
    await waitFor(() => {
      expect(screen.queryByText('Glock 19')).not.toBeInTheDocument();
      expect(screen.getByText('Sig P365')).toBeInTheDocument();
    });
  });

  it('excludes children of current item', async () => {
    render(<ParentItemSelector value={null} onChange={vi.fn()} currentItemId={1} />);
    await waitFor(() => {
      expect(screen.queryByText('TLR-7A')).not.toBeInTheDocument();
    });
  });

  it('calls onChange with parsed ID when selection changes', async () => {
    const onChange = vi.fn();
    render(<ParentItemSelector value={null} onChange={onChange} />);
    await waitFor(() => {
      expect(screen.getByText('Glock 19')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('calls onChange with null when "None" selected', async () => {
    const onChange = vi.fn();
    render(<ParentItemSelector value={1} onChange={onChange} />);
    await waitFor(() => {
      expect(screen.getByText('Glock 19')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '' } });
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
