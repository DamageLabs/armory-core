import { useState, useEffect } from 'react';
import { CRow, CCol, CButton, CInputGroup, CInputGroupText, CFormInput, CFormSelect } from '@coreui/react';
import { FaSearch, FaTimes } from 'react-icons/fa';
import * as categoryService from '../../services/categoryService';
import * as inventoryTypeService from '../../services/inventoryTypeService';
import { InventoryType } from '../../types/InventoryType';

interface ItemFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  typeFilter: string;
  onTypeChange: (value: string) => void;
  onReset: () => void;
}

export default function ItemFilters({
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  typeFilter,
  onTypeChange,
  onReset,
}: ItemFiltersProps) {
  const [categories, setCategories] = useState<string[]>([]);
  const [inventoryTypes, setInventoryTypes] = useState<InventoryType[]>([]);
  const hasFilters = searchTerm || categoryFilter || typeFilter;

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

  return (
    <CRow className="mb-3 g-2">
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
      <CCol md={2}>
        <CButton
          color="secondary"
          variant="outline"
          onClick={onReset}
          disabled={!hasFilters}
          className="w-100"
        >
          <FaTimes className="me-1" />
          Reset
        </CButton>
      </CCol>
    </CRow>
  );
}
