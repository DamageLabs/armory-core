import { CPagination, CPaginationItem } from '@coreui/react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const pages: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div className="d-flex justify-content-between align-items-center mt-3">
      <div className="text-muted">
        Displaying {startItem} - {endItem} of {totalItems} entries
      </div>
      <CPagination className="mb-0">
        <CPaginationItem
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          aria-label="First"
        >
          &laquo;
        </CPaginationItem>
        <CPaginationItem
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous"
        >
          &lsaquo;
        </CPaginationItem>
        {pages.map((page) => (
          <CPaginationItem
            key={page}
            active={page === currentPage}
            onClick={() => onPageChange(page)}
          >
            {page}
          </CPaginationItem>
        ))}
        <CPaginationItem
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next"
        >
          &rsaquo;
        </CPaginationItem>
        <CPaginationItem
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Last"
        >
          &raquo;
        </CPaginationItem>
      </CPagination>
    </div>
  );
}
