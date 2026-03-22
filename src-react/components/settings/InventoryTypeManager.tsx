import { useState, useEffect } from 'react';
import { CCard, CCardHeader, CCardBody, CButton, CButtonGroup, CFormInput, CFormLabel, CRow, CCol, CBadge, CCollapse } from '@coreui/react';
import { FaPlus, FaTrash, FaEdit, FaChevronDown, FaChevronRight, FaFileExcel, FaFileCode } from 'react-icons/fa';
import * as inventoryTypeService from '../../services/inventoryTypeService';
import { InventoryType, FieldDefinition } from '../../types/InventoryType';
import { useAlert } from '../../contexts/AlertContext';
import ConfirmModal from '../common/ConfirmModal';
import FieldSchemaEditor from './FieldSchemaEditor';
import Breadcrumbs from '../common/Breadcrumbs';
import { APP_NAME } from '../../constants/config';

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getDateStamp(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export default function InventoryTypeManager() {
  const { showSuccess, showError } = useAlert();
  const [types, setTypes] = useState<InventoryType[]>([]);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editSchema, setEditSchema] = useState<FieldDefinition[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const loadTypes = async () => {
    const allTypes = await inventoryTypeService.getAllTypes();
    setTypes(allTypes);
  };

  useEffect(() => { loadTypes(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await inventoryTypeService.createType({ name: newName, icon: newIcon, schema: [] });
      showSuccess(`Inventory type "${newName}" created.`);
      setNewName('');
      setNewIcon('');
      await loadTypes();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to create type.');
    }
  };

  const startEdit = (type: InventoryType) => {
    setEditingId(type.id);
    setEditName(type.name);
    setEditIcon(type.icon);
    setEditSchema([...type.schema]);
    setExpandedId(type.id);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await inventoryTypeService.updateType(editingId, {
        name: editName,
        icon: editIcon,
        schema: editSchema,
      });
      showSuccess('Inventory type updated.');
      setEditingId(null);
      await loadTypes();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to update type.');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await inventoryTypeService.deleteType(deleteId);
      showSuccess('Inventory type deleted.');
      await loadTypes();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to delete type.');
    }
    setDeleteId(null);
  };

  const exportJSON = () => {
    const data = types.map(({ id, name, icon, schema }) => ({ id, name, icon, schema }));
    const json = JSON.stringify(data, null, 2);
    downloadFile(json, `${APP_NAME.toLowerCase()}-inventory-types-${getDateStamp()}.json`, 'application/json');
  };

  const exportCSV = () => {
    const headers = ['ID', 'Name', 'Icon', 'Fields Count', 'Field Keys'];
    const rows = types.map((type) => [
      type.id,
      type.name,
      type.icon,
      type.schema.length,
      type.schema.map((f) => f.key).join('; '),
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => {
          const str = String(cell ?? '');
          if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes(';')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(',')
      ),
    ].join('\n');
    downloadFile(csvContent, `${APP_NAME.toLowerCase()}-inventory-types-${getDateStamp()}.csv`, 'text/csv');
  };

  const breadcrumbItems = [
    { label: 'Settings' },
    { label: 'Inventory Types' },
  ];

  return (
    <>
      <Breadcrumbs items={breadcrumbItems} />
      <CCard>
        <CCardHeader>
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">Inventory Types</h4>
            <CButtonGroup size="sm">
              <CButton color="success" variant="outline" onClick={exportCSV} disabled={types.length === 0}>
                <FaFileExcel className="me-1" /> CSV
              </CButton>
              <CButton color="info" variant="outline" onClick={exportJSON} disabled={types.length === 0}>
                <FaFileCode className="me-1" /> JSON
              </CButton>
            </CButtonGroup>
          </div>
        </CCardHeader>
        <CCardBody>
          {/* Add new type */}
          <CRow className="mb-4 g-2 align-items-end">
            <CCol md={4}>
              <CFormLabel>New Type Name</CFormLabel>
              <CFormInput
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Firearms"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </CCol>
            <CCol md={3}>
              <CFormLabel>Icon (optional)</CFormLabel>
              <CFormInput
                value={newIcon}
                onChange={(e) => setNewIcon(e.target.value)}
                placeholder="e.g., FaCrosshairs"
              />
            </CCol>
            <CCol md={2}>
              <CButton color="primary" onClick={handleCreate} disabled={!newName.trim()}>
                <FaPlus className="me-1" /> Add Type
              </CButton>
            </CCol>
          </CRow>

          {/* Types list */}
          <table className="table table-bordered table-hover">
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>Name</th>
                <th>Fields</th>
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {types.map((type) => (
                <>
                  <tr key={type.id}>
                    <td className="text-center">
                      <CButton
                        size="sm"
                        color="link"
                        onClick={() => setExpandedId(expandedId === type.id ? null : type.id)}
                      >
                        {expandedId === type.id ? <FaChevronDown /> : <FaChevronRight />}
                      </CButton>
                    </td>
                    <td>
                      {editingId === type.id ? (
                        <CFormInput
                          size="sm"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                      ) : (
                        <strong>{type.name}</strong>
                      )}
                    </td>
                    <td>
                      <CBadge color="info">{type.schema.length} fields</CBadge>
                    </td>
                    <td>
                      {editingId === type.id ? (
                        <>
                          <CButton size="sm" color="success" onClick={saveEdit} className="me-1">Save</CButton>
                          <CButton size="sm" color="secondary" onClick={() => setEditingId(null)}>Cancel</CButton>
                        </>
                      ) : (
                        <>
                          <CButton size="sm" color="primary" variant="outline" onClick={() => startEdit(type)} className="me-1">
                            <FaEdit />
                          </CButton>
                          <CButton size="sm" color="danger" variant="outline" onClick={() => setDeleteId(type.id)}>
                            <FaTrash />
                          </CButton>
                        </>
                      )}
                    </td>
                  </tr>
                  {expandedId === type.id && (
                    <tr key={`${type.id}-schema`}>
                      <td colSpan={4}>
                        <CCollapse visible={expandedId === type.id}>
                          <div className="p-3">
                            {editingId === type.id ? (
                              <FieldSchemaEditor schema={editSchema} onChange={setEditSchema} />
                            ) : (
                              type.schema.length > 0 ? (
                                <table className="table table-sm mb-0">
                                  <thead>
                                    <tr>
                                      <th>Label</th>
                                      <th>Key</th>
                                      <th>Type</th>
                                      <th>Required</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {type.schema.map((field) => (
                                      <tr key={field.key}>
                                        <td>{field.label}</td>
                                        <td><code>{field.key}</code></td>
                                        <td><CBadge color="secondary">{field.type}</CBadge></td>
                                        <td>{field.required ? 'Yes' : 'No'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <p className="text-muted mb-0">No fields defined. Click Edit to add fields.</p>
                              )
                            )}
                          </div>
                        </CCollapse>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </CCardBody>
      </CCard>

      <ConfirmModal
        show={!!deleteId}
        title="Delete Inventory Type"
        message="Are you sure you want to delete this inventory type? This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
}
