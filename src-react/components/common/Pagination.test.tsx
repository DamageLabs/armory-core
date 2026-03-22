import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Pagination from './Pagination';

describe('Pagination', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 5,
    onPageChange: vi.fn(),
    totalItems: 50,
    itemsPerPage: 10,
  };

  it('renders nothing when totalPages is 1 or less', () => {
    const { container } = render(
      <Pagination {...defaultProps} totalPages={1} totalItems={10} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('displays correct item range', () => {
    render(<Pagination {...defaultProps} />);

    expect(screen.getByText(/Displaying 1 - 10 of 50 entries/)).toBeInTheDocument();
  });

  it('displays correct item range for middle page', () => {
    render(<Pagination {...defaultProps} currentPage={3} />);

    expect(screen.getByText(/Displaying 21 - 30 of 50 entries/)).toBeInTheDocument();
  });

  it('displays correct item range for last page with partial items', () => {
    render(
      <Pagination
        {...defaultProps}
        currentPage={5}
        totalItems={45}
      />
    );

    expect(screen.getByText(/Displaying 41 - 45 of 45 entries/)).toBeInTheDocument();
  });

  it('renders all page numbers', () => {
    render(<Pagination {...defaultProps} />);

    for (let i = 1; i <= 5; i++) {
      expect(screen.getByText(String(i))).toBeInTheDocument();
    }
  });

  it('highlights current page', () => {
    render(<Pagination {...defaultProps} currentPage={3} />);

    const page3Link = screen.getByText('3');
    expect(page3Link.closest('.page-item')).toHaveClass('active');
  });

  it('disables First and Prev buttons on first page', () => {
    render(<Pagination {...defaultProps} currentPage={1} />);

    const paginationItems = document.querySelectorAll('.page-item');
    // First and Prev are the first two items
    expect(paginationItems[0]).toHaveClass('disabled');
    expect(paginationItems[1]).toHaveClass('disabled');
  });

  it('disables Next and Last buttons on last page', () => {
    render(<Pagination {...defaultProps} currentPage={5} />);

    const paginationItems = document.querySelectorAll('.page-item');
    // Next and Last are the last two items
    const lastIndex = paginationItems.length - 1;
    expect(paginationItems[lastIndex - 1]).toHaveClass('disabled');
    expect(paginationItems[lastIndex]).toHaveClass('disabled');
  });

  it('calls onPageChange with correct page when clicking page number', () => {
    const onPageChange = vi.fn();
    render(<Pagination {...defaultProps} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByText('3'));

    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('calls onPageChange with 1 when clicking First', () => {
    const onPageChange = vi.fn();
    render(<Pagination {...defaultProps} currentPage={3} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByLabelText(/first/i));

    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('calls onPageChange with previous page when clicking Prev', () => {
    const onPageChange = vi.fn();
    render(<Pagination {...defaultProps} currentPage={3} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByLabelText(/previous/i));

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange with next page when clicking Next', () => {
    const onPageChange = vi.fn();
    render(<Pagination {...defaultProps} currentPage={3} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByLabelText(/next/i));

    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('calls onPageChange with last page when clicking Last', () => {
    const onPageChange = vi.fn();
    render(<Pagination {...defaultProps} currentPage={3} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByLabelText(/last/i));

    expect(onPageChange).toHaveBeenCalledWith(5);
  });
});
