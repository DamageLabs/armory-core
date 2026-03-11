import { Link } from 'react-router-dom';
import { Card, Row, Col, Badge, Button } from 'react-bootstrap';
import { FaEdit, FaTrash, FaLink } from 'react-icons/fa';
import { Item } from '../../types/Item';
import { InventoryType } from '../../types/InventoryType';
import { formatCurrency } from '../../utils/formatters';
import { LOW_STOCK_THRESHOLD } from '../../constants/config';

interface ItemCardGridProps {
  items: Item[];
  allItems: Item[];
  inventoryTypes: InventoryType[];
  lowStockTypeIds: Set<number>;
  onDelete: (item: Item) => void;
}

export default function ItemCardGrid({ items, allItems, inventoryTypes, lowStockTypeIds, onDelete }: ItemCardGridProps) {
  return (
    <Row xs={1} sm={2} lg={3} xl={4} className="g-3">
      {items.map((item) => {
        const typeName = inventoryTypes.find((t) => t.id === item.inventoryTypeId)?.name || '-';
        const parent = item.parentItemId ? allItems.find((p) => p.id === item.parentItemId) : null;
        const isLowStock = lowStockTypeIds.has(item.inventoryTypeId) && item.quantity <= LOW_STOCK_THRESHOLD;
        const isOutOfStock = lowStockTypeIds.has(item.inventoryTypeId) && item.quantity === 0;

        return (
          <Col key={item.id}>
            <Card className="h-100">
              {item.picture && (
                <Card.Img
                  variant="top"
                  src={item.picture}
                  alt={item.name}
                  style={{ height: '160px', objectFit: 'cover' }}
                />
              )}
              <Card.Body className="d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <Card.Title className="mb-0 fs-6">
                    <Link to={`/items/${item.id}`} className="text-decoration-none">
                      {item.name}
                    </Link>
                    {(item.childCount ?? 0) > 0 && (
                      <Badge bg="info" className="ms-1">{item.childCount}</Badge>
                    )}
                  </Card.Title>
                  <Badge bg="primary" className="ms-2 flex-shrink-0">{typeName}</Badge>
                </div>

                {parent && (
                  <div className="mb-2">
                    <Link to={`/items/${parent.id}`}>
                      <Badge bg="dark"><FaLink size={10} className="me-1" />{parent.name}</Badge>
                    </Link>
                  </div>
                )}

                {item.category && (
                  <div className="mb-2">
                    <Badge bg="secondary">{item.category}</Badge>
                  </div>
                )}

                <div className="mt-auto">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted small">Qty</span>
                    <span className={isOutOfStock ? 'text-danger fw-bold' : isLowStock ? 'text-warning fw-bold' : ''}>
                      {item.quantity}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted small">Unit</span>
                    <span>{formatCurrency(item.unitValue)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Total</span>
                    <span className="fw-bold">{formatCurrency(item.value)}</span>
                  </div>
                  {item.location && (
                    <div className="text-muted small mb-2">{item.location}</div>
                  )}
                </div>

                <div className="d-flex gap-1 mt-2">
                  <Link
                    to={`/items/${item.id}/edit`}
                    className="btn btn-sm btn-outline-primary flex-fill"
                    aria-label={`Edit ${item.name}`}
                  >
                    <FaEdit className="me-1" />Edit
                  </Link>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="flex-fill"
                    onClick={() => onDelete(item)}
                    aria-label={`Delete ${item.name}`}
                  >
                    <FaTrash className="me-1" />Delete
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
}
