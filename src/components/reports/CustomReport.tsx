import { useState, useEffect, useMemo } from 'react';
import { CCard, CCardHeader, CCardBody, CCardFooter, CRow, CCol, CButton, CButtonGroup, CBadge, CFormSelect, CFormInput, CFormLabel } from '@coreui/react';
import { FaFileExcel, FaFilePdf, FaPlus, FaTimes, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import * as itemService from '../../services/itemService';
import * as categoryService from '../../services/categoryService';
import { Item } from '../../types/Item';
import { formatCurrency } from '../../utils/formatters';
import { exportToCSV, exportToPDF } from '../../utils/export';
import Pagination from '../common/Pagination';

const ITEMS_PER_PAGE = 25;

type ColumnKey = keyof Item | 'actions';

interface ColumnConfig {
  key: ColumnKey;
  label: string;
  visible: boolean;
  sortable: boolean;
  type: 'string' | 'number' | 'currency' | 'date';
}

interface FilterConfig {
  id: string;
  field: keyof Item;
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte';
  value: string;
}

const ALL_COLUMNS: ColumnConfig[] = [
  { key: 'name', label: 'Name', visible: true, sortable: true, type: 'string' },
  { key: 'quantity', label: 'Quantity', visible: true, sortable: true, type: 'number' },
  { key: 'unitValue', label: 'Unit Value', visible: true, sortable: true, type: 'currency' },
  { key: 'value', label: 'Total Value', visible: true, sortable: true, type: 'currency' },
  { key: 'category', label: 'Category', visible: true, sortable: true, type: 'string' },
  { key: 'location', label: 'Location', visible: true, sortable: true, type: 'string' },
  { key: 'description', label: 'Description', visible: false, sortable: false, type: 'string' },
  { key: 'createdAt', label: 'Created', visible: false, sortable: true, type: 'date' },
  { key: 'updatedAt', label: 'Updated', visible: false, sortable: true, type: 'date' },
];

const FILTER_FIELDS: { key: keyof Item; label: string; type: 'string' | 'number' | 'select' }[] = [
  { key: 'name', label: 'Name', type: 'string' },
  { key: 'category', label: 'Category', type: 'select' },
  { key: 'location', label: 'Location', type: 'string' },
  { key: 'quantity', label: 'Quantity', type: 'number' },
  { key: 'unitValue', label: 'Unit Value', type: 'number' },
  { key: 'value', label: 'Total Value', type: 'number' },
];

export default function CustomReport() {
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const [items, cats] = await Promise.all([
        itemService.getAllItems(),
        categoryService.getCategoryNames(),
      ]);
      setAllItems(items);
      setCategories(cats);
    };
    loadData();
  }, []);

  const [columns, setColumns] = useState<ColumnConfig[]>(ALL_COLUMNS);
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [sortField, setSortField] = useState<keyof Item>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [groupBy, setGroupBy] = useState<keyof Item | ''>('');
  const [currentPage, setCurrentPage] = useState(1);

  const visibleColumns = columns.filter((c) => c.visible);

  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      return filters.every((filter) => {
        const itemValue = item[filter.field];
        const filterValue = filter.value;

        if (!filterValue) return true;

        switch (filter.operator) {
          case 'equals':
            return String(itemValue).toLowerCase() === filterValue.toLowerCase();
          case 'contains':
            return String(itemValue).toLowerCase().includes(filterValue.toLowerCase());
          case 'gt':
            return Number(itemValue) > Number(filterValue);
          case 'lt':
            return Number(itemValue) < Number(filterValue);
          case 'gte':
            return Number(itemValue) >= Number(filterValue);
          case 'lte':
            return Number(itemValue) <= Number(filterValue);
          default:
            return true;
        }
      });
    });
  }, [allItems, filters]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      let comparison = 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal);
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredItems, sortField, sortDirection]);

  const groupedItems = useMemo(() => {
    if (!groupBy) return null;

    const groups = new Map<string, Item[]>();
    sortedItems.forEach((item) => {
      const key = String(item[groupBy]) || 'Unspecified';
      const existing = groups.get(key) || [];
      groups.set(key, [...existing, item]);
    });

    return Array.from(groups.entries()).map(([name, items]) => ({
      name,
      items,
      totalQuantity: items.reduce((sum, i) => sum + i.quantity, 0),
      totalValue: items.reduce((sum, i) => sum + i.quantity * i.unitValue, 0),
    }));
  }, [sortedItems, groupBy]);

  const paginatedItems = useMemo(() => {
    if (groupBy) return sortedItems;
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedItems.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedItems, currentPage, groupBy]);

  const totalPages = Math.ceil(sortedItems.length / ITEMS_PER_PAGE);

  const totals = useMemo(() => ({
    quantity: filteredItems.reduce((sum, i) => sum + i.quantity, 0),
    value: filteredItems.reduce((sum, i) => sum + i.quantity * i.unitValue, 0),
  }), [filteredItems]);

  const toggleColumn = (key: ColumnKey) => {
    setColumns((prev) =>
      prev.map((col) => (col.key === key ? { ...col, visible: !col.visible } : col))
    );
  };

  const addFilter = () => {
    setFilters((prev) => [
      ...prev,
      { id: Date.now().toString(), field: 'name', operator: 'contains', value: '' },
    ]);
  };

  const updateFilter = (id: string, updates: Partial<FilterConfig>) => {
    setFilters((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
    setCurrentPage(1);
  };

  const removeFilter = (id: string) => {
    setFilters((prev) => prev.filter((f) => f.id !== id));
    setCurrentPage(1);
  };

  const handleSort = (field: keyof Item) => {
    if (field === sortField) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleExportCSV = () => {
    exportToCSV(sortedItems);
  };

  const handleExportPDF = () => {
    exportToPDF(sortedItems);
  };

  const renderCellValue = (item: Item, column: ColumnConfig) => {
    const value = item[column.key as keyof Item];

    switch (column.type) {
      case 'currency':
        return formatCurrency(value as number);
      case 'date':
        return new Date(value as string).toLocaleDateString();
      case 'number':
        return (value as number).toLocaleString();
      default:
        return String(value ?? '');
    }
  };

  const getOperatorsForField = (field: keyof Item) => {
    const fieldConfig = FILTER_FIELDS.find((f) => f.key === field);
    if (fieldConfig?.type === 'number') {
      return [
        { value: 'equals', label: 'Equals' },
        { value: 'gt', label: 'Greater than' },
        { value: 'lt', label: 'Less than' },
        { value: 'gte', label: 'Greater or equal' },
        { value: 'lte', label: 'Less or equal' },
      ];
    }
    return [
      { value: 'contains', label: 'Contains' },
      { value: 'equals', label: 'Equals' },
    ];
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">Custom Report Builder</h4>
          <p className="text-muted mb-0">Build custom reports with filters and grouping</p>
        </div>
        <CButtonGroup size="sm">
          <CButton color="success" variant="outline" onClick={handleExportCSV}>
            <FaFileExcel className="me-1" /> CSV
          </CButton>
          <CButton color="danger" variant="outline" onClick={handleExportPDF}>
            <FaFilePdf className="me-1" /> PDF
          </CButton>
        </CButtonGroup>
      </div>

      {/* Configuration */}
      <CRow className="g-3 mb-4">
        {/* Columns */}
        <CCol md={6}>
          <CCard className="h-100">
            <CCardHeader>
              <h6 className="mb-0">Columns</h6>
            </CCardHeader>
            <CCardBody>
              <div className="d-flex flex-wrap gap-2">
                {columns.map((col) => (
                  <CBadge
                    key={col.key}
                    color={col.visible ? 'primary' : 'secondary'}
                    style={{ cursor: 'pointer' }}
                    onClick={() => toggleColumn(col.key)}
                  >
                    {col.visible ? '✓' : ''} {col.label}
                  </CBadge>
                ))}
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        {/* Grouping */}
        <CCol md={6}>
          <CCard className="h-100">
            <CCardHeader>
              <h6 className="mb-0">Group By</h6>
            </CCardHeader>
            <CCardBody>
              <CFormSelect
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as keyof Item | '')}
              >
                <option value="">No Grouping</option>
                <option value="category">Category</option>
                <option value="location">Location</option>
              </CFormSelect>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Filters */}
      <CCard className="mb-4">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">Filters</h6>
          <CButton color="primary" variant="outline" size="sm" onClick={addFilter}>
            <FaPlus className="me-1" /> Add Filter
          </CButton>
        </CCardHeader>
        {filters.length > 0 && (
          <CCardBody>
            {filters.map((filter) => {
              const fieldConfig = FILTER_FIELDS.find((f) => f.key === filter.field);
              return (
                <CRow key={filter.id} className="g-2 mb-2 align-items-center">
                  <CCol md={3}>
                    <CFormSelect
                      size="sm"
                      value={filter.field}
                      onChange={(e) => updateFilter(filter.id, { field: e.target.value as keyof Item })}
                    >
                      {FILTER_FIELDS.map((f) => (
                        <option key={f.key} value={f.key}>{f.label}</option>
                      ))}
                    </CFormSelect>
                  </CCol>
                  <CCol md={3}>
                    <CFormSelect
                      size="sm"
                      value={filter.operator}
                      onChange={(e) => updateFilter(filter.id, { operator: e.target.value as FilterConfig['operator'] })}
                    >
                      {getOperatorsForField(filter.field).map((op) => (
                        <option key={op.value} value={op.value}>{op.label}</option>
                      ))}
                    </CFormSelect>
                  </CCol>
                  <CCol md={5}>
                    {fieldConfig?.type === 'select' && filter.field === 'category' ? (
                      <CFormSelect
                        size="sm"
                        value={filter.value}
                        onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                      >
                        <option value="">Select...</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </CFormSelect>
                    ) : (
                      <CFormInput
                        size="sm"
                        type={fieldConfig?.type === 'number' ? 'number' : 'text'}
                        value={filter.value}
                        onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                        placeholder="Value..."
                      />
                    )}
                  </CCol>
                  <CCol md={1}>
                    <CButton
                      color="danger"
                      variant="outline"
                      size="sm"
                      onClick={() => removeFilter(filter.id)}
                    >
                      <FaTimes />
                    </CButton>
                  </CCol>
                </CRow>
              );
            })}
          </CCardBody>
        )}
      </CCard>

      {/* Results Summary */}
      <CCard className="mb-3">
        <CCardBody className="py-2">
          <div className="d-flex justify-content-between align-items-center">
            <span>
              Showing <strong>{filteredItems.length}</strong> of {allItems.length} items
              {filters.length > 0 && (
                <CBadge color="info" className="ms-2">{filters.length} filter(s)</CBadge>
              )}
            </span>
            <span>
              Total Qty: <strong>{totals.quantity.toLocaleString()}</strong>
              {' | '}
              Total Value: <strong className="text-success">{formatCurrency(totals.value)}</strong>
            </span>
          </div>
        </CCardBody>
      </CCard>

      {/* Results Table */}
      <CCard>
        <CCardBody className="p-0">
          {groupBy && groupedItems ? (
            // Grouped view
            groupedItems.map((group) => (
              <div key={group.name}>
                <div className="bg-light p-2 border-bottom d-flex justify-content-between">
                  <strong>{group.name}</strong>
                  <span>
                    {group.items.length} items | Qty: {group.totalQuantity} | Value: {formatCurrency(group.totalValue)}
                  </span>
                </div>
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      {visibleColumns.map((col) => (
                        <th
                          key={col.key}
                          onClick={() => col.sortable && handleSort(col.key as keyof Item)}
                          style={{ cursor: col.sortable ? 'pointer' : 'default' }}
                          className={col.type === 'number' || col.type === 'currency' ? 'text-end' : ''}
                        >
                          {col.label}
                          {sortField === col.key && (
                            sortDirection === 'asc' ? <FaArrowUp className="ms-1" /> : <FaArrowDown className="ms-1" />
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((item) => (
                      <tr key={item.id}>
                        {visibleColumns.map((col) => (
                          <td
                            key={col.key}
                            className={col.type === 'number' || col.type === 'currency' ? 'text-end' : ''}
                          >
                            {renderCellValue(item, col)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          ) : (
            // Flat view
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  {visibleColumns.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => col.sortable && handleSort(col.key as keyof Item)}
                      style={{ cursor: col.sortable ? 'pointer' : 'default' }}
                      className={col.type === 'number' || col.type === 'currency' ? 'text-end' : ''}
                    >
                      {col.label}
                      {sortField === col.key && (
                        sortDirection === 'asc' ? <FaArrowUp className="ms-1" /> : <FaArrowDown className="ms-1" />
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((item) => (
                  <tr key={item.id}>
                    {visibleColumns.map((col) => (
                      <td
                        key={col.key}
                        className={col.type === 'number' || col.type === 'currency' ? 'text-end' : ''}
                      >
                        {renderCellValue(item, col)}
                      </td>
                    ))}
                  </tr>
                ))}
                {paginatedItems.length === 0 && (
                  <tr>
                    <td colSpan={visibleColumns.length} className="text-center text-muted py-4">
                      No items match your filters
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="table-secondary">
                <tr>
                  {visibleColumns.map((col, idx) => (
                    <td key={col.key} className={col.type === 'number' || col.type === 'currency' ? 'text-end' : ''}>
                      {idx === 0 && <strong>Totals</strong>}
                      {col.key === 'quantity' && <strong>{totals.quantity.toLocaleString()}</strong>}
                      {col.key === 'value' && <strong>{formatCurrency(totals.value)}</strong>}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          )}
        </CCardBody>
        {!groupBy && totalPages > 1 && (
          <CCardFooter>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={sortedItems.length}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </CCardFooter>
        )}
      </CCard>
    </div>
  );
}
