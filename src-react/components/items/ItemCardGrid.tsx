import { Link } from 'react-router-dom';
import { CCard, CCardBody, CRow, CCol, CBadge, CButton, CCardImage, CCardTitle } from '@coreui/react';
import { FaEdit, FaTrash, FaLink, FaBoxOpen, FaSearch, FaPlus } from 'react-icons/fa';
import { Item } from '../../types/Item';
import { InventoryType } from '../../types/InventoryType';
import { formatCurrency } from '../../utils/formatters';
import { LOW_STOCK_THRESHOLD } from '../../constants/config';
import { useTheme } from '../../contexts/ThemeContext';
import { getCategoryColor, getCategoryColorLight } from '../../utils/categoryColors';

interface ItemCardGridProps {
  items: Item[];
  allItems: Item[];
  inventoryTypes: InventoryType[];
  lowStockTypeIds: Set<number>;
  onDelete: (item: Item) => void;
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

// Empty state component for card view
function CardEmptyState({ hasFilters, onClearFilters }: { hasFilters?: boolean; onClearFilters?: () => void }) {
  if (hasFilters) {
    return (
      <div className="text-center py-5">
        <FaSearch size={48} className="text-muted mb-3" aria-hidden="true" />
        <h5 className="text-muted">No items match your search</h5>
        <p className="text-muted mb-4">Try adjusting your search or filter criteria.</p>
        {onClearFilters && (
          <CButton color="primary" variant="outline" onClick={onClearFilters}>
            Clear Filters
          </CButton>
        )}
      </div>
    );
  }

  return (
    <div className="text-center py-5">
      <FaBoxOpen size={48} className="text-muted mb-3" aria-hidden="true" />
      <h5 className="text-muted">Your inventory is empty</h5>
      <p className="text-muted mb-4">Get started by adding your first inventory item.</p>
      <Link to="/items/new" className="btn btn-primary">
        <FaPlus className="me-1" />
        Add First Item
      </Link>
    </div>
  );
}

export default function ItemCardGrid({ items, allItems, inventoryTypes, lowStockTypeIds, onDelete, hasFilters, onClearFilters }: ItemCardGridProps) {
  const { isDark } = useTheme();
  
  // Show empty state if no items
  if (items.length === 0) {
    return <CardEmptyState hasFilters={hasFilters} onClearFilters={onClearFilters} />;
  }

  return (
    <CRow xs={{ cols: 1 }} sm={{ cols: 2 }} lg={{ cols: 3 }} xl={{ cols: 4 }} className="g-3">
      {items.map((item) => {
        const typeName = inventoryTypes.find((t) => t.id === item.inventoryTypeId)?.name || '-';
        const parent = item.parentItemId ? allItems.find((p) => p.id === item.parentItemId) : null;
        const isLowStock = lowStockTypeIds.has(item.inventoryTypeId) && item.quantity <= LOW_STOCK_THRESHOLD;
        const isOutOfStock = lowStockTypeIds.has(item.inventoryTypeId) && item.quantity === 0;

        return (
          <CCol key={item.id}>
            <CCard className="h-100">
              {item.picture && (
                <CCardImage
                  orientation="top"
                  src={item.picture}
                  alt={item.name}
                  style={{ height: '160px', objectFit: 'cover' }}
                />
              )}
              <CCardBody className="d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <CCardTitle className="mb-0 fs-6">
                    <Link to={`/items/${item.id}`} className="text-decoration-none">
                      {item.name}
                    </Link>
                    {(item.childCount ?? 0) > 0 && (
                      <CBadge color="info" className="ms-1">{item.childCount}</CBadge>
                    )}
                  </CCardTitle>
                  <CBadge color="primary" className="ms-2 flex-shrink-0">{typeName}</CBadge>
                </div>

                {parent && (
                  <div className="mb-2">
                    <Link to={`/items/${parent.id}`}>
                      <CBadge color="dark"><FaLink size={10} className="me-1" />{parent.name}</CBadge>
                    </Link>
                  </div>
                )}

                {item.category && (
                  <div className="mb-2 d-flex align-items-center gap-1">
                    <div 
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: getCategoryColor(item.category, isDark),
                        flexShrink: 0
                      }}
                    />
                    <CBadge 
                      style={{
                        backgroundColor: getCategoryColorLight(item.category, isDark),
                        color: getCategoryColor(item.category, isDark),
                        border: `1px solid ${getCategoryColor(item.category, isDark)}`
                      }}
                    >
                      {item.category}
                    </CBadge>
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
                  <CButton
                    color="danger"
                    variant="outline"
                    size="sm"
                    className="flex-fill"
                    onClick={() => onDelete(item)}
                    aria-label={`Delete ${item.name}`}
                  >
                    <FaTrash className="me-1" />Delete
                  </CButton>
                </div>
              </CCardBody>
            </CCard>
          </CCol>
        );
      })}
    </CRow>
  );
}
