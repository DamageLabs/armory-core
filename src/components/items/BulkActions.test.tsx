import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import BulkActions from './BulkActions';
import * as categoryService from '../../services/categoryService';

vi.mock('../../services/categoryService');

describe('BulkActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(categoryService.getCategoryNames).mockResolvedValue(['Handguns', 'Rifles']);
  });

  it('returns null when selectedCount is 0', () => {
    const { container } = render(
      <BulkActions selectedCount={0} onDelete={vi.fn()} onCategoryChange={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows selected count text', () => {
    render(
      <BulkActions selectedCount={3} onDelete={vi.fn()} onCategoryChange={vi.fn()} />
    );
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText(/items selected/)).toBeInTheDocument();
  });

  it('shows singular text for 1 item', () => {
    render(
      <BulkActions selectedCount={1} onDelete={vi.fn()} onCategoryChange={vi.fn()} />
    );
    expect(screen.getByText(/item selected/)).toBeInTheDocument();
  });

  it('calls onDelete when Delete Selected clicked', () => {
    const onDelete = vi.fn();
    render(
      <BulkActions selectedCount={2} onDelete={onDelete} onCategoryChange={vi.fn()} />
    );
    screen.getByText('Delete Selected').click();
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('renders Change Category button', () => {
    render(
      <BulkActions selectedCount={1} onDelete={vi.fn()} onCategoryChange={vi.fn()} />
    );
    expect(screen.getByText('Change Category')).toBeInTheDocument();
  });
});
