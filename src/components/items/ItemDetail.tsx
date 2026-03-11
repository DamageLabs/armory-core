import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Row, Col, Button, ButtonGroup, Badge } from 'react-bootstrap';
import * as itemService from '../../services/itemService';
import * as inventoryTypeService from '../../services/inventoryTypeService';
import { Item } from '../../types/Item';
import { InventoryType } from '../../types/InventoryType';
import { useAlert } from '../../contexts/AlertContext';
import ConfirmModal from '../common/ConfirmModal';
import CostHistoryChart from './CostHistoryChart';
import ChildItemsList from './ChildItemsList';
import VendorPriceCard from './VendorPriceCard';
import Breadcrumbs from '../common/Breadcrumbs';
import { SkeletonDetailPage } from '../common/Skeleton';
import ReceiptList from './ReceiptList';

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useAlert();
  const [item, setItem] = useState<Item | null>(null);
  const [parentItem, setParentItem] = useState<Item | null>(null);
  const [parentType, setParentType] = useState<InventoryType | null>(null);
  const [inventoryType, setInventoryType] = useState<InventoryType | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    async function loadItem() {
      if (id) {
        try {
          const foundItem = await itemService.getItemById(parseInt(id));
          if (foundItem) {
            setItem(foundItem);
            const type = await inventoryTypeService.getTypeById(foundItem.inventoryTypeId);
            setInventoryType(type);
            if (foundItem.parentItemId) {
              const parent = await itemService.getItemById(foundItem.parentItemId);
              setParentItem(parent);
              if (parent) {
                const pType = await inventoryTypeService.getTypeById(parent.inventoryTypeId);
                setParentType(pType);
              }
            }
          } else {
            showError('Item not found.');
            navigate('/items');
          }
        } catch {
          showError('Failed to load item.');
          navigate('/items');
        }
      }
    }
    loadItem();
  }, [id, navigate, showError]);

  const handleDelete = async () => {
    if (!item) return;
    try {
      const success = await itemService.deleteItem(item.id);
      if (success) {
        showSuccess('Item was successfully destroyed.');
        navigate('/items');
      } else {
        showError('Failed to delete item.');
      }
    } catch {
      showError('Failed to delete item.');
    }
    setShowDeleteModal(false);
  };

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

  if (!item) {
    return <SkeletonDetailPage />;
  }

  const breadcrumbItems = [
    { label: 'Inventory', path: '/items' },
    { label: item.name },
  ];

  return (
    <>
      <Breadcrumbs items={breadcrumbItems} />
      <Row>
        {/* Left Panel — Image, Key Stats, Actions */}
        <Col md={4} className="mb-3">
          {item.picture && (
            <Card className="mb-3">
              <Card.Body className="text-center p-2">
                <img
                  src={item.picture}
                  alt={item.name}
                  className="img-fluid rounded"
                  style={{ maxHeight: '300px', objectFit: 'contain' }}
                />
              </Card.Body>
            </Card>
          )}

          <Card className="mb-3">
            <Card.Header>
              <h5 className="mb-0">{item.name}</h5>
              {inventoryType && (
                <div className="mt-1">
                  {parentType && <Badge bg="primary" className="me-1">{parentType.name}</Badge>}
                  <Badge bg={parentType ? 'secondary' : 'primary'}>{inventoryType.name}</Badge>
                </div>
              )}
            </Card.Header>
            <Card.Body className="p-0">
              <table className="table table-sm mb-0">
                <tbody>
                  <tr>
                    <td className="text-muted ps-3">Quantity</td>
                    <td className="pe-3 text-end fw-bold">{item.quantity}</td>
                  </tr>
                  <tr>
                    <td className="text-muted ps-3">Unit Value</td>
                    <td className="pe-3 text-end">{formatCurrency(item.unitValue)}</td>
                  </tr>
                  <tr>
                    <td className="text-muted ps-3">Total Value</td>
                    <td className="pe-3 text-end fw-bold">{formatCurrency(item.value)}</td>
                  </tr>
                  <tr>
                    <td className="text-muted ps-3">Category</td>
                    <td className="pe-3 text-end">{item.category}</td>
                  </tr>
                  <tr>
                    <td className="text-muted ps-3">Location</td>
                    <td className="pe-3 text-end">{item.location}</td>
                  </tr>
                  {item.barcode && (
                    <tr>
                      <td className="text-muted ps-3">Barcode</td>
                      <td className="pe-3 text-end">{item.barcode}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="text-muted ps-3">Reorder Point</td>
                    <td className="pe-3 text-end">
                      {item.reorderPoint > 0 ? (
                        <>
                          {item.reorderPoint}
                          {item.quantity <= item.reorderPoint && (
                            <Badge bg="warning" className="ms-2">Low</Badge>
                          )}
                        </>
                      ) : (
                        <span className="text-muted">Not set</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </Card.Body>
          </Card>

          <ButtonGroup className="w-100">
            <Link to={`/items/${item.id}/edit`} className="btn btn-primary">
              Edit
            </Link>
            <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
              Delete
            </Button>
            <Button variant="secondary" onClick={() => navigate('/items')}>
              Back
            </Button>
          </ButtonGroup>
        </Col>

        {/* Right Panel — Details, Custom Fields, History */}
        <Col md={8}>
          {parentItem && (
            <Card className="mb-3">
              <Card.Body className="py-2">
                <span className="text-muted me-2">Mounted On</span>
                <Link to={`/items/${parentItem.id}`}>{parentItem.name}</Link>
              </Card.Body>
            </Card>
          )}

          {item.description && (
            <Card className="mb-3">
              <Card.Header><h6 className="mb-0">Description</h6></Card.Header>
              <Card.Body>
                <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{item.description}</p>
              </Card.Body>
            </Card>
          )}

          {inventoryType && inventoryType.schema.length > 0 && item.customFields && (
            <Card className="mb-3">
              <Card.Header><h6 className="mb-0">{inventoryType.name} Details</h6></Card.Header>
              <Card.Body className="p-0">
                <table className="table table-sm mb-0">
                  <tbody>
                    {inventoryType.schema.map((field) => {
                      const value = item.customFields[field.key];
                      if (value === undefined || value === null || value === '') return null;
                      return (
                        <tr key={field.key}>
                          <td className="text-muted ps-3" style={{ width: '40%' }}>{field.label}</td>
                          <td className="pe-3">
                            {field.type === 'boolean' ? (value ? 'Yes' : 'No') :
                             field.key === 'vendorUrl' || (typeof value === 'string' && value.startsWith('http')) ? (
                               <a href={String(value)} target="_blank" rel="noopener noreferrer">{String(value)}</a>
                             ) : String(value)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card.Body>
            </Card>
          )}

          <ReceiptList itemId={item.id} />

          <CostHistoryChart itemId={item.id} currentValue={item.unitValue} />

          <ChildItemsList parentId={item.id} parentTypeName={inventoryType?.name} />

          {!!(item.customFields?.partNumber) && (
            <VendorPriceCard
              partNumber={item.customFields.partNumber as string}
              unitValue={item.unitValue}
            />
          )}
        </Col>
      </Row>

      <ConfirmModal
        show={showDeleteModal}
        title="Delete Item"
        message={`Are you sure you want to delete "${item.name}"?`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  );
}
