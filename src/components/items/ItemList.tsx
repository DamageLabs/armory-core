import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CCard, CCardHeader, CCardBody, CButton, CButtonGroup, CBadge, CFormCheck, CTable } from '@coreui/react';
import { FaEdit, FaTrash, FaCopy, FaFileExcel, FaFilePdf, FaBoxOpen, FaLink, FaFileCode, FaDatabase, FaThLarge, FaList, FaImage } from 'react-icons/fa';
import * as itemService from '../../services/itemService';
import * as inventoryTypeService from '../../services/inventoryTypeService';
import { Item } from '../../types/Item';
import { InventoryType } from '../../types/InventoryType';
import { useAlert } from '../../contexts/AlertContext';
import Pagination from '../common/Pagination';
import ConfirmModal from '../common/ConfirmModal';
import ItemFilters from './ItemFilters';
import BulkActions from './BulkActions';
import LowStockAlert from '../common/LowStockAlert';
import EmptyState from '../common/EmptyState';
import ItemCardGrid from './ItemCardGrid';
import SavedFilterChips from './SavedFilterChips';
import { exportToCSV, exportToPDF, backupItemsToCSV, backupItemsToJSON } from '../../utils/export';
import { formatCurrency } from '../../utils/formatters';
import { ITEMS_PER_PAGE, LOW_STOCK_TYPE_NAMES, FIREARMS_TYPE_NAME, AMMUNITION_TYPE_NAME } from '../../constants/config';
import { ItemFormData } from '../../types/Item';
import { FilterCriterion, SavedFilter } from '../../types/SavedFilter';
import * as savedFilterService from '../../services/savedFilterService';

type ViewMode = 'table' | 'card';
const VIEW_MODE_KEY = 'armory-view-mode';

type SortField = 'name' | 'quantity' | 'unitValue' | 'value' | 'location' | 'category';
type SortDirection = 'asc' | 'desc';

interface SortHeaderProps {
  field: SortField;
  currentField: SortField;
  direction: SortDirection;
  onSort: (field: SortField) => void;
  children: React.ReactNode;
}

function SortHeader({ field, currentField, direction, onSort, children }: SortHeaderProps) {
  return (
    <th
      onClick={() => onSort(field)}
      style={{ cursor: 'pointer' }}
      className="text-center"
    >
      {children}
      {currentField === field && (direction === 'asc' ? ' ▲' : ' ▼')}
    </th>
  );
}

