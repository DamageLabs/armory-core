// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import path from 'path';
import { createApp } from './setup';

// Mock fs before importing route
vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...actual,
    default: {
      ...actual,
      existsSync: vi.fn(() => true),
      mkdirSync: vi.fn(),
      unlink: vi.fn((_p: string, cb: () => void) => cb()),
    },
    existsSync: vi.fn(() => true),
    mkdirSync: vi.fn(),
    unlink: vi.fn((_p: string, cb: () => void) => cb()),
  };
});

vi.mock('../../db/index', () => ({
  queryAll: vi.fn(),
  queryOne: vi.fn(),
  run: vi.fn(),
  getDatabase: vi.fn(() => ({
    prepare: vi.fn(() => ({
      get: vi.fn(),
      all: vi.fn(() => []),
      run: vi.fn(() => ({ lastInsertRowid: 1 })),
    })),
  })),
}));

import receiptRoutes from '../receipts';
import * as db from '../../db/index';

const app = createApp(receiptRoutes, '/api/receipts');

const mockReceipt = {
  id: 1,
  item_id: 1,
  filename: 'abc-receipt.pdf',
  original_name: 'receipt.pdf',
  mime_type: 'application/pdf',
  size_bytes: 50000,
  created_at: '2026-01-01T00:00:00Z',
};

describe('receipt routes', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('GET /api/receipts/:itemId/receipts', () => {
    it('returns receipts for an item', async () => {
      vi.mocked(db.queryOne).mockReturnValue({ id: 1 });
      vi.mocked(db.queryAll).mockReturnValue([mockReceipt]);
      const res = await request(app).get('/api/receipts/1/receipts');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([mockReceipt]);
    });

    it('returns 404 for non-existent item', async () => {
      vi.mocked(db.queryOne).mockReturnValue(null);
      const res = await request(app).get('/api/receipts/999/receipts');
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/receipts/:receiptId', () => {
    it('deletes an existing receipt', async () => {
      vi.mocked(db.queryOne).mockReturnValue(mockReceipt);
      const res = await request(app).delete('/api/receipts/1');
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Receipt deleted');
      expect(db.run).toHaveBeenCalledWith('DELETE FROM receipts WHERE id = ?', [1]);
    });

    it('returns 404 for non-existent receipt', async () => {
      vi.mocked(db.queryOne).mockReturnValue(null);
      const res = await request(app).delete('/api/receipts/999');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/receipts/download/:receiptId', () => {
    it('returns 404 for non-existent receipt', async () => {
      vi.mocked(db.queryOne).mockReturnValue(null);
      const res = await request(app).get('/api/receipts/download/999');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/receipts/:itemId/receipts', () => {
    it('returns 404 for non-existent item', async () => {
      vi.mocked(db.queryOne).mockReturnValue(null);
      const res = await request(app)
        .post('/api/receipts/999/receipts')
        .attach('file', Buffer.from('fake'), { filename: 'test.pdf', contentType: 'application/pdf' });
      expect(res.status).toBe(404);
    });

    it('returns 400 when no file uploaded', async () => {
      vi.mocked(db.queryOne).mockReturnValue({ id: 1 });
      const res = await request(app).post('/api/receipts/1/receipts');
      expect(res.status).toBe(400);
    });
  });
});
