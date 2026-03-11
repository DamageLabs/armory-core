import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { Card, Button, ListGroup, Badge, Form, Spinner } from 'react-bootstrap';
import { Receipt } from '../../types/Receipt';
import * as receiptService from '../../services/receiptService';
import { useAlert } from '../../contexts/AlertContext';
import { formatBytes } from '../../utils/imageOptimizer';
import { formatDate } from '../../utils/formatters';
import ConfirmModal from '../common/ConfirmModal';

interface ReceiptListProps {
  itemId: number;
}

export default function ReceiptList({ itemId }: ReceiptListProps) {
  const { showSuccess, showError } = useAlert();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Receipt | null>(null);
  const [previewReceipt, setPreviewReceipt] = useState<Receipt | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  useEffect(() => {
    loadReceipts();
  }, [itemId]);

  // Clean up blob URL on unmount or preview change
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function loadReceipts() {
    try {
      const data = await receiptService.getReceipts(itemId);
      setReceipts(data);
    } catch {
      // Silently handle — receipts section is supplementary
    }
  }

  const handlePreview = useCallback(async (receipt: Receipt) => {
    if (previewReceipt?.id === receipt.id) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewReceipt(null);
      setPreviewUrl(null);
      return;
    }

    setIsLoadingPreview(true);
    setPreviewReceipt(receipt);
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    try {
      const url = await receiptService.getReceiptBlobUrl(receipt.id);
      setPreviewUrl(url);
    } catch {
      showError('Failed to load receipt preview.');
      setPreviewReceipt(null);
      setPreviewUrl(null);
    } finally {
      setIsLoadingPreview(false);
    }
  }, [previewReceipt, previewUrl, showError]);

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      showError('File must be PNG, JPEG, or PDF.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showError('File must be under 10MB.');
      return;
    }

    setIsUploading(true);
    try {
      await receiptService.uploadReceipt(itemId, file);
      showSuccess('Receipt uploaded.');
      await loadReceipts();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to upload receipt.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await receiptService.deleteReceipt(deleteTarget.id);
      showSuccess('Receipt deleted.');
      setReceipts((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      if (previewReceipt?.id === deleteTarget.id) {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewReceipt(null);
        setPreviewUrl(null);
      }
    } catch {
      showError('Failed to delete receipt.');
    }
    setDeleteTarget(null);
  };

  const mimeIcon = (mimeType: string) => {
    if (mimeType === 'application/pdf') return 'PDF';
    if (mimeType.startsWith('image/')) return 'IMG';
    return 'FILE';
  };

  return (
    <>
      <Card className="mb-3">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">Receipts</h6>
          <div>
            <Form.Label
              htmlFor="receipt-upload"
              className="btn btn-sm btn-outline-primary mb-0"
              style={{ cursor: 'pointer' }}
            >
              {isUploading ? <><Spinner size="sm" animation="border" className="me-1" />Uploading...</> : 'Upload'}
            </Form.Label>
            <Form.Control
              id="receipt-upload"
              type="file"
              accept="image/png,image/jpeg,application/pdf"
              onChange={handleUpload}
              disabled={isUploading}
              className="d-none"
            />
          </div>
        </Card.Header>
        {receipts.length > 0 ? (
          <>
            <ListGroup variant="flush">
              {receipts.map((receipt) => (
                <ListGroup.Item
                  key={receipt.id}
                  action
                  active={previewReceipt?.id === receipt.id}
                  onClick={() => handlePreview(receipt)}
                  className="d-flex justify-content-between align-items-center"
                >
                  <div>
                    <Badge bg={receipt.mimeType === 'application/pdf' ? 'danger' : 'info'} className="me-2">
                      {mimeIcon(receipt.mimeType)}
                    </Badge>
                    {receipt.originalName}
                    <small className="text-muted ms-2">
                      {formatBytes(receipt.sizeBytes)} &middot; {formatDate(receipt.createdAt)}
                    </small>
                  </div>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(receipt); }}
                  >
                    Delete
                  </Button>
                </ListGroup.Item>
              ))}
            </ListGroup>

            {isLoadingPreview && (
              <Card.Body className="text-center py-4">
                <Spinner animation="border" size="sm" className="me-2" />
                Loading preview...
              </Card.Body>
            )}

            {previewUrl && previewReceipt && !isLoadingPreview && (
              <Card.Body className="p-2">
                {previewReceipt.mimeType.startsWith('image/') ? (
                  <img
                    src={previewUrl}
                    alt={previewReceipt.originalName}
                    className="img-fluid rounded"
                    style={{ maxHeight: '500px', width: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <iframe
                    src={previewUrl}
                    title={previewReceipt.originalName}
                    style={{ width: '100%', height: '500px', border: 'none', borderRadius: '4px' }}
                  />
                )}
              </Card.Body>
            )}
          </>
        ) : (
          <Card.Body className="text-muted text-center py-3">
            No receipts attached.
          </Card.Body>
        )}
      </Card>

      <ConfirmModal
        show={!!deleteTarget}
        title="Delete Receipt"
        message={`Delete "${deleteTarget?.originalName}"?`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