export default function ItemList() {
  const [items, setItems] = useState<Item[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>(() => (localStorage.getItem(VIEW_MODE_KEY) as ViewMode) || 'table');
  const navigate = useNavigate();
  const [deleteModalItem, setDeleteModalItem] = useState<Item | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showBulkCategoryModal, setShowBulkCategoryModal] = useState(false);
  const [pendingCategory, setPendingCategory] = useState<string>('');
  const { showSuccess, showError } = useAlert();

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<FilterCriterion[]>([]);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [activeFilterId, setActiveFilterId] = useState<number | null>(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const [inventoryTypes, setInventoryTypes] = useState<InventoryType[]>([]);
  const [typeFilter, setTypeFilter] = useState('');

  // Low stock alert needs all items — fetch separately
  const [lowStockCounts, setLowStockCounts] = useState<{ lowStock: number; outOfStock: number }>({ lowStock: 0, outOfStock: 0 });

  // Debounce search
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Only include filters that have a field and value set
  const activeAdvancedFilters = useMemo(
    () => advancedFilters.filter((f) => f.field && f.value),
    [advancedFilters],
  );

  const buildQueryParams = useCallback((): itemService.ItemQueryParams => ({
    page: currentPage,
    pageSize: ITEMS_PER_PAGE,
    search: searchTerm || undefined,
    typeId: typeFilter ? parseInt(typeFilter) : undefined,
    category: categoryFilter || undefined,
    sortBy: sortField,
    sortDir: sortDirection,
    lowStock: showLowStockOnly || undefined,
    filters: activeAdvancedFilters.length > 0 ? activeAdvancedFilters : undefined,
  }), [currentPage, searchTerm, typeFilter, categoryFilter, sortField, sortDirection, showLowStockOnly, activeAdvancedFilters]);

  const loadItems = useCallback(async () => {
    try {
      const params = buildQueryParams();
      const [result, stats] = await Promise.all([
        itemService.getItems(params),
        itemService.getFilteredStats(params),
      ]);
      setItems(result.data);
      setTotalItems(result.pagination.totalItems);
      setTotalPages(result.pagination.totalPages);
      setTotalQuantity(stats.totalQuantity);
      setTotalValue(stats.totalValue);
    } catch {
      showError('Failed to load items.');
    }
  }, [buildQueryParams, showError]);

  useEffect(() => {
    async function loadTypes() {
      try {
        const types = await inventoryTypeService.getAllTypes();
        setInventoryTypes(types);
      } catch {
        showError('Failed to load inventory types.');
      }
    }
    loadTypes();
  }, [showError]);

  const loadSavedFilters = useCallback(async () => {
    try {
      const filters = await savedFilterService.getSavedFilters();
      setSavedFilters(filters);
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    loadSavedFilters();
  }, [loadSavedFilters]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Load low stock counts once for alert banner (per-item reorder points)
  useEffect(() => {
    async function loadLowStockCounts() {
      try {
        const counts = await itemService.getLowStockCounts();
        setLowStockCounts(counts);
      } catch {
        // Non-critical — alert just won't show
      }
    }
    loadLowStockCounts();
  }, []);

  const lowStockTypeIds = useMemo(() => {
    return new Set(
      inventoryTypes
        .filter((t) => LOW_STOCK_TYPE_NAMES.includes(t.name))
        .map((t) => t.id)
    );
  }, [inventoryTypes]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    // Debounce API calls for search
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setCurrentPage(1);
      setSelectedIds(new Set());
    }, 300);
  }, []);

  const handleCategoryChange = useCallback((value: string) => {
    setCategoryFilter(value);
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, []);

  const handleLowStockToggle = useCallback((value: boolean) => {
    setShowLowStockOnly(value);
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, []);

  const handleSort = useCallback((field: SortField) => {
    if (field === sortField) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  }, [sortField]);

  const handleDelete = async () => {
    if (!deleteModalItem) return;

    try {
      const success = await itemService.deleteItem(deleteModalItem.id);
      if (success) {
        showSuccess('Item was successfully destroyed.');
        await loadItems();
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(deleteModalItem.id);
          return next;
        });
      } else {
        showError('Failed to delete item.');
      }
    } catch {
      showError('Failed to delete item.');
    }
    setDeleteModalItem(null);
  };

  const handleBulkDelete = async () => {
    try {
      const ids = Array.from(selectedIds);
      const deletedCount = await itemService.deleteItems(ids);
      if (deletedCount > 0) {
        showSuccess(`${deletedCount} item${deletedCount !== 1 ? 's' : ''} deleted successfully.`);
        await loadItems();
        setSelectedIds(new Set());
      } else {
        showError('Failed to delete items.');
      }
    } catch {
      showError('Failed to delete items.');
    }
    setShowBulkDeleteModal(false);
  };

  const handleBulkCategoryChange = (category: string) => {
    setPendingCategory(category);
    setShowBulkCategoryModal(true);
  };

  const confirmBulkCategoryChange = async () => {
    try {
      const ids = Array.from(selectedIds);
      const updatedCount = await itemService.updateItemsCategory(ids, pendingCategory);
      if (updatedCount > 0) {
        showSuccess(`${updatedCount} item${updatedCount !== 1 ? 's' : ''} updated to category "${pendingCategory}".`);
        await loadItems();
        setSelectedIds(new Set());
      } else {
        showError('Failed to update items.');
      }
    } catch {
      showError('Failed to update items.');
    }
    setShowBulkCategoryModal(false);
    setPendingCategory('');
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(items.map((item) => item.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectItem = (id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(VIEW_MODE_KEY, mode);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setTypeFilter('');
    setShowLowStockOnly(false);
    setAdvancedFilters([]);
    setActiveFilterId(null);
    setCurrentPage(1);
    setSelectedIds(new Set());
  };

  const handleAdvancedFiltersChange = useCallback((filters: FilterCriterion[]) => {
    setAdvancedFilters(filters);
    setActiveFilterId(null);
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, []);

  const handleApplySavedFilter = useCallback((sf: SavedFilter) => {
    const config = sf.filterConfig;
    setSearchTerm(config.search || '');
    setTypeFilter(config.typeId ? String(config.typeId) : '');
    setCategoryFilter(config.category || '');
    setAdvancedFilters(config.filters || []);
    setActiveFilterId(sf.id);
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, []);

  const handleSaveFilter = useCallback(async (name: string) => {
    try {
      await savedFilterService.createSavedFilter(name, {
        search: searchTerm || undefined,
        typeId: typeFilter ? parseInt(typeFilter) : undefined,
        category: categoryFilter || undefined,
        filters: advancedFilters,
      });
      showSuccess(`Filter "${name}" saved.`);
      await loadSavedFilters();
    } catch {
      showError('Failed to save filter.');
    }
  }, [searchTerm, typeFilter, categoryFilter, advancedFilters, showSuccess, showError, loadSavedFilters]);

  const handleDeleteSavedFilter = useCallback(async (id: number) => {
    try {
      await savedFilterService.deleteSavedFilter(id);
      if (activeFilterId === id) setActiveFilterId(null);
      await loadSavedFilters();
    } catch {
      showError('Failed to delete filter.');
    }
  }, [activeFilterId, showError, loadSavedFilters]);

  const handleClone = (item: Item) => {
    const customFields = { ...item.customFields };
    const typeName = inventoryTypes.find((t) => t.id === item.inventoryTypeId)?.name;
    if (typeName === FIREARMS_TYPE_NAME) {
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

  const handleFilterLowStock = () => {
    handleLowStockToggle(true);
  };

  const handleExportCSV = async () => {
    try {
      const allItems = await itemService.getAllItems();
      exportToCSV(allItems);
    } catch {
      showError('Failed to export items.');
    }
  };

  const handleExportPDF = async () => {
    try {
      const allItems = await itemService.getAllItems();
      exportToPDF(allItems);
    } catch {
      showError('Failed to export items.');
    }
  };

  const handleBackupCSV = async () => {
    try {
      const allItems = await itemService.getAllItems();
      backupItemsToCSV(allItems);
    } catch {
      showError('Failed to backup items.');
    }
  };

  const handleBackupJSON = async () => {
    try {
      const allItems = await itemService.getAllItems();
      backupItemsToJSON(allItems);
    } catch {
      showError('Failed to backup items.');
    }
  };

  const allPageItemsSelected = items.length > 0 && items.every((item) => selectedIds.has(item.id));
  const somePageItemsSelected = items.some((item) => selectedIds.has(item.id));

  return (
    <CCard>
      <CCardHeader>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h4 className="mb-0">Inventory Items</h4>
          <div className="d-flex gap-2 flex-wrap">
            <CButtonGroup size="sm">
              <CButton
                color={viewMode === 'table' ? 'primary' : 'primary'}
                variant={viewMode === 'table' ? undefined : 'outline'}
                onClick={() => handleViewModeChange('table')}
                title="Table view"
              >
                <FaList />
              </CButton>
              <CButton
                color={viewMode === 'card' ? 'primary' : 'primary'}
                variant={viewMode === 'card' ? undefined : 'outline'}
                onClick={() => handleViewModeChange('card')}
                title="Card view"
              >
                <FaThLarge />
              </CButton>
            </CButtonGroup>
            <CButtonGroup size="sm">
              <CButton color="success" variant="outline" onClick={handleExportCSV}>
                <FaFileExcel className="me-1" />
                CSV
              </CButton>
              <CButton color="danger" variant="outline" onClick={handleExportPDF}>
                <FaFilePdf className="me-1" />
                PDF
              </CButton>
            </CButtonGroup>
            <CButtonGroup size="sm">
              <CButton color="secondary" variant="outline" onClick={handleBackupCSV} disabled={totalItems === 0} title="Backup all items as CSV">
                <FaDatabase className="me-1" />
                Backup CSV
              </CButton>
              <CButton color="info" variant="outline" onClick={handleBackupJSON} disabled={totalItems === 0} title="Backup all items as JSON">
                <FaFileCode className="me-1" />
                Backup JSON
              </CButton>
            </CButtonGroup>
            <Link to="/items/new" className="btn btn-primary">
              New Item
            </Link>
          </div>
        </div>
      </CCardHeader>
      <CCardBody>
        <LowStockAlert
          lowStockCount={lowStockCounts.lowStock}
          outOfStockCount={lowStockCounts.outOfStock}
          onFilterLowStock={handleFilterLowStock}
        />

        <ItemFilters
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          categoryFilter={categoryFilter}
          onCategoryChange={handleCategoryChange}
          typeFilter={typeFilter}
          onTypeChange={(v) => { setTypeFilter(v); setCurrentPage(1); setSelectedIds(new Set()); }}
          onReset={handleResetFilters}
          advancedFilters={advancedFilters}
          onAdvancedFiltersChange={handleAdvancedFiltersChange}
        />

        {savedFilters.length > 0 || searchTerm || categoryFilter || typeFilter || advancedFilters.length > 0 ? (
          <SavedFilterChips
            savedFilters={savedFilters}
            activeFilterId={activeFilterId}
            onApply={handleApplySavedFilter}
            onSave={handleSaveFilter}
            onDelete={handleDeleteSavedFilter}
            canSave={!!(searchTerm || categoryFilter || typeFilter || advancedFilters.length > 0)}
          />
        ) : null}

        {showLowStockOnly && (
          <div className="mb-3">
            <span className="badge bg-warning text-dark me-2">Showing low stock items only</span>
            <CButton color="link" size="sm" onClick={() => handleLowStockToggle(false)}>
              Clear
            </CButton>
          </div>
        )}

        <BulkActions
          selectedCount={selectedIds.size}
          onDelete={() => setShowBulkDeleteModal(true)}
          onCategoryChange={handleBulkCategoryChange}
        />

        {viewMode === 'table' ? (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th className="text-center" style={{ width: '40px' }}>
                    <CFormCheck
                      checked={allPageItemsSelected}
                      ref={(el: HTMLInputElement | null) => {
                        if (el) {
                          el.indeterminate = somePageItemsSelected && !allPageItemsSelected;
                        }
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      aria-label="Select all items on page"
                    />
                  </th>
                  <SortHeader field="name" currentField={sortField} direction={sortDirection} onSort={handleSort}>Item Name</SortHeader>
                  <th className="text-center">Type</th>
                  <SortHeader field="quantity" currentField={sortField} direction={sortDirection} onSort={handleSort}>Quantity</SortHeader>
                  <SortHeader field="unitValue" currentField={sortField} direction={sortDirection} onSort={handleSort}>Unit Value</SortHeader>
                  <SortHeader field="value" currentField={sortField} direction={sortDirection} onSort={handleSort}>Total Value</SortHeader>
                  <SortHeader field="location" currentField={sortField} direction={sortDirection} onSort={handleSort}>Location</SortHeader>
                  <SortHeader field="category" currentField={sortField} direction={sortDirection} onSort={handleSort}>Category</SortHeader>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className={selectedIds.has(item.id) ? 'table-active' : ''}>
                    <td className="text-center">
                      <CFormCheck
                        checked={selectedIds.has(item.id)}
                        onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                        aria-label={`Select ${item.name}`}
                      />
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        {item.picture ? (
                          <img
                            src={item.picture}
                            alt=""
                            style={{
                              width: '32px',
                              height: '32px',
                              objectFit: 'cover',
                              borderRadius: '4px',
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <span
                            className="d-flex align-items-center justify-content-center text-muted"
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--cui-tertiary-bg)',
                              flexShrink: 0,
                            }}
                          >
                            <FaImage size={14} />
                          </span>
                        )}
                        <div>
                          <Link to={`/items/${item.id}`}>{item.name}</Link>
                          {(item.childCount ?? 0) > 0 && (
                            <CBadge color="info" className="ms-1" title={`${item.childCount} attached item(s)`}>
                              {item.childCount}
                            </CBadge>
                          )}
                          {item.parentItemId && item.parentName && (
                            <Link to={`/items/${item.parentItemId}`} className="ms-1">
                              <CBadge color="dark" title={`Attached to ${item.parentName}`}>
                                <FaLink size={10} className="me-1" />{item.parentName}
                              </CBadge>
                            </Link>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-center">
                      <CBadge color="primary">
                        {inventoryTypes.find((t) => t.id === item.inventoryTypeId)?.name || '-'}
                      </CBadge>
                    </td>
                    <td className={`text-center ${lowStockTypeIds.has(item.inventoryTypeId) && item.reorderPoint > 0 ? (item.quantity === 0 ? 'text-danger fw-bold' : item.quantity <= item.reorderPoint ? 'text-warning fw-bold' : '') : ''}`}>
                      {inventoryTypes.find((t) => t.id === item.inventoryTypeId)?.name === AMMUNITION_TYPE_NAME && item.customFields.roundCount ? (
                        <span title={`${item.quantity} box${item.quantity !== 1 ? 'es' : ''} × ${item.customFields.roundCount} rounds`}>
                          {item.quantity * Number(item.customFields.roundCount)} rds
                        </span>
                      ) : (
                        item.quantity
                      )}
                    </td>
                    <td className="text-center">{formatCurrency(item.unitValue)}</td>
                    <td className="text-center">{formatCurrency(item.value)}</td>
                    <td className="text-center">{item.location}</td>
                    <td className="text-center">{item.category}</td>
                    <td className="text-center">
                      <Link
                        to={`/items/${item.id}/edit`}
                        className="btn btn-sm btn-outline-primary me-1"
                        aria-label={`Edit ${item.name}`}
                      >
                        <FaEdit aria-hidden="true" />
                      </Link>
                      <CButton
                        color="info"
                        variant="outline"
                        size="sm"
                        className="me-1"
                        onClick={() => handleClone(item)}
                        aria-label={`Clone ${item.name}`}
                      >
                        <FaCopy aria-hidden="true" />
                      </CButton>
                      <CButton
                        color="danger"
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteModalItem(item)}
                        aria-label={`Delete ${item.name}`}
                      >
                        <FaTrash aria-hidden="true" />
                      </CButton>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="table-secondary">
                  <td></td>
                  <td colSpan={2}><strong>Totals ({totalItems} items)</strong></td>
                  <td className="text-center"><strong>{totalQuantity}</strong></td>
                  <td className="text-center"></td>
                  <td className="text-center"><strong>{formatCurrency(totalValue)}</strong></td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <>
            <ItemCardGrid
              items={items}
              allItems={items}
              inventoryTypes={inventoryTypes}
              lowStockTypeIds={lowStockTypeIds}
              onDelete={setDeleteModalItem}
            />
            <div className="text-muted text-center mt-3 small">
              <strong>{totalItems}</strong> items &middot; <strong>{totalQuantity}</strong> total qty &middot; <strong>{formatCurrency(totalValue)}</strong> total value
            </div>
          </>
        )}

        {totalItems === 0 && !searchTerm && !categoryFilter && !typeFilter && !showLowStockOnly && advancedFilters.length === 0 ? (
          <EmptyState
            icon={FaBoxOpen}
            title="No items in inventory"
            description="Get started by adding your first inventory item."
            actionLabel="Add First Item"
            actionPath="/items/new"
          />
        ) : totalItems === 0 ? (
          <EmptyState
            icon={FaBoxOpen}
            title="No items match your filters"
            description="Try adjusting your search or filter criteria."
            actionLabel="Clear Filters"
            onAction={handleResetFilters}
          />
        ) : (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        )}
      </CCardBody>

      <ConfirmModal
        show={!!deleteModalItem}
        title="Delete Item"
        message={`Are you sure you want to delete "${deleteModalItem?.name}"?`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModalItem(null)}
      />

      <ConfirmModal
        show={showBulkDeleteModal}
        title="Delete Selected Items"
        message={`Are you sure you want to delete ${selectedIds.size} item${selectedIds.size !== 1 ? 's' : ''}? This action cannot be undone.`}
        confirmLabel="Delete All"
        onConfirm={handleBulkDelete}
        onCancel={() => setShowBulkDeleteModal(false)}
      />

      <ConfirmModal
        show={showBulkCategoryModal}
        title="Change Category"
        message={`Change category of ${selectedIds.size} item${selectedIds.size !== 1 ? 's' : ''} to "${pendingCategory}"?`}
        confirmLabel="Change Category"
        confirmVariant="primary"
        onConfirm={confirmBulkCategoryChange}
        onCancel={() => {
          setShowBulkCategoryModal(false);
          setPendingCategory('');
        }}
      />
    </CCard>
  );
}
