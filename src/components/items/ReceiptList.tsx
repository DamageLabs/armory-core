import { useState, useEffect, ChangeEvent } from 'react';
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

  useEffect(() => {
    loadReceipts();
  }, [itemId]);

  async function loadReceipts() {
    try {
      const data = await receiptService.getReceipts(itemId);
      setReceipts(data);
    } catch {
      // Silently handle — receipts section is supplementary
    }
  }

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
          <ListGroup variant="flush">
            {receipts.map((receipt) => (
              <ListGroup.Item key={receipt.id} className="d-flex justify-content-between align-items-center">
                <div>
                  <Badge bg={receipt.mime_type === 'application/pdf' ? 'danger' : 'info'} className="me-2">
                    {mimeIcon(receipt.mime_type)}
                  </Badge>
                  <a
                    href={receiptService.getDownloadUrl(receipt.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {receipt.original_name}
                  </a>
                  <small className="text-muted ms-2">
                    {formatBytes(receipt.size_bytes)} &middot; {formatDate(receipt.created_at)}
                  </small>
                </div>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => setDeleteTarget(receipt)}
                >
                  Delete
                </Button>
              </ListGroup.Item>
            ))}
          </ListGroup>
        ) : (
          <Card.Body className="text-muted text-center py-3">
            No receipts attached.
          </Card.Body>
        )}
      </Card>

      <ConfirmModal
        show={!!deleteTarget}
        title="Delete Receipt"
        message={`Delete "${deleteTarget?.original_name}"?`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
