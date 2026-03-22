import { useState, ChangeEvent } from 'react';
import { CCard, CCardHeader, CCardBody, CButton, CAlert, CBadge, CProgress, CProgressBar, CRow, CCol, CFormLabel, CFormSelect, CFormInput } from '@coreui/react';
import { FaFileUpload, FaCheck, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import * as itemService from '../../services/itemService';
import * as inventoryTypeService from '../../services/inventoryTypeService';
import { useAlert } from '../../contexts/AlertContext';
import {
  RestoreItem,
  parseBackupJSON,
  parseBackupCSV,
  validateRestoreItems,
} from '../../utils/restoreParser';

type RestoreMode = 'merge' | 'replace';
type RestoreStatus = 'idle' | 'preview' | 'restoring' | 'done';

interface RestoreResult {
  created: number;
  skipped: number;
  errors: number;
}

export default function RestoreBackup() {
  const { showSuccess, showError } = useAlert();
  const [items, setItems] = useState<RestoreItem[]>([]);
  const [mode, setMode] = useState<RestoreMode>('merge');
  const [status, setStatus] = useState<RestoreStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<RestoreResult | null>(null);
  const [fileName, setFileName] = useState('');

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const content = await file.text();
    const isJSON = file.name.endsWith('.json');

    let parsed: RestoreItem[];
    try {
      parsed = isJSON ? parseBackupJSON(content) : parseBackupCSV(content);
    } catch {
      showError('Failed to parse backup file.');
      return;
    }

    if (parsed.length === 0) {
      showError('No items found in backup file.');
      return;
    }

    const types = await inventoryTypeService.getAllTypes();
    const validTypeIds = types.map((t) => t.id);
    const validated = validateRestoreItems(parsed, validTypeIds);

    setItems(validated);
    setStatus('preview');
    setResult(null);
  };

  const handleRestore = async () => {
    const validItems = items.filter((it) => it.valid);
    if (validItems.length === 0) {
      showError('No valid items to restore.');
      return;
    }

    setStatus('restoring');
    setProgress(10);

    try {
      if (mode === 'replace') {
        await itemService.deleteAllItems();
        setProgress(30);
      }

      const itemsToSend = validItems.map((it) => ({
        ...it,
        id: it.oldId,
        oldId: undefined,
        valid: undefined,
        errors: undefined,
      }));

      setProgress(50);
      const response = await itemService.bulkCreateItems(itemsToSend);
      setProgress(100);

      const restoreResult: RestoreResult = {
        created: response.created,
        skipped: items.length - validItems.length,
        errors: validItems.length - response.created,
      };
      setResult(restoreResult);
      setStatus('done');
      showSuccess(`Restored ${response.created} items successfully.`);
    } catch {
      showError('Failed to restore backup.');
      setStatus('preview');
    }
  };

  const validCount = items.filter((it) => it.valid).length;
  const invalidCount = items.length - validCount;

  return (
    <CCard>
      <CCardHeader>
        <h5 className="mb-0">Restore from Backup</h5>
      </CCardHeader>
      <CCardBody>
        {status === 'idle' && (
          <>
            <p className="text-muted">
              Upload a JSON or CSV backup file previously exported from Armory Core.
            </p>
            <div>
              <CFormLabel><FaFileUpload className="me-2" />Select Backup File</CFormLabel>
              <CFormInput
                type="file"
                accept=".json,.csv"
                onChange={handleFileChange}
              />
            </div>
          </>
        )}

        {status === 'preview' && (
          <>
            <CAlert color="info">
              <strong>{fileName}</strong> — {items.length} items found
              {invalidCount > 0 && (
                <span className="ms-2">
                  (<CBadge color="danger">{invalidCount} invalid</CBadge>)
                </span>
              )}
            </CAlert>

            <CRow className="mb-3">
              <CCol md={4}>
                <div>
                  <CFormLabel>Restore Mode</CFormLabel>
                  <CFormSelect
                    value={mode}
                    onChange={(e) => setMode(e.target.value as RestoreMode)}
                  >
                    <option value="merge">Merge (add to existing)</option>
                    <option value="replace">Replace All (clear first)</option>
                  </CFormSelect>
                </div>
              </CCol>
            </CRow>

            {mode === 'replace' && (
              <CAlert color="warning">
                <FaExclamationTriangle className="me-2" />
                Replace mode will delete all existing items and history before restoring.
              </CAlert>
            )}

            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table className="table table-striped table-bordered table-sm">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Name</th>
                    <th>Qty</th>
                    <th>Unit Value</th>
                    <th>Category</th>
                    <th>Type ID</th>
                  </tr>
                </thead>
                <tbody>
                  {items.slice(0, 100).map((item, i) => (
                    <tr key={i} className={item.valid ? '' : 'table-danger'}>
                      <td>
                        {item.valid ? (
                          <FaCheck className="text-success" />
                        ) : (
                          <span title={item.errors.join(', ')}>
                            <FaTimes className="text-danger" />
                          </span>
                        )}
                      </td>
                      <td>{item.name || <em className="text-muted">empty</em>}</td>
                      <td>{item.quantity}</td>
                      <td>${item.unitValue.toFixed(2)}</td>
                      <td>{item.category}</td>
                      <td>{item.inventoryTypeId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {items.length > 100 && (
              <p className="text-muted">Showing first 100 of {items.length} items.</p>
            )}

            <div className="mt-3 d-flex gap-2">
              <CButton
                color="primary"
                onClick={handleRestore}
                disabled={validCount === 0}
              >
                Restore {validCount} Items
              </CButton>
              <CButton
                color="secondary"
                variant="outline"
                onClick={() => { setStatus('idle'); setItems([]); }}
              >
                Cancel
              </CButton>
            </div>
          </>
        )}

        {status === 'restoring' && (
          <div className="text-center py-4">
            <p>Restoring items...</p>
            <CProgress animated>
              <CProgressBar value={progress} />
            </CProgress>
          </div>
        )}

        {status === 'done' && result && (
          <>
            <CAlert color="success">
              <h6>Restore Complete</h6>
              <ul className="mb-0">
                <li><strong>{result.created}</strong> items created</li>
                {result.skipped > 0 && <li><strong>{result.skipped}</strong> items skipped (invalid)</li>}
                {result.errors > 0 && <li><strong>{result.errors}</strong> errors</li>}
              </ul>
            </CAlert>
            <CButton
              color="primary"
              variant="outline"
              onClick={() => { setStatus('idle'); setItems([]); setResult(null); }}
            >
              Restore Another Backup
            </CButton>
          </>
        )}
      </CCardBody>
    </CCard>
  );
}
