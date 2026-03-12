import { useState, useEffect, useCallback } from 'react';
import {
  CCard, CCardHeader, CCardBody, CButton, CBadge,
  CFormInput, CFormSelect, CFormTextarea, CSpinner, CRow, CCol,
} from '@coreui/react';
import { MaintenanceLog as MaintenanceLogType, MaintenanceSummary } from '../../types/MaintenanceLog';
import * as maintenanceService from '../../services/maintenanceService';
import { useAlert } from '../../contexts/AlertContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { MAINTENANCE_TYPES } from '../../constants/config';
import ConfirmModal from '../common/ConfirmModal';
import Pagination from '../common/Pagination';

interface MaintenanceLogProps {
  itemId: number;
}

const TYPE_COLORS: Record<string, string> = {
  Cleaning: 'success',
  Repair: 'danger',
  Inspection: 'info',
  Modification: 'warning',
  Service: 'primary',
  Other: 'secondary',
};

export default function MaintenanceLog({ itemId }: MaintenanceLogProps) {
  const { showSuccess, showError } = useAlert();
  const { user, isAdmin } = useAuth();

  const [logs, setLogs] = useState<MaintenanceLogType[]>([]);
  const [summary, setSummary] = useState<MaintenanceSummary | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [typeFilter, setTypeFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MaintenanceLogType | null>(null);
  const [editTarget, setEditTarget] = useState<MaintenanceLogType | null>(null);

  // Form state
  const [serviceType, setServiceType] = useState<string>(MAINTENANCE_TYPES[0]);
  const [description, setDescription] = useState('');
  const [roundsFired, setRoundsFired] = useState('');
  const [serviceProvider, setServiceProvider] = useState('');
  const [cost, setCost] = useState('');
  const [performedAt, setPerformedAt] = useState(new Date().toISOString().split('T')[0]);

  const loadLogs = useCallback(async (p: number) => {
    try {
      const result = await maintenanceService.getLogs(itemId, p, 20, typeFilter || undefined);
      setLogs(result.data);
      setTotalItems(result.pagination.totalItems);
      setTotalPages(result.pagination.totalPages);
      setPage(result.pagination.page);
    } catch {
      // silent
    }
  }, [itemId, typeFilter]);

  const loadSummary = useCallback(async () => {
    try {
      const data = await maintenanceService.getSummary(itemId);
      setSummary(data);
    } catch {
      // silent
    }
  }, [itemId]);

  useEffect(() => {
    loadLogs(1);
  }, [loadLogs]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const resetForm = () => {
    setServiceType(MAINTENANCE_TYPES[0]);
    setDescription('');
    setRoundsFired('');
    setServiceProvider('');
    setCost('');
    setPerformedAt(new Date().toISOString().split('T')[0]);
    setEditTarget(null);
  };

  const populateForm = (log: MaintenanceLogType) => {
    setServiceType(log.serviceType);
    setDescription(log.description);
    setRoundsFired(log.roundsFired ? String(log.roundsFired) : '');
    setServiceProvider(log.serviceProvider);
    setCost(log.cost ? String(log.cost) : '');
    setPerformedAt(log.performedAt.split('T')[0]);
    setEditTarget(log);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!serviceType || !performedAt) return;
    setIsSubmitting(true);
    try {
      const payload = {
        serviceType,
        description: description.trim(),
        roundsFired: Number(roundsFired) || 0,
        serviceProvider: serviceProvider.trim(),
        cost: Number(cost) || 0,
        performedAt,
      };

      if (editTarget) {
        await maintenanceService.updateLog(editTarget.id, payload);
        showSuccess('Maintenance log updated.');
      } else {
        await maintenanceService.createLog(itemId, payload);
        showSuccess('Maintenance log added.');
      }
      resetForm();
      setShowForm(false);
      await loadLogs(1);
      await loadSummary();
    } catch {
      showError(editTarget ? 'Failed to update log.' : 'Failed to add log.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await maintenanceService.deleteLog(deleteTarget.id);
      showSuccess('Maintenance log deleted.');
      await loadLogs(page);
      await loadSummary();
    } catch {
      showError('Failed to delete log.');
    }
    setDeleteTarget(null);
  };

  const canModify = (log: MaintenanceLogType) =>
    log.userId === user?.id || isAdmin;

  return (
    <>
      <CCard className="mb-3">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">
            Maintenance Log{' '}
            {totalItems > 0 && <CBadge color="secondary">{totalItems}</CBadge>}
          </h6>
          <CButton
            color="primary"
            size="sm"
            onClick={() => { resetForm(); setShowForm(!showForm); }}
          >
            {showForm ? 'Cancel' : 'Add Entry'}
          </CButton>
        </CCardHeader>

        {summary && summary.totalEntries > 0 && (
          <CCardBody className="py-2">
            <CRow className="text-center">
              <CCol>
                <small className="text-muted d-block">Total Rounds</small>
                <strong>{summary.totalRounds.toLocaleString()}</strong>
              </CCol>
              <CCol>
                <small className="text-muted d-block">Total Cost</small>
                <strong>{formatCurrency(summary.totalCost)}</strong>
              </CCol>
              <CCol>
                <small className="text-muted d-block">Last Service</small>
                <strong>{summary.lastServiceDate ? formatDate(summary.lastServiceDate) : '—'}</strong>
              </CCol>
            </CRow>
          </CCardBody>
        )}

        {showForm && (
          <CCardBody className="border-top">
            <CRow className="g-2 mb-2">
              <CCol sm={6}>
                <CFormSelect
                  label="Service Type"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                >
                  {MAINTENANCE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol sm={6}>
                <CFormInput
                  type="date"
                  label="Date"
                  value={performedAt}
                  onChange={(e) => setPerformedAt(e.target.value)}
                />
              </CCol>
            </CRow>
            <CFormTextarea
              label="Description"
              placeholder="What was done..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mb-2"
            />
            <CRow className="g-2 mb-2">
              <CCol sm={4}>
                <CFormInput
                  type="number"
                  label="Rounds Fired"
                  placeholder="0"
                  value={roundsFired}
                  onChange={(e) => setRoundsFired(e.target.value)}
                  min={0}
                />
              </CCol>
              <CCol sm={4}>
                <CFormInput
                  label="Service Provider"
                  placeholder="Self, gunsmith, etc."
                  value={serviceProvider}
                  onChange={(e) => setServiceProvider(e.target.value)}
                />
              </CCol>
              <CCol sm={4}>
                <CFormInput
                  type="number"
                  label="Cost ($)"
                  placeholder="0.00"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  min={0}
                  step="0.01"
                />
              </CCol>
            </CRow>
            <div className="text-end">
              <CButton
                color="primary"
                size="sm"
                onClick={handleSubmit}
                disabled={isSubmitting || !serviceType || !performedAt}
              >
                {isSubmitting ? <><CSpinner size="sm" className="me-1" />Saving...</> : (editTarget ? 'Update' : 'Add Entry')}
              </CButton>
            </div>
          </CCardBody>
        )}

        {logs.length > 0 && (
          <>
            <CCardBody className="border-top py-2">
              <CFormSelect
                size="sm"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{ maxWidth: '200px' }}
              >
                <option value="">All Types</option>
                {MAINTENANCE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </CFormSelect>
            </CCardBody>

            {logs.map((log) => (
              <CCardBody key={log.id} className="border-top py-3">
                <div className="d-flex justify-content-between align-items-start mb-1">
                  <div>
                    <CBadge color={TYPE_COLORS[log.serviceType] || 'secondary'} className="me-2">
                      {log.serviceType}
                    </CBadge>
                    <small className="text-muted">{formatDate(log.performedAt)}</small>
                  </div>
                  {canModify(log) && (
                    <div>
                      <CButton
                        color="primary"
                        variant="ghost"
                        size="sm"
                        onClick={() => populateForm(log)}
                      >
                        Edit
                      </CButton>
                      <CButton
                        color="danger"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(log)}
                      >
                        Delete
                      </CButton>
                    </div>
                  )}
                </div>
                {log.description && <p className="mb-1">{log.description}</p>}
                <div className="d-flex gap-3">
                  {log.roundsFired > 0 && (
                    <small className="text-muted">Rounds: {log.roundsFired.toLocaleString()}</small>
                  )}
                  {log.cost > 0 && (
                    <small className="text-muted">Cost: {formatCurrency(log.cost)}</small>
                  )}
                  {log.serviceProvider && (
                    <small className="text-muted">Provider: {log.serviceProvider}</small>
                  )}
                </div>
                <small className="text-muted d-block mt-1">by {log.userEmail}</small>
              </CCardBody>
            ))}

            {totalPages > 1 && (
              <CCardBody className="border-top py-2">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={20}
                  onPageChange={(p) => loadLogs(p)}
                />
              </CCardBody>
            )}
          </>
        )}

        {!showForm && logs.length === 0 && (
          <CCardBody className="text-center text-muted py-4">
            No maintenance records yet.
          </CCardBody>
        )}
      </CCard>

      <ConfirmModal
        show={!!deleteTarget}
        title="Delete Maintenance Log"
        message="Are you sure you want to delete this maintenance entry?"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
