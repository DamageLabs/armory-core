import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import {
  CCard, CCardHeader, CCardBody, CButton, CListGroup, CListGroupItem,
  CBadge, CSpinner, CFormLabel, CFormInput, CFormSelect, CNav, CNavItem, CNavLink,
} from '@coreui/react';
import { Receipt, AttachmentCategory, ATTACHMENT_CATEGORIES } from '../../types/Receipt';
import * as receiptService from '../../services/receiptService';
import { useAlert } from '../../contexts/AlertContext';
import { formatBytes } from '../../utils/imageOptimizer';
import { formatDate } from '../../utils/formatters';
import ConfirmModal from '../common/ConfirmModal';

interface AttachmentListProps {
  itemId: number;
}

const ALLOWED_TYPES = [
  'image/png', 'image/jpeg', 'application/pdf', 'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export default function AttachmentList({ itemId }: AttachmentListProps) {
  const { showSuccess, showError } = useAlert();
  const [attachments, setAttachments] = useState<Receipt[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Receipt | null>(null);
  const [previewItem, setPreviewItem] = useState<Receipt | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | AttachmentCategory>('all');
  const [uploadCategory, setUploadCategory] = useState<AttachmentCategory>('receipt');

  useEffect(() => {
    loadAttachments();
  }, [itemId]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function loadAttachments() {
    try {
      const data = await receiptService.getReceipts(itemId);
      setAttachments(data);
    } catch {
      // Supplementary — silent fail
    }
  }

  const filtered = activeTab === 'all'
    ? attachments
    : attachments.filter((a) => a.category === activeTab);

  const categoryCounts = attachments.reduce<Record<string, number>>((acc, a) => {
    acc[a.category] = (acc[a.category] || 0) + 1;
    return acc;
  }, {});

  const handlePreview = useCallback(async (attachment: Receipt) => {
    if (previewItem?.id === attachment.id) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewItem(null);
      setPreviewUrl(null);
      return;
    }

    setIsLoadingPreview(true);
    setPreviewItem(attachment);
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    try {
      const url = await receiptService.getReceiptBlobUrl(attachment.id);
      setPreviewUrl(url);
    } catch {
      showError('Failed to load preview.');
      setPreviewItem(null);
      setPreviewUrl(null);
    } finally {
      setIsLoadingPreview(false);
    }
  }, [previewItem, previewUrl, showError]);

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      showError('Unsupported file type. Allowed: PNG, JPEG, PDF, TXT, DOC, DOCX.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showError('File must be under 10MB.');
      return;
    }

    setIsUploading(true);
    try {
      await receiptService.uploadReceipt(itemId, file, uploadCategory);
      showSuccess('Attachment uploaded.');
      await loadAttachments();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to upload attachment.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await receiptService.deleteReceipt(deleteTarget.id);
      showSuccess('Attachment deleted.');
      setAttachments((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      if (previewItem?.id === deleteTarget.id) {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewItem(null);
        setPreviewUrl(null);
      }
    } catch {
      showError('Failed to delete attachment.');
    }
    setDeleteTarget(null);
  };

  const canPreview = (mimeType: string) =>
    mimeType.startsWith('image/') || mimeType === 'application/pdf';

  const mimeIcon = (mimeType: string) => {
    if (mimeType === 'application/pdf') return 'PDF';
    if (mimeType.startsWith('image/')) return 'IMG';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'DOC';
    if (mimeType === 'text/plain') return 'TXT';
    return 'FILE';
  };

  const mimeColor = (mimeType: string) => {
    if (mimeType === 'application/pdf') return 'danger';
    if (mimeType.startsWith('image/')) return 'info';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'primary';
    return 'secondary';
  };

  const categoryLabel = (cat: string) =>
    ATTACHMENT_CATEGORIES.find((c) => c.value === cat)?.label || cat;

  return (
    <>
      <CCard className="mb-3">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">Attachments</h6>
          <div className="d-flex align-items-center gap-2">
            <CFormSelect
              size="sm"
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value as AttachmentCategory)}
              style={{ width: '130px' }}
            >
              {ATTACHMENT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </CFormSelect>
            <CFormLabel
              htmlFor="attachment-upload"
              className="btn btn-sm btn-outline-primary mb-0"
              style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {isUploading ? <><CSpinner size="sm" className="me-1" />Uploading...</> : 'Upload'}
            </CFormLabel>
            <CFormInput
              id="attachment-upload"
              type="file"
              accept=".png,.jpg,.jpeg,.pdf,.txt,.doc,.docx"
              onChange={handleUpload}
              disabled={isUploading}
              className="d-none"
            />
          </div>
        </CCardHeader>

        {attachments.length > 0 && (
          <CNav variant="tabs" className="px-3 pt-2">
            <CNavItem>
              <CNavLink
                active={activeTab === 'all'}
                onClick={() => setActiveTab('all')}
                style={{ cursor: 'pointer' }}
              >
                All <CBadge color="secondary" className="ms-1">{attachments.length}</CBadge>
              </CNavLink>
            </CNavItem>
            {ATTACHMENT_CATEGORIES.filter((c) => categoryCounts[c.value]).map((c) => (
              <CNavItem key={c.value}>
                <CNavLink
                  active={activeTab === c.value}
                  onClick={() => setActiveTab(c.value)}
                  style={{ cursor: 'pointer' }}
                >
                  {c.label} <CBadge color="secondary" className="ms-1">{categoryCounts[c.value]}</CBadge>
                </CNavLink>
              </CNavItem>
            ))}
          </CNav>
        )}

        {filtered.length > 0 ? (
          <>
            <CListGroup flush>
              {filtered.map((attachment) => (
                <CListGroupItem
                  key={attachment.id}
                  as={canPreview(attachment.mimeType) ? 'button' : 'div'}
                  active={previewItem?.id === attachment.id}
                  onClick={canPreview(attachment.mimeType) ? () => handlePreview(attachment) : undefined}
                  className="d-flex justify-content-between align-items-center"
                  style={canPreview(attachment.mimeType) ? { cursor: 'pointer' } : undefined}
                >
                  <div>
                    <CBadge color={mimeColor(attachment.mimeType)} className="me-2">
                      {mimeIcon(attachment.mimeType)}
                    </CBadge>
                    {attachment.originalName}
                    <CBadge color="light" textColor="dark" className="ms-2">
                      {categoryLabel(attachment.category)}
                    </CBadge>
                    <small className="text-muted ms-2">
                      {formatBytes(attachment.sizeBytes)} &middot; {formatDate(attachment.createdAt)}
                    </small>
                  </div>
                  <CButton
                    color="danger"
                    variant="outline"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(attachment); }}
                  >
                    Delete
                  </CButton>
                </CListGroupItem>
              ))}
            </CListGroup>

            {isLoadingPreview && (
              <CCardBody className="text-center py-4">
                <CSpinner size="sm" className="me-2" />
                Loading preview...
              </CCardBody>
            )}

            {previewUrl && previewItem && !isLoadingPreview && (
              <CCardBody className="p-2">
                {previewItem.mimeType.startsWith('image/') ? (
                  <img
                    src={previewUrl}
                    alt={previewItem.originalName}
                    className="img-fluid rounded"
                    style={{ maxHeight: '500px', width: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <iframe
                    src={previewUrl}
                    title={previewItem.originalName}
                    style={{ width: '100%', height: '500px', border: 'none', borderRadius: '4px' }}
                  />
                )}
              </CCardBody>
            )}
          </>
        ) : (
          <CCardBody className="text-muted text-center py-3">
            {attachments.length > 0 ? 'No attachments in this category.' : 'No attachments.'}
          </CCardBody>
        )}
      </CCard>

      <ConfirmModal
        show={!!deleteTarget}
        title="Delete Attachment"
        message={`Delete "${deleteTarget?.originalName}"?`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
