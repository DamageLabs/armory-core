import { useState, useEffect, useMemo } from 'react';
import { CCard, CCardHeader, CCardBody, CCardFooter, CRow, CCol, CButton, CButtonGroup, CBadge } from '@coreui/react';
import { FaFileExcel } from 'react-icons/fa';
import { Link } from 'react-router-dom';
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
import * as maintenanceService from '../../services/maintenanceService';
import { MaintenanceReportData } from '../../services/maintenanceService';
import { useTheme } from '../../contexts/ThemeContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Pagination from '../common/Pagination';

const ITEMS_PER_PAGE = 25;

const TYPE_COLORS: Record<string, string> = {
  Cleaning: '#198754',
  Repair: '#dc3545',
  Inspection: '#0dcaf0',
  Modification: '#ffc107',
  Service: '#0d6efd',
  Other: '#6c757d',
};

export default function MaintenanceReport() {
  const { isDark } = useTheme();
  const [report, setReport] = useState<MaintenanceReportData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<'itemName' | 'totalRounds' | 'totalCost' | 'lastServiceDate' | 'entryCount'>('lastServiceDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    maintenanceService.getReport().then(setReport).catch(() => {});
  }, []);

  const sortedFirearms = useMemo(() => {
    if (!report) return [];
    return [...report.perFirearm].sort((a, b) => {
      const va = a[sortColumn];
      const vb = b[sortColumn];
      if (typeof va === 'string' && typeof vb === 'string') {
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortDir === 'asc' ? Number(va) - Number(vb) : Number(vb) - Number(va);
    });
  }, [report, sortColumn, sortDir]);

  const paginatedFirearms = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedFirearms.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedFirearms, currentPage]);

  const totalPages = Math.ceil(sortedFirearms.length / ITEMS_PER_PAGE);

  const handleSort = (col: typeof sortColumn) => {
    if (col === sortColumn) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortDir('desc');
    }
    setCurrentPage(1);
  };

  const sortIndicator = (col: typeof sortColumn) =>
    sortColumn === col ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : '';

  const daysSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const exportToCSV = () => {
    if (!report) return;
    const headers = ['Item', 'Service Type', 'Description', 'Rounds Fired', 'Service Provider', 'Cost', 'Date', 'User'];
    const rows = report.allLogs.map((log) => [
      log.itemName,
      log.serviceType,
      log.description,
      String(log.roundsFired),
      log.serviceProvider,
      String(log.cost),
      log.performedAt,
      log.userEmail,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${(cell || '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `maintenance-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const textColor = isDark ? '#e9ecef' : '#212529';

  if (!report) return null;

  const { totals, byType, monthly } = report;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">Maintenance Report</h4>
          <p className="text-muted mb-0">Fleet-wide maintenance activity, costs, and round counts</p>
        </div>
        <CButtonGroup size="sm">
          <CButton color="success" variant="outline" onClick={exportToCSV}>
            <FaFileExcel className="me-1" /> Export CSV
          </CButton>
        </CButtonGroup>
      </div>

      {/* Summary Stats */}
      <CRow className="g-3 mb-4">
        <CCol md={3}>
          <CCard className="text-center h-100">
            <CCardBody>
              <h6 className="text-muted small">Total Spend</h6>
              <h4>{formatCurrency(totals.totalCost)}</h4>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={3}>
          <CCard className="text-center h-100">
            <CCardBody>
              <h6 className="text-muted small">Total Rounds Fired</h6>
              <h4>{totals.totalRounds.toLocaleString()}</h4>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={3}>
          <CCard className="text-center h-100">
            <CCardBody>
              <h6 className="text-muted small">Total Entries</h6>
              <h4>{totals.totalEntries}</h4>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={3}>
          <CCard className="text-center h-100">
            <CCardBody>
              <h6 className="text-muted small">Firearms Serviced</h6>
              <h4>{totals.firearmsServiced}</h4>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Service Type Breakdown */}
      {byType.length > 0 && (
        <CCard className="mb-4">
          <CCardHeader>
            <h6 className="mb-0">By Service Type</h6>
          </CCardHeader>
          <CCardBody>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={byType}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#495057' : '#dee2e6'} />
                <XAxis dataKey="type" tick={{ fill: textColor, fontSize: 12 }} stroke={textColor} />
                <YAxis yAxisId="left" tick={{ fill: textColor }} stroke={textColor} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: textColor }} stroke={textColor} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#212529' : '#fff',
                    border: isDark ? '1px solid #495057' : '1px solid #dee2e6',
                    color: textColor,
                  }}
                  formatter={(value: number, name: string) =>
                    name === 'Cost' ? formatCurrency(value) : value
                  }
                />
                <Legend />
                <Bar yAxisId="left" dataKey="count" fill="#0d6efd" name="Count" />
                <Bar yAxisId="right" dataKey="totalCost" fill="#198754" name="Cost" />
              </BarChart>
            </ResponsiveContainer>
          </CCardBody>
        </CCard>
      )}

      {/* Monthly Timeline */}
      {monthly.length > 0 && (
        <CCard className="mb-4">
          <CCardHeader>
            <h6 className="mb-0">Monthly Activity (Last 12 Months)</h6>
          </CCardHeader>
          <CCardBody>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#495057' : '#dee2e6'} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: textColor, fontSize: 11 }}
                  stroke={textColor}
                  tickFormatter={(v) => {
                    const [y, m] = v.split('-');
                    return new Date(Number(y), Number(m) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                  }}
                />
                <YAxis yAxisId="left" tick={{ fill: textColor }} stroke={textColor} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: textColor }} stroke={textColor} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#212529' : '#fff',
                    border: isDark ? '1px solid #495057' : '1px solid #dee2e6',
                    color: textColor,
                  }}
                  formatter={(value: number, name: string) =>
                    name === 'Cost' ? formatCurrency(value) : value.toLocaleString()
                  }
                  labelFormatter={(v) => {
                    const [y, m] = v.split('-');
                    return new Date(Number(y), Number(m) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="totalRounds" fill="#0d6efd" name="Rounds" />
                <Bar yAxisId="right" dataKey="totalCost" fill="#198754" name="Cost" />
              </BarChart>
            </ResponsiveContainer>
          </CCardBody>
        </CCard>
      )}

      {/* Per-Firearm Table */}
      <CCard>
        <CCardHeader>
          <h6 className="mb-0">
            By Firearm
            {sortedFirearms.length > 0 && <CBadge color="secondary" className="ms-2">{sortedFirearms.length}</CBadge>}
          </h6>
        </CCardHeader>
        <CCardBody className="p-0">
          <table className="table table-hover table-responsive mb-0">
            <thead>
              <tr>
                <th role="button" onClick={() => handleSort('itemName')}>
                  Firearm{sortIndicator('itemName')}
                </th>
                <th role="button" className="text-end" onClick={() => handleSort('totalRounds')}>
                  Rounds{sortIndicator('totalRounds')}
                </th>
                <th role="button" className="text-end" onClick={() => handleSort('totalCost')}>
                  Cost{sortIndicator('totalCost')}
                </th>
                <th role="button" className="text-end" onClick={() => handleSort('entryCount')}>
                  Entries{sortIndicator('entryCount')}
                </th>
                <th role="button" className="text-end" onClick={() => handleSort('lastServiceDate')}>
                  Last Service{sortIndicator('lastServiceDate')}
                </th>
                <th className="text-end">Days Since</th>
              </tr>
            </thead>
            <tbody>
              {paginatedFirearms.map((f) => {
                const days = daysSince(f.lastServiceDate);
                return (
                  <tr key={f.itemId}>
                    <td>
                      <Link to={`/items/${f.itemId}`}>{f.itemName}</Link>
                    </td>
                    <td className="text-end">{f.totalRounds.toLocaleString()}</td>
                    <td className="text-end">{formatCurrency(f.totalCost)}</td>
                    <td className="text-end">{f.entryCount}</td>
                    <td className="text-end">{formatDate(f.lastServiceDate)}</td>
                    <td className="text-end">
                      <CBadge color={days > 90 ? 'danger' : days > 30 ? 'warning' : 'success'}>
                        {days}d
                      </CBadge>
                    </td>
                  </tr>
                );
              })}
              {sortedFirearms.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    No maintenance records yet
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
              totalItems={sortedFirearms.length}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </CCardFooter>
        )}
      </CCard>
    </div>
  );
}
