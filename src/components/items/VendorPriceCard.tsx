import { useState } from 'react';
import { Card, Button, Spinner, Badge } from 'react-bootstrap';
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
    <Card className="mt-3">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h6 className="mb-0">Vendor Price Comparison</h6>
        <Button
          variant="outline-primary"
          size="sm"
          onClick={handleCompare}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Spinner size="sm" animation="border" className="me-1" />
              Loading...
            </>
          ) : (
            'Compare Prices'
          )}
        </Button>
      </Card.Header>
      {vendorPrices.length > 0 && (
        <Card.Body>
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
                          <Badge bg="success">{vp.stockQuantity} in stock</Badge>
                        ) : (
                          <Badge bg="danger">Out of Stock</Badge>
                        )}
                      </td>
                      <td>
                        <Badge bg={diff < 0 ? 'success' : diff > 0 ? 'danger' : 'secondary'}>
                          {diff > 0 ? '+' : ''}{formatCurrency(diff)}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card.Body>
      )}
    </Card>
  );
}
