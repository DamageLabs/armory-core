import { CRow, CCol, CFormSelect, CFormInput, CButton } from '@coreui/react';
import { FaPlus, FaTimes } from 'react-icons/fa';
import { FieldDefinition } from '../../types/InventoryType';
import { FilterCriterion, FilterOperator } from '../../types/SavedFilter';

interface FilterBuilderProps {
  filters: FilterCriterion[];
  onChange: (filters: FilterCriterion[]) => void;
  typeSchema: FieldDefinition[];
}

const STANDARD_FIELDS: FieldDefinition[] = [
  { key: 'name', label: 'Name', type: 'text', required: false },
  { key: 'location', label: 'Location', type: 'text', required: false },
  { key: 'quantity', label: 'Quantity', type: 'number', required: false },
  { key: 'unitValue', label: 'Unit Value', type: 'number', required: false },
  { key: 'value', label: 'Total Value', type: 'number', required: false },
  { key: 'barcode', label: 'Barcode', type: 'text', required: false },
];

const OPERATORS_BY_TYPE: Record<string, { value: FilterOperator; label: string }[]> = {
  text: [
    { value: 'eq', label: 'Equals' },
    { value: 'contains', label: 'Contains' },
  ],
  number: [
    { value: 'eq', label: 'Equals' },
    { value: 'gt', label: 'Greater than' },
    { value: 'lt', label: 'Less than' },
    { value: 'between', label: 'Between' },
  ],
  select: [{ value: 'eq', label: 'Equals' }],
  date: [
    { value: 'eq', label: 'Equals' },
    { value: 'gt', label: 'After' },
    { value: 'lt', label: 'Before' },
    { value: 'between', label: 'Between' },
  ],
  boolean: [{ value: 'eq', label: 'Equals' }],
};

function getFieldDef(
  fieldKey: string,
  isCustomField: boolean,
  typeSchema: FieldDefinition[],
): FieldDefinition | undefined {
  if (isCustomField) return typeSchema.find((f) => f.key === fieldKey);
  return STANDARD_FIELDS.find((f) => f.key === fieldKey);
}

export default function FilterBuilder({ filters, onChange, typeSchema }: FilterBuilderProps) {
  const allFields = [
    ...STANDARD_FIELDS.map((f) => ({ ...f, isCustom: false })),
    ...typeSchema.map((f) => ({ ...f, isCustom: true })),
  ];

  const addFilter = () => {
    onChange([
      ...filters,
      { field: '', operator: 'eq', value: '', isCustomField: false, fieldType: 'text' },
    ]);
  };

  const updateFilter = (index: number, updates: Partial<FilterCriterion>) => {
    const next = filters.map((f, i) => (i === index ? { ...f, ...updates } : f));
    onChange(next);
  };

  const removeFilter = (index: number) => {
    onChange(filters.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, fieldKey: string) => {
    const match = allFields.find((f) => f.key === fieldKey);
    if (!match) return;
    updateFilter(index, {
      field: fieldKey,
      isCustomField: match.isCustom,
      fieldType: match.type,
      operator: 'eq',
      value: '',
      valueTo: undefined,
    });
  };

  return (
    <div className="mb-3">
      {filters.map((filter, index) => {
        const fieldDef = getFieldDef(filter.field, filter.isCustomField, typeSchema);
        const fieldType = fieldDef?.type || 'text';
        const operators = OPERATORS_BY_TYPE[fieldType] || OPERATORS_BY_TYPE.text;

        return (
          <CRow key={index} className="g-2 mb-2 align-items-center">
            <CCol md={3}>
              <CFormSelect
                size="sm"
                value={filter.field}
                onChange={(e) => handleFieldChange(index, e.target.value)}
              >
                <option value="">Select field...</option>
                <optgroup label="Standard Fields">
                  {STANDARD_FIELDS.map((f) => (
                    <option key={f.key} value={f.key}>{f.label}</option>
                  ))}
                </optgroup>
                {typeSchema.length > 0 && (
                  <optgroup label="Custom Fields">
                    {typeSchema.map((f) => (
                      <option key={f.key} value={f.key}>{f.label}</option>
                    ))}
                  </optgroup>
                )}
              </CFormSelect>
            </CCol>
            <CCol md={2}>
              <CFormSelect
                size="sm"
                value={filter.operator}
                onChange={(e) => updateFilter(index, { operator: e.target.value as FilterOperator })}
                disabled={!filter.field}
              >
                {operators.map((op) => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol md={filter.operator === 'between' ? 2 : 4}>
              <FilterValueInput
                filter={filter}
                fieldDef={fieldDef}
                onChange={(value) => updateFilter(index, { value })}
              />
            </CCol>
            {filter.operator === 'between' && (
              <CCol md={2}>
                <FilterValueInput
                  filter={{ ...filter, value: filter.valueTo || '' }}
                  fieldDef={fieldDef}
                  onChange={(valueTo) => updateFilter(index, { valueTo })}
                  placeholder="To"
                />
              </CCol>
            )}
            <CCol md={1}>
              <CButton
                color="danger"
                variant="ghost"
                size="sm"
                onClick={() => removeFilter(index)}
                title="Remove filter"
              >
                <FaTimes />
              </CButton>
            </CCol>
          </CRow>
        );
      })}
      <CButton color="primary" variant="ghost" size="sm" onClick={addFilter}>
        <FaPlus className="me-1" /> Add Filter
      </CButton>
    </div>
  );
}

function FilterValueInput({
  filter,
  fieldDef,
  onChange,
  placeholder,
}: {
  filter: FilterCriterion;
  fieldDef?: FieldDefinition;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const type = fieldDef?.type || 'text';

  if (type === 'boolean') {
    return (
      <CFormSelect size="sm" value={filter.value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Any</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </CFormSelect>
    );
  }

  if (type === 'select' && fieldDef?.options) {
    return (
      <CFormSelect size="sm" value={filter.value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Any</option>
        {fieldDef.options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </CFormSelect>
    );
  }

  if (type === 'number') {
    return (
      <CFormInput
        type="number"
        size="sm"
        value={filter.value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || fieldDef?.placeholder || 'Value'}
      />
    );
  }

  if (type === 'date') {
    return (
      <CFormInput
        type="date"
        size="sm"
        value={filter.value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  return (
    <CFormInput
      type="text"
      size="sm"
      value={filter.value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || fieldDef?.placeholder || 'Value'}
    />
  );
}
