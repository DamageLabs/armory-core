import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CCard, CCardHeader, CCardBody, CRow, CCol, CButton, CButtonGroup, CBadge } from '@coreui/react';
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
import Markdown from 'react-markdown';
import AttachmentList from './AttachmentList';
import ItemNotes from './ItemNotes';
import { LOW_STOCK_TYPE_NAMES, FIREARMS_TYPE_NAME, AMMUNITION_TYPE_NAME } from '../../constants/config';
import { ItemFormData } from '../../types/Item';

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

  const handleClone = () => {
    if (!item) return;
    const customFields = { ...item.customFields };
    // Clear serial number for Firearms to prevent duplicate unique identifiers
    if (inventoryType?.name === FIREARMS_TYPE_NAME) {
      delete customFields.serialNumber;
    }
    const cloneData: ItemFormData = {
      name: `${item.name} (Copy)`,
      description: item.description,
      quantity: item.quantity,
      unitValue: item.unitValue,
      picture: item.picture,
      category: item.category,
      location: item.location,
      barcode: '',
      reorderPoint: item.reorderPoint,
      inventoryTypeId: item.inventoryTypeId,
      customFields,
      parentItemId: item.parentItemId,
    };
    navigate('/items/new', { state: { cloneData } });
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
      <CRow>
        {/* Left Panel — Image, Key Stats, Actions */}
        <CCol md={4} className="mb-3">
          {item.picture && (
            <CCard className="mb-3">
              <CCardBody className="text-center p-2">
                <img
                  src={item.picture}
                  alt={item.name}
                  className="img-fluid rounded"
                  style={{ maxHeight: '300px', objectFit: 'contain' }}
                />
              </CCardBody>
            </CCard>
          )}

          <CCard className="mb-3">
            <CCardHeader>
              <h5 className="mb-0">{item.name}</h5>
              {inventoryType && (
                <div className="mt-1">
                  {parentType && <CBadge color="primary" className="me-1">{parentType.name}</CBadge>}
                  <CBadge color={parentType ? 'secondary' : 'primary'}>{inventoryType.name}</CBadge>
                </div>
              )}
            </CCardHeader>
            <CCardBody className="p-0">
              <table className="table table-sm mb-0">
                <tbody>
                  {inventoryType?.name === AMMUNITION_TYPE_NAME && item.customFields.roundCount ? (
                    <>
                      <tr>
                        <td className="text-muted ps-3">Boxes</td>
                        <td className="pe-3 text-end fw-bold">{item.quantity}</td>
                      </tr>
                      <tr>
                        <td className="text-muted ps-3">Rounds/Box</td>
                        <td className="pe-3 text-end">{Number(item.customFields.roundCount)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted ps-3">Total Rounds</td>
                        <td className="pe-3 text-end fw-bold">{item.quantity * Number(item.customFields.roundCount)}</td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td className="text-muted ps-3">Quantity</td>
                      <td className="pe-3 text-end fw-bold">{item.quantity}</td>
                    </tr>
                  )}
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
                  {LOW_STOCK_TYPE_NAMES.includes(inventoryType?.name || '') && (
                  <tr>
                    <td className="text-muted ps-3">Reorder Point</td>
                    <td className="pe-3 text-end">
                      {item.reorderPoint > 0 ? (
                        <>
                          {item.reorderPoint}
                          {item.quantity <= item.reorderPoint && (
                            <CBadge color="warning" className="ms-2">Low</CBadge>
                          )}
                        </>
                      ) : (
                        <span className="text-muted">Not set</span>
                      )}
                    </td>
                  </tr>
                  )}
                </tbody>
              </table>
            </CCardBody>
          </CCard>

          <CButtonGroup className="w-100">
            <Link to={`/items/${item.id}/edit`} className="btn btn-primary">
              Edit
            </Link>
            <CButton color="info" onClick={handleClone}>
              Clone
            </CButton>
            <CButton color="danger" onClick={() => setShowDeleteModal(true)}>
              Delete
            </CButton>
            <CButton color="secondary" onClick={() => navigate('/items')}>
              Back
            </CButton>
          </CButtonGroup>
        </CCol>

        {/* Right Panel — Details, Custom Fields, History */}
        <CCol md={8}>
          {parentItem && (
            <CCard className="mb-3">
              <CCardBody className="py-2">
                <span className="text-muted me-2">Mounted On</span>
                <Link to={`/items/${parentItem.id}`}>{parentItem.name}</Link>
              </CCardBody>
            </CCard>
          )}

          {item.description && (
            <CCard className="mb-3">
              <CCardHeader><h6 className="mb-0">Description</h6></CCardHeader>
              <CCardBody>
                <div className="mb-0">
                  <Markdown components={{ a: ({ children, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer">{children}</a> }}>
                    {item.description}
                  </Markdown>
                </div>
              </CCardBody>
            </CCard>
          )}

          {inventoryType && inventoryType.schema.length > 0 && item.customFields && (
            <CCard className="mb-3">
              <CCardHeader><h6 className="mb-0">{inventoryType.name} Details</h6></CCardHeader>
              <CCardBody className="p-0">
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
              </CCardBody>
            </CCard>
          )}

          <AttachmentList itemId={item.id} />

          <ItemNotes itemId={item.id} />

          <CostHistoryChart itemId={item.id} currentValue={item.unitValue} />

          <ChildItemsList parentId={item.id} parentTypeName={inventoryType?.name} />

          {!!(item.customFields?.partNumber) && (
            <VendorPriceCard
              partNumber={item.customFields.partNumber as string}
              unitValue={item.unitValue}
            />
          )}
        </CCol>
      </CRow>

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
