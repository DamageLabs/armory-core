import { useState } from 'react';
import { CCard, CCardHeader, CCardBody, CButton, CSpinner, CBadge } from '@coreui/react';
import * as vendorService from '../../services/vendorService';
import { VendorPriceResult } from '../../types/Vendor';
import { useAlert } from '../../contexts/AlertContext';

interface VendorPriceCardProps {
  partNumber: string;
  unitValue: number;
}

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

export default function VendorPriceCard({ partNumber, unitValue }: VendorPriceCardProps) {
  const { showError } = useAlert();
  const [vendorPrices, setVendorPrices] = useState<VendorPriceResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleCompare = async () => {
    setIsLoading(true);
    try {
      const prices = await vendorService.compareVendorPrices(partNumber);
      setVendorPrices(prices);
    } catch {
      showError('Failed to fetch vendor prices.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CCard className="mt-3">
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <h6 className="mb-0">Vendor Price Comparison</h6>
        <CButton
          color="primary"
          variant="outline"
          size="sm"
          onClick={handleCompare}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <CSpinner size="sm" className="me-1" />
              Loading...
            </>
          ) : (
            'Compare Prices'
          )}
        </CButton>
      </CCardHeader>
      {vendorPrices.length > 0 && (
        <CCardBody>
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>vs. Current</th>
                </tr>
              </thead>
              <tbody>
                {vendorPrices.map((vp, i) => {
                  const diff = vp.price - unitValue;
                  return (
                    <tr key={i}>
                      <td>
                        {vp.vendorUrl ? (
                          <a href={vp.vendorUrl} target="_blank" rel="noopener noreferrer">
                            {vp.vendor}
                          </a>
                        ) : (
                          vp.vendor
                        )}
                      </td>
                      <td>{formatCurrency(vp.price)}</td>
                      <td>
                        {vp.inStock ? (
                          <CBadge color="success">{vp.stockQuantity} in stock</CBadge>
                        ) : (
                          <CBadge color="danger">Out of Stock</CBadge>
                        )}
                      </td>
                      <td>
                        <CBadge color={diff < 0 ? 'success' : diff > 0 ? 'danger' : 'secondary'}>
                          {diff > 0 ? '+' : ''}{formatCurrency(diff)}
                        </CBadge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CCardBody>
      )}
    </CCard>
  );
}
