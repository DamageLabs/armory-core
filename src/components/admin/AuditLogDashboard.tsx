import { useState, useEffect, useCallback } from 'react';
import {
  CCard,
  CCardHeader,
  CCardBody,
  CRow,
  CCol,
  CFormSelect,
  CFormInput,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CButton,
  CSpinner,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilHistory, cilFilterX } from '@coreui/icons';
import Pagination from '../common/Pagination';
import EmptyState from '../common/EmptyState';
import AuditLogEntryRow from './AuditLogEntry';
import * as auditLogService from '../../services/auditLogService';
import { AuditEntry, AuditUser } from '../../types/AuditLog';

const RESOURCE_TYPES = [
  { value: '', label: 'All Resources' },
  { value: 'item', label: 'Items' },
  { value: 'user', label: 'Users' },
  { value: 'receipt', label: 'Receipts' },
  { value: 'category', label: 'Categories' },
  { value: 'inventory_type', label: 'Inventory Types' },
  { value: 'bom', label: 'BOMs' },
];

const PAGE_SIZE = 25;

export default function AuditLogDashboard() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [action, setAction] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [userId, setUserId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filter options
  const [actions, setActions] = useState<string[]>([]);
  const [users, setUsers] = useState<AuditUser[]>([]);

  useEffect(() => {
    auditLogService.getAuditActions().then(setActions).catch(() => {});
    auditLogService.getAuditUsers().then(setUsers).catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await auditLogService.getAuditLog({
        page,
        pageSize: PAGE_SIZE,
        action: action || undefined,
        resourceType: resourceType || undefined,
        userId: userId ? Number(userId) : undefined,
        startDate: startDate || undefined,
        endDate: endDate ? `${endDate}T23:59:59.999Z` : undefined,
      });
      setEntries(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalItems(res.pagination.totalItems);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [page, action, resourceType, userId, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const clearFilters = () => {
    setAction('');
    setResourceType('');
    setUserId('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const hasFilters = action || resourceType || userId || startDate || endDate;

  return (
    <div className="p-3">
      <h4 className="mb-3">
        <CIcon icon={cilHistory} className="me-2" />
        Audit Log
      </h4>

      <CCard className="mb-3">
        <CCardHeader>
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0">Filters</h6>
            {hasFilters && (
              <CButton color="link" size="sm" onClick={clearFilters}>
                <CIcon icon={cilFilterX} className="me-1" />
                Clear
              </CButton>
            )}
          </div>
        </CCardHeader>
        <CCardBody>
          <CRow className="g-2">
            <CCol sm={6} md={3}>
              <CFormSelect
                size="sm"
                value={action}
                onChange={(e) => { setAction(e.target.value); setPage(1); }}
              >
                <option value="">All Actions</option>
                {actions.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol sm={6} md={2}>
              <CFormSelect
                size="sm"
                value={resourceType}
                onChange={(e) => { setResourceType(e.target.value); setPage(1); }}
              >
                {RESOURCE_TYPES.map((rt) => (
                  <option key={rt.value} value={rt.value}>{rt.label}</option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol sm={6} md={3}>
              <CFormSelect
                size="sm"
                value={userId}
                onChange={(e) => { setUserId(e.target.value); setPage(1); }}
              >
                <option value="">All Users</option>
                {users.map((u) => (
                  <option key={u.userId} value={u.userId}>{u.userEmail}</option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol sm={3} md={2}>
              <CFormInput
                type="date"
                size="sm"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                placeholder="From"
              />
            </CCol>
            <CCol sm={3} md={2}>
              <CFormInput
                type="date"
                size="sm"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                placeholder="To"
              />
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      <CCard>
        <CCardHeader>
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0">Activity Timeline</h6>
            <small className="text-muted">{totalItems} entries</small>
          </div>
        </CCardHeader>
        <CCardBody className="p-0">
          {loading ? (
            <div className="text-center p-4">
              <CSpinner size="sm" />
            </div>
          ) : entries.length === 0 ? (
            <EmptyState title="No audit log entries found" />
          ) : (
            <CTable hover responsive className="mb-0">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell style={{ width: 40 }} />
                  <CTableHeaderCell style={{ width: 140 }}>Action</CTableHeaderCell>
                  <CTableHeaderCell>Resource</CTableHeaderCell>
                  <CTableHeaderCell style={{ width: 200 }}>User</CTableHeaderCell>
                  <CTableHeaderCell className="text-end" style={{ width: 120 }}>Time</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {entries.map((entry) => (
                  <AuditLogEntryRow key={entry.id} entry={entry} />
                ))}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      {totalPages > 1 && (
        <div className="mt-3">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={totalItems}
            itemsPerPage={PAGE_SIZE}
          />
        </div>
      )}
    </div>
  );
}
