import { useState, useEffect } from 'react';
import { CRow, CCol, CButton, CInputGroup, CInputGroupText, CFormInput, CFormSelect, CCollapse } from '@coreui/react';
import { FaSearch, FaTimes, FaFilter } from 'react-icons/fa';
import * as categoryService from '../../services/categoryService';
import * as inventoryTypeService from '../../services/inventoryTypeService';
import { InventoryType } from '../../types/InventoryType';
import { FilterCriterion } from '../../types/SavedFilter';
import FilterBuilder from './FilterBuilder';

interface ItemFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  typeFilter: string;
  onTypeChange: (value: string) => void;
  onReset: () => void;
  advancedFilters: FilterCriterion[];
  onAdvancedFiltersChange: (filters: FilterCriterion[]) => void;
}

export default function ItemFilters({
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  typeFilter,
  onTypeChange,
  onReset,
  advancedFilters,
  onAdvancedFiltersChange,
}: ItemFiltersProps) {
  const [categories, setCategories] = useState<string[]>([]);
  const [inventoryTypes, setInventoryTypes] = useState<InventoryType[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const hasFilters = searchTerm || categoryFilter || typeFilter || advancedFilters.length > 0;

  useEffect(() => {
    async function loadTypes() {
      try {
        const types = await inventoryTypeService.getAllTypes();
        setInventoryTypes(types);
      } catch {
        // silently handle
      }
    }
    loadTypes();
  }, []);

  useEffect(() => {
    async function loadCategories() {
      try {
        if (typeFilter) {
          const cats = await categoryService.getCategoryNamesByType(parseInt(typeFilter));
          setCategories(cats);
        } else {
          const cats = await categoryService.getCategoryNames();
          setCategories(cats);
        }
      } catch {
        // silently handle
      }
    }
    loadCategories();
  }, [typeFilter]);

  // Show advanced panel when filters exist
  useEffect(() => {
    if (advancedFilters.length > 0) setShowAdvanced(true);
  }, [advancedFilters.length]);

  const selectedType = inventoryTypes.find((t) => t.id === parseInt(typeFilter));
  const typeSchema = selectedType?.schema || [];

  return (
    <div className="mb-3">
      <CRow className="g-2">
        <CCol md={4}>
          <CInputGroup>
            <CInputGroupText>
              <FaSearch />
            </CInputGroupText>
            <CFormInput
              type="text"
              placeholder="Search by name, description, custom fields..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </CInputGroup>
        </CCol>
        <CCol md={2}>
          <CFormSelect
            value={typeFilter}
            onChange={(e) => onTypeChange(e.target.value)}
          >
            <option value="">All Types</option>
            {inventoryTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </CFormSelect>
        </CCol>
        <CCol md={3}>
          <CFormSelect
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </CFormSelect>
        </CCol>
        <CCol md={3} className="d-flex gap-2">
          <CButton
            color="info"
            variant={showAdvanced ? undefined : 'outline'}
            onClick={() => setShowAdvanced(!showAdvanced)}
            title="Advanced filters"
          >
            <FaFilter className="me-1" />
            Filters
            {advancedFilters.length > 0 && (
              <span className="ms-1 badge bg-light text-dark">{advancedFilters.length}</span>
            )}
          </CButton>
          <CButton
            color="secondary"
            variant="outline"
            onClick={onReset}
            disabled={!hasFilters}
          >
            <FaTimes className="me-1" />
            Reset
          </CButton>
        </CCol>
      </CRow>

      <CCollapse visible={showAdvanced}>
        <div className="mt-3 p-3 border rounded bg-body-tertiary">
          <h6 className="mb-2">Advanced Filters</h6>
          {!typeFilter && (
            <p className="text-muted small mb-2">Select an inventory type above to filter by custom fields.</p>
          )}
          <FilterBuilder
            filters={advancedFilters}
            onChange={onAdvancedFiltersChange}
            typeSchema={typeSchema}
          />
        </div>
      </CCollapse>
    </div>
  );
}
