import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { CCard, CCardHeader, CCardBody, CButton, CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CForm, CRow, CCol, CBadge, CFormLabel, CFormInput, CFormSelect, CFormTextarea } from '@coreui/react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import * as itemTemplateService from '../../services/itemTemplateService';
import * as categoryService from '../../services/categoryService';
import { ItemTemplate, ItemTemplateFormData } from '../../types/ItemTemplate';
import { useAlert } from '../../contexts/AlertContext';
import ConfirmModal from '../common/ConfirmModal';

export default function ItemTemplates() {
  const [templates, setTemplates] = useState<ItemTemplate[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ItemTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ItemTemplate | null>(null);
  const { showSuccess, showError } = useAlert();

  const [categories, setCategories] = useState<string[]>([]);

  const [formData, setFormData] = useState<ItemTemplateFormData>({
    name: '',
    category: '',
    defaultFields: {
      manufacturer: '',
      location: '',
      reorderPoint: 0,
      description: '',
    },
  });

  useEffect(() => {
    async function loadData() {
      try {
        await loadTemplates();
        const cats = await categoryService.getCategoryNames();
        setCategories(cats);
        if (cats.length > 0) {
          setFormData((prev) => ({ ...prev, category: prev.category || cats[0] }));
        }
      } catch {
        // silently handle
      }
    }
    loadData();
  }, []);

  const loadTemplates = async () => {
    try {
      const allTemplates = await itemTemplateService.getAllTemplates();
      setTemplates(allTemplates);
    } catch {
      // silently handle
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: categories[0] || '',
      defaultFields: {
        manufacturer: '',
        location: '',
        reorderPoint: 0,
        description: '',
      },
    });
    setEditingTemplate(null);
  };

  const handleOpenModal = (template?: ItemTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        category: template.category,
        defaultFields: { ...template.defaultFields },
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('default_')) {
      const fieldName = name.replace('default_', '');
      setFormData((prev) => ({
        ...prev,
        defaultFields: {
          ...prev.defaultFields,
          [fieldName]: name === 'default_reorderPoint' ? parseInt(value) || 0 : value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      if (editingTemplate) {
        const updated = await itemTemplateService.updateTemplate(editingTemplate.id, formData);
        if (updated) {
          showSuccess('Template updated successfully.');
        } else {
          showError('Failed to update template.');
        }
      } else {
        await itemTemplateService.createTemplate(formData);
        showSuccess('Template created successfully.');
      }

      handleCloseModal();
      await loadTemplates();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Operation failed.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const success = await itemTemplateService.deleteTemplate(deleteTarget.id);
      if (success) {
        showSuccess(`Template "${deleteTarget.name}" deleted.`);
        await loadTemplates();
      } else {
        showError('Failed to delete template.');
      }
    } catch {
      showError('Failed to delete template.');
    }
    setDeleteTarget(null);
  };

  return (
    <CCard>
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <h4 className="mb-0">Item Templates</h4>
        <CButton color="primary" onClick={() => handleOpenModal()}>
          <FaPlus className="me-1" /> New Template
        </CButton>
      </CCardHeader>
      <CCardBody>
        <p className="text-muted">
          Create templates to quickly fill in common values when adding new items.
        </p>

        {templates.length === 0 ? (
          <p className="text-center py-4 text-muted">
            No templates created yet. Create a template to speed up item entry.
          </p>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Manufacturer</th>
                  <th>Default Location</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => (
                  <tr key={template.id}>
                    <td>{template.name}</td>
                    <td>
                      <CBadge color="secondary">{template.category}</CBadge>
                    </td>
                    <td>{template.defaultFields.manufacturer || '-'}</td>
                    <td>{template.defaultFields.location || '-'}</td>
                    <td>
                      <div className="d-flex gap-1">
                        <CButton
                          color="primary"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenModal(template)}
                        >
                          <FaEdit />
                        </CButton>
                        <CButton
                          color="danger"
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteTarget(template)}
                        >
                          <FaTrash />
                        </CButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CCardBody>

      <CModal visible={showModal} onClose={handleCloseModal} size="lg">
        <CModalHeader closeButton>
          <CModalTitle>
            {editingTemplate ? 'Edit Template' : 'New Template'}
          </CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleSubmit}>
          <CModalBody>
            <CRow className="mb-3">
              <CFormLabel className="col-sm-3 col-form-label">Template Name</CFormLabel>
              <CCol sm={9}>
                <CFormInput
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Glock 19 Template"
                />
              </CCol>
            </CRow>

            <CRow className="mb-3">
              <CFormLabel className="col-sm-3 col-form-label">Category</CFormLabel>
              <CCol sm={9}>
                <CFormSelect
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </CFormSelect>
              </CCol>
            </CRow>

            <hr />
            <h6>Default Values</h6>

            <CRow className="mb-3">
              <CFormLabel className="col-sm-3 col-form-label">Manufacturer</CFormLabel>
              <CCol sm={9}>
                <CFormInput
                  type="text"
                  name="default_manufacturer"
                  value={formData.defaultFields.manufacturer || ''}
                  onChange={handleChange}
                  placeholder="e.g., Glock, Sig Sauer"
                />
              </CCol>
            </CRow>

            <CRow className="mb-3">
              <CFormLabel className="col-sm-3 col-form-label">Location</CFormLabel>
              <CCol sm={9}>
                <CFormInput
                  type="text"
                  name="default_location"
                  value={formData.defaultFields.location || ''}
                  onChange={handleChange}
                  placeholder="e.g., Shelf A-1"
                />
              </CCol>
            </CRow>

            <CRow className="mb-3">
              <CFormLabel className="col-sm-3 col-form-label">Reorder Point</CFormLabel>
              <CCol sm={9}>
                <CFormInput
                  type="number"
                  name="default_reorderPoint"
                  value={formData.defaultFields.reorderPoint || 0}
                  onChange={handleChange}
                  min={0}
                />
              </CCol>
            </CRow>

            <CRow className="mb-3">
              <CFormLabel className="col-sm-3 col-form-label">Description</CFormLabel>
              <CCol sm={9}>
                <CFormTextarea
                  rows={3}
                  name="default_description"
                  value={formData.defaultFields.description || ''}
                  onChange={handleChange}
                  placeholder="Default description text..."
                />
              </CCol>
            </CRow>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={handleCloseModal}>
              Cancel
            </CButton>
            <CButton color="primary" type="submit">
              {editingTemplate ? 'Update' : 'Create'}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>

      <ConfirmModal
        show={!!deleteTarget}
        title="Delete Template"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </CCard>
  );
}
