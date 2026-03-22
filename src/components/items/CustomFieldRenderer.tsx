import { CRow, CCol, CFormLabel, CFormSelect, CFormCheck, CFormInput, CNav, CNavItem, CNavLink, CTabContent, CTabPane, CBadge } from '@coreui/react';
import { useState } from 'react';
import { FieldDefinition } from '../../types/InventoryType';

interface CustomFieldRendererProps {
  schema: FieldDefinition[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  readOnly?: boolean;
  touched?: Record<string, boolean>;
}

export default function CustomFieldRenderer({
  schema,
  values,
  onChange,
  readOnly = false,
  touched = {},
}: CustomFieldRendererProps) {
  const [activeTab, setActiveTab] = useState(0);

  if (schema.length === 0) return null;

  // Group fields by their group property (default to "Details" if missing)
  const groupFieldsByGroup = (fields: FieldDefinition[]) => {
    const groups: Record<string, FieldDefinition[]> = {};
    
    for (const field of fields) {
      const group = field.group || 'Details';
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(field);
    }
    
    return groups;
  };

  const groups = groupFieldsByGroup(schema);
  const groupNames = Object.keys(groups);

  // Check if any required field in a group is empty and has been touched
  const hasErrors = (groupFields: FieldDefinition[]) => {
    return groupFields.some(field => 
      field.required && 
      touched[field.key] && 
      (!values[field.key] || values[field.key] === '')
    );
  };

  // If only 1 group exists, render flat (no tabs) — backwards compatible
  if (groupNames.length <= 1) {
    return (
      <fieldset className="mb-4">
        <legend className="h6 text-muted border-bottom pb-2 mb-3">Type-Specific Fields</legend>
        {schema.map((field) => (
          <CRow className="mb-3" key={field.key}>
            <CFormLabel className="col-sm-3 col-form-label">
              {field.label}
              {field.required && <span className="text-danger"> *</span>}
            </CFormLabel>
            <CCol sm={5}>
              {renderField(field, values[field.key], onChange, readOnly)}
            </CCol>
          </CRow>
        ))}
      </fieldset>
    );
  }

  // Multiple groups - render with tabs
  return (
    <fieldset className="mb-4">
      <legend className="h6 text-muted border-bottom pb-2 mb-3">Type-Specific Fields</legend>
      
      <CNav variant="tabs" className="mb-3">
        {groupNames.map((name, i) => (
          <CNavItem key={name}>
            <CNavLink 
              active={activeTab === i} 
              onClick={() => setActiveTab(i)}
              className="d-flex align-items-center gap-2"
            >
              {name}
              {hasErrors(groups[name]) && (
                <CBadge color="danger" shape="rounded-pill">!</CBadge>
              )}
            </CNavLink>
          </CNavItem>
        ))}
      </CNav>

      <CTabContent>
        {groupNames.map((name, i) => (
          <CTabPane key={name} visible={activeTab === i}>
            {groups[name].map((field) => (
              <CRow className="mb-3" key={field.key}>
                <CFormLabel className="col-sm-3 col-form-label">
                  {field.label}
                  {field.required && <span className="text-danger"> *</span>}
                </CFormLabel>
                <CCol sm={5}>
                  {renderField(field, values[field.key], onChange, readOnly)}
                </CCol>
              </CRow>
            ))}
          </CTabPane>
        ))}
      </CTabContent>
    </fieldset>
  );
}

function renderField(
  field: FieldDefinition,
  value: unknown,
  onChange: (key: string, value: unknown) => void,
  readOnly: boolean
) {
  switch (field.type) {
    case 'select':
      return (
        <CFormSelect
          value={String(value || '')}
          onChange={(e) => onChange(field.key, e.target.value)}
          disabled={readOnly}
          required={field.required}
        >
          <option value="">-- Select --</option>
          {(field.options || []).map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </CFormSelect>
      );
    case 'boolean':
      return (
        <CFormCheck
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(field.key, e.target.checked)}
          disabled={readOnly}
          label={field.label}
        />
      );
    case 'number':
      return (
        <CFormInput
          type="number"
          value={value !== undefined && value !== null ? String(value) : ''}
          onChange={(e) => onChange(field.key, e.target.value ? parseFloat(e.target.value) : '')}
          placeholder={field.placeholder}
          disabled={readOnly}
          required={field.required}
        />
      );
    case 'date':
      return (
        <CFormInput
          type="date"
          value={String(value || '')}
          onChange={(e) => onChange(field.key, e.target.value)}
          disabled={readOnly}
          required={field.required}
        />
      );
    case 'text':
    default:
      return (
        <CFormInput
          type="text"
          value={String(value || '')}
          onChange={(e) => onChange(field.key, e.target.value)}
          placeholder={field.placeholder}
          disabled={readOnly}
          required={field.required}
        />
      );
  }
}
