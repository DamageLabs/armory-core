import { describe, it, expect } from 'vitest';
import { uploadReceiptMeta } from '../receipts';

describe('receipt schemas', () => {
  describe('uploadReceiptMeta', () => {
    it('accepts valid PNG metadata', () => {
      const result = uploadReceiptMeta.safeParse({
        originalName: 'receipt.png',
        mimeType: 'image/png',
        sizeBytes: 500_000,
      });
      expect(result.success).toBe(true);
    });

    it('accepts valid JPEG metadata', () => {
      const result = uploadReceiptMeta.safeParse({
        originalName: 'photo.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 1_000_000,
      });
      expect(result.success).toBe(true);
    });

    it('accepts valid PDF metadata', () => {
      const result = uploadReceiptMeta.safeParse({
        originalName: 'invoice.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 2_000_000,
      });
      expect(result.success).toBe(true);
    });

    it('accepts valid TXT metadata', () => {
      const result = uploadReceiptMeta.safeParse({
        originalName: 'notes.txt',
        mimeType: 'text/plain',
        sizeBytes: 100_000,
      });
      expect(result.success).toBe(true);
    });

    it('accepts valid DOC metadata', () => {
      const result = uploadReceiptMeta.safeParse({
        originalName: 'manual.doc',
        mimeType: 'application/msword',
        sizeBytes: 100_000,
      });
      expect(result.success).toBe(true);
    });

    it('accepts valid DOCX metadata', () => {
      const result = uploadReceiptMeta.safeParse({
        originalName: 'manual.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        sizeBytes: 100_000,
      });
      expect(result.success).toBe(true);
    });

    it('rejects unsupported MIME type', () => {
      const result = uploadReceiptMeta.safeParse({
        originalName: 'archive.zip',
        mimeType: 'application/zip',
        sizeBytes: 100_000,
      });
      expect(result.success).toBe(false);
    });

    it('rejects file over 10MB', () => {
      const result = uploadReceiptMeta.safeParse({
        originalName: 'big.png',
        mimeType: 'image/png',
        sizeBytes: 11 * 1024 * 1024,
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing originalName', () => {
      const result = uploadReceiptMeta.safeParse({
        mimeType: 'image/png',
        sizeBytes: 500_000,
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty originalName', () => {
      const result = uploadReceiptMeta.safeParse({
        originalName: '',
        mimeType: 'image/png',
        sizeBytes: 500_000,
      });
      expect(result.success).toBe(false);
    });

    it('accepts exactly 10MB', () => {
      const result = uploadReceiptMeta.safeParse({
        originalName: 'exact.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 10 * 1024 * 1024,
      });
      expect(result.success).toBe(true);
    });
  });
});
