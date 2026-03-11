import { useState } from 'react';
import { CButton, CFormInput, CFormSelect, CFormCheck, CFormLabel, CRow, CCol, CBadge } from '@coreui/react';
import { FaPlus, FaTrash, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { FieldDefinition, FieldType } from '../../types/InventoryType';

interface FieldSchemaEditorProps {
  schema: FieldDefinition[];
  onChange: (schema: FieldDefinition[]) => void;
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Dropdown' },
  { value: 'boolean', label: 'Checkbox' },
  { value: 'date', label: 'Date' },
];

const EMPTY_FIELD: FieldDefinition = {
  key: '',
  label: '',
  type: 'text',
  required: false,
};

export default function FieldSchemaEditor({ schema, onChange }: FieldSchemaEditorProps) {
  const [newField, setNewField] = useState<FieldDefinition>({ ...EMPTY_FIELD });
  const [newOptions, setNewOptions] = useState('');

  const addField = () => {
    if (!newField.label.trim()) return;
    const key = newField.key || newField.label.replace(/\s+/g, '').replace(/^./, (c) => c.toLowerCase());
    const field: FieldDefinition = {
      ...newField,
      key,
      label: newField.label.trim(),
      options: newField.type === 'select' ? newOptions.split(',').map((o) => o.trim()).filter(Boolean) : undefined,
      placeholder: newField.placeholder?.trim() || undefined,
    };
    onChange([...schema, field]);
    setNewField({ ...EMPTY_FIELD });
    setNewOptions('');
  };

  const removeField = (index: number) => {
    onChange(schema.filter((_, i) => i !== index));
  };

  const moveField = (index: number, direction: -1 | 1) => {
    const newSchema = [...schema];
    const target = index + direction;
    if (target < 0 || target >= newSchema.length) return;
    [newSchema[index], newSchema[target]] = [newSchema[target], newSchema[index]];
    onChange(newSchema);
  };

  return (
    <div>
      {schema.length > 0 && (
        <table className="table table-sm table-bordered mb-3">
          <thead>
            <tr>
              <th>Label</th>
              <th>Key</th>
              <th>Type</th>
              <th>Required</th>
              <th style={{ width: '120px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {schema.map((field, index) => (
              <tr key={field.key}>
                <td>{field.label}</td>
                <td><code>{field.key}</code></td>
                <td>
                  <CBadge color="secondary">{field.type}</CBadge>
                  {field.options && (
                    <small className="text-muted ms-1">({field.options.length} options)</small>
                  )}
                </td>
                <td>{field.required ? 'Yes' : 'No'}</td>
                <td>
                  <CButton size="sm" color="link" onClick={() => moveField(index, -1)} disabled={index === 0}>
                    <FaArrowUp />
                  </CButton>
                  <CButton size="sm" color="link" onClick={() => moveField(index, 1)} disabled={index === schema.length - 1}>
                    <FaArrowDown />
                  </CButton>
                  <CButton size="sm" color="link" className="text-danger" onClick={() => removeField(index)}>
                    <FaTrash />
                  </CButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="border rounded p-3 bg-light">
        <h6>Add Field</h6>
        <CRow className="g-2 align-items-end">
          <CCol md={3}>
            <CFormLabel>Label</CFormLabel>
            <CFormInput
              size="sm"
              value={newField.label}
              onChange={(e) => setNewField({ ...newField, label: e.target.value })}
              placeholder="e.g., Serial Number"
            />
          </CCol>
          <CCol md={2}>
            <CFormLabel>Type</CFormLabel>
            <CFormSelect
              size="sm"
              value={newField.type}
              onChange={(e) => setNewField({ ...newField, type: e.target.value as FieldType })}
            >
              {FIELD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </CFormSelect>
          </CCol>
          <CCol md={2}>
            <CFormCheck
              type="checkbox"
              label="Required"
              checked={newField.required}
              onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
              className="mt-4"
            />
          </CCol>
          {newField.type === 'select' && (
            <CCol md={3}>
              <CFormLabel>Options (comma-separated)</CFormLabel>
              <CFormInput
                size="sm"
                value={newOptions}
                onChange={(e) => setNewOptions(e.target.value)}
                placeholder="Option1, Option2, Option3"
              />
            </CCol>
          )}
          <CCol md={2}>
            <CButton size="sm" color="primary" onClick={addField} disabled={!newField.label.trim()}>
              <FaPlus className="me-1" /> Add
            </CButton>
          </CCol>
        </CRow>
      </div>
    </div>
  );
}
