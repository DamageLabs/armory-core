import { useState, useEffect, useMemo } from 'react';
import { CCard, CCardHeader, CCardBody, CCardFooter, CRow, CCol, CButton, CButtonGroup, CFormLabel, CFormInput, CFormSelect, CBadge } from '@coreui/react';
import { FaFileExcel, FaTimes } from 'react-icons/fa';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import * as stockHistoryService from '../../services/stockHistoryService';
import * as itemService from '../../services/itemService';
import { Item } from '../../types/Item';
import { StockChangeType, StockHistoryEntry } from '../../types/StockHistory';
import { useTheme } from '../../contexts/ThemeContext';
import Pagination from '../common/Pagination';

const ITEMS_PER_PAGE = 25;

export default function MovementReport() {
  const { isDark } = useTheme();
  const [allItems, setAllItems] = useState<Item[]>([]);

  // Filter state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [changeType, setChangeType] = useState<StockChangeType | ''>('');
  const [itemId, setItemId] = useState<number | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredHistory, setFilteredHistory] = useState<StockHistoryEntry[]>([]);

  useEffect(() => {
    const loadItems = async () => {
      const items = await itemService.getAllItems();
      setAllItems(items);
    };
    loadItems();
  }, []);

  useEffect(() => {
    const loadHistory = async () => {
      const history = await stockHistoryService.getFilteredHistory({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        changeType: changeType || undefined,
        itemId: itemId ? Number(itemId) : undefined,
      });
      setFilteredHistory(history);
    };
    loadHistory();
  }, [startDate, endDate, changeType, itemId]);

  const paginatedHistory = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredHistory.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredHistory, currentPage]);

  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);

  const stats = useMemo(() => {
    const created = filteredHistory.filter((h) => h.changeType === 'created').length;
    const updated = filteredHistory.filter((h) => h.changeType === 'updated').length;
    const deleted = filteredHistory.filter((h) => h.changeType === 'deleted').length;
    const categoryChanged = filteredHistory.filter((h) => h.changeType === 'category_changed').length;

    const netQuantityChange = filteredHistory.reduce((sum, h) => {
      if (h.changeType === 'created') return sum + (h.newQuantity ?? 0);
      if (h.changeType === 'deleted') return sum - (h.previousQuantity ?? 0);
      if (h.changeType === 'updated') {
        return sum + ((h.newQuantity ?? 0) - (h.previousQuantity ?? 0));
      }
      return sum;
    }, 0);

    return { created, updated, deleted, categoryChanged, netQuantityChange, total: filteredHistory.length };
  }, [filteredHistory]);

  const dailyActivity = useMemo(() => {
    const dailyMap = new Map<string, { date: string; created: number; updated: number; deleted: number }>();

    filteredHistory.forEach((entry) => {
      const date = entry.timestamp.split('T')[0];
      const existing = dailyMap.get(date) || { date, created: 0, updated: 0, deleted: 0 };

      if (entry.changeType === 'created') existing.created++;
      else if (entry.changeType === 'updated') existing.updated++;
      else if (entry.changeType === 'deleted') existing.deleted++;

      dailyMap.set(date, existing);
    });

    return Array.from(dailyMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);
  }, [filteredHistory]);

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setChangeType('');
    setItemId('');
    setCurrentPage(1);
  };

  const hasFilters = startDate || endDate || changeType || itemId;

  const exportToCSV = () => {
    const headers = ['Date', 'Time', 'Item', 'Action', 'Previous Qty', 'New Qty', 'Change', 'Notes', 'User'];
    const rows = filteredHistory.map((entry) => {
      const date = new Date(entry.timestamp);
      const qtyChange = entry.changeType === 'updated' || entry.changeType === 'created'
        ? (entry.newQuantity ?? 0) - (entry.previousQuantity ?? 0)
        : entry.changeType === 'deleted'
        ? -(entry.previousQuantity ?? 0)
        : 0;

      return [
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        entry.itemName,
        entry.changeType,
        entry.previousQuantity?.toString() ?? '',
        entry.newQuantity?.toString() ?? '',
        qtyChange.toString(),
        entry.notes,
        entry.userEmail ?? '',
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stock-movement-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const textColor = isDark ? '#e9ecef' : '#212529';

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">Stock Movement Report</h4>
          <p className="text-muted mb-0">Track inventory changes over time</p>
        </div>
        <CButtonGroup size="sm">
          <CButton color="success" variant="outline" onClick={exportToCSV}>
            <FaFileExcel className="me-1" /> Export CSV
          </CButton>
        </CButtonGroup>
      </div>

      {/* Filters */}
      <CCard className="mb-4">
        <CCardBody>
          <CRow className="g-3">
            <CCol md={2}>
              <div>
                <CFormLabel className="small text-muted">Start Date</CFormLabel>
                <CFormInput
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                />
              </div>
            </CCol>
            <CCol md={2}>
              <div>
                <CFormLabel className="small text-muted">End Date</CFormLabel>
                <CFormInput
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                />
              </div>
            </CCol>
            <CCol md={2}>
              <div>
                <CFormLabel className="small text-muted">Change Type</CFormLabel>
                <CFormSelect
                  value={changeType}
                  onChange={(e) => { setChangeType(e.target.value as StockChangeType | ''); setCurrentPage(1); }}
                >
                  <option value="">All Types</option>
                  <option value="created">Created</option>
                  <option value="updated">Updated</option>
                  <option value="deleted">Deleted</option>
                  <option value="category_changed">Category Changed</option>
                </CFormSelect>
              </div>
            </CCol>
            <CCol md={4}>
              <div>
                <CFormLabel className="small text-muted">Item</CFormLabel>
                <CFormSelect
                  value={itemId}
                  onChange={(e) => { setItemId(e.target.value ? Number(e.target.value) : ''); setCurrentPage(1); }}
                >
                  <option value="">All Items</option>
                  {allItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </CFormSelect>
              </div>
            </CCol>
            <CCol md={2} className="d-flex align-items-end">
              {hasFilters && (
                <CButton color="secondary" variant="outline" onClick={clearFilters} className="w-100">
                  <FaTimes className="me-1" /> Clear
                </CButton>
              )}
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* Stats Cards */}
      <CRow className="g-3 mb-4">
        <CCol md={2}>
          <CCard className="text-center h-100">
            <CCardBody>
              <h6 className="text-muted small">Total Changes</h6>
              <h4>{stats.total}</h4>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={2}>
          <CCard className="text-center h-100 border-success">
            <CCardBody>
              <h6 className="text-muted small">Created</h6>
              <h4 className="text-success">{stats.created}</h4>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={2}>
          <CCard className="text-center h-100 border-primary">
            <CCardBody>
              <h6 className="text-muted small">Updated</h6>
              <h4 className="text-primary">{stats.updated}</h4>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={2}>
          <CCard className="text-center h-100 border-danger">
            <CCardBody>
              <h6 className="text-muted small">Deleted</h6>
              <h4 className="text-danger">{stats.deleted}</h4>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={2}>
          <CCard className="text-center h-100 border-secondary">
            <CCardBody>
              <h6 className="text-muted small">Category</h6>
              <h4>{stats.categoryChanged}</h4>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={2}>
          <CCard className="text-center h-100 border-info">
            <CCardBody>
              <h6 className="text-muted small">Net Qty Change</h6>
              <h4 className={stats.netQuantityChange >= 0 ? 'text-success' : 'text-danger'}>
                {stats.netQuantityChange >= 0 ? '+' : ''}{stats.netQuantityChange}
              </h4>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Activity Chart */}
      {dailyActivity.length > 0 && (
        <CCard className="mb-4">
          <CCardHeader>
            <h6 className="mb-0">Daily Activity (Last 30 Days)</h6>
          </CCardHeader>
          <CCardBody>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#495057' : '#dee2e6'} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: textColor, fontSize: 11 }}
                  tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  stroke={textColor}
                />
                <YAxis tick={{ fill: textColor }} stroke={textColor} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#212529' : '#fff',
                    border: isDark ? '1px solid #495057' : '1px solid #dee2e6',
                    color: textColor,
                  }}
                  labelFormatter={(v) => new Date(v).toLocaleDateString()}
                />
                <Legend />
                <Bar dataKey="created" stackId="a" fill="#198754" name="Created" />
                <Bar dataKey="updated" stackId="a" fill="#0d6efd" name="Updated" />
                <Bar dataKey="deleted" stackId="a" fill="#dc3545" name="Deleted" />
              </BarChart>
            </ResponsiveContainer>
          </CCardBody>
        </CCard>
      )}

      {/* History Table */}
      <CCard>
        <CCardHeader>
          <h6 className="mb-0">
            Movement History
            {hasFilters && <CBadge color="secondary" className="ms-2">Filtered</CBadge>}
          </h6>
        </CCardHeader>
        <CCardBody className="p-0">
          <table className="table table-hover table-responsive mb-0">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Item</th>
                <th>Action</th>
                <th className="text-end">Previous</th>
                <th className="text-end">New</th>
                <th className="text-end">Change</th>
                <th>Notes</th>
                <th>User</th>
              </tr>
            </thead>
            <tbody>
              {paginatedHistory.map((entry) => {
                const qtyChange = getQuantityChange(entry);
                return (
                  <tr key={entry.id}>
                    <td className="text-nowrap">
                      <div>{new Date(entry.timestamp).toLocaleDateString()}</div>
                      <small className="text-muted">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </small>
                    </td>
                    <td>{entry.itemName}</td>
                    <td>
                      <CBadge color={getChangeTypeBadge(entry.changeType)}>
                        {formatChangeType(entry.changeType)}
                      </CBadge>
                    </td>
                    <td className="text-end">
                      {entry.previousQuantity !== null ? entry.previousQuantity : '-'}
                    </td>
                    <td className="text-end">
                      {entry.newQuantity !== null ? entry.newQuantity : '-'}
                    </td>
                    <td className={`text-end fw-bold ${qtyChange > 0 ? 'text-success' : qtyChange < 0 ? 'text-danger' : ''}`}>
                      {qtyChange !== 0 ? (qtyChange > 0 ? `+${qtyChange}` : qtyChange) : '-'}
                    </td>
                    <td>
                      <small>{entry.notes}</small>
                    </td>
                    <td>
                      <small className="text-muted">{entry.userEmail || '-'}</small>
                    </td>
                  </tr>
                );
              })}
              {paginatedHistory.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-muted py-4">
                    No stock movements found
                    {hasFilters && ' matching your filters'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CCardBody>
        {totalPages > 1 && (
          <CCardFooter>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredHistory.length}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </CCardFooter>
        )}
      </CCard>
    </div>
  );
}

function getQuantityChange(entry: StockHistoryEntry): number {
  if (entry.changeType === 'created') return entry.newQuantity ?? 0;
  if (entry.changeType === 'deleted') return -(entry.previousQuantity ?? 0);
  if (entry.changeType === 'updated') {
    return (entry.newQuantity ?? 0) - (entry.previousQuantity ?? 0);
  }
  return 0;
}

function getChangeTypeBadge(type: StockChangeType): string {
  switch (type) {
    case 'created': return 'success';
    case 'updated': return 'primary';
    case 'deleted': return 'danger';
    case 'adjusted': return 'info';
    case 'category_changed': return 'secondary';
    default: return 'secondary';
  }
}

function formatChangeType(type: StockChangeType): string {
  switch (type) {
    case 'created': return 'Created';
    case 'updated': return 'Updated';
    case 'deleted': return 'Deleted';
    case 'adjusted': return 'Adjusted';
    case 'category_changed': return 'Category';
    default: return type;
  }
}
