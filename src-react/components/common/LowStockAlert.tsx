import { CAlert, CButton } from '@coreui/react';
import { FaExclamationTriangle } from 'react-icons/fa';

interface LowStockAlertProps {
  lowStockCount: number;
  outOfStockCount: number;
  onFilterLowStock: () => void;
}

export default function LowStockAlert({
  lowStockCount,
  outOfStockCount,
  onFilterLowStock,
}: LowStockAlertProps) {
  if (lowStockCount === 0 && outOfStockCount === 0) {
    return null;
  }

  return (
    <CAlert color="warning" className="mb-3">
      <div className="d-flex align-items-center justify-content-between">
        <div>
          <FaExclamationTriangle className="me-2" />
          {outOfStockCount > 0 && (
            <span className="me-3">
              <strong>{outOfStockCount}</strong> item{outOfStockCount !== 1 ? 's' : ''} out of stock
            </span>
          )}
          {lowStockCount > 0 && (
            <span>
              <strong>{lowStockCount}</strong> item{lowStockCount !== 1 ? 's' : ''} low stock
            </span>
          )}
        </div>
        <CButton color="warning" size="sm" onClick={onFilterLowStock}>
          View Low Stock
        </CButton>
      </div>
    </CAlert>
  );
}
