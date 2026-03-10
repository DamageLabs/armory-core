// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from './setup';

vi.mock('../../db/index', () => ({
  queryAll: vi.fn(),
  queryOne: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  deleteById: vi.fn(),
}));

import bomRoutes from '../boms';
import * as db from '../../db/index';

const app = createApp(bomRoutes, '/api/boms');

const mockBOM = {
  id: 1, name: 'AR-15 Build', description: 'Full build',
  items: [{ itemId: 1, quantity: 1 }],
  createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
};

describe('boms routes', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('GET /', () => {
    it('returns all BOMs', async () => {
      vi.mocked(db.queryAll).mockReturnValue([mockBOM]);
      const res = await request(app).get('/api/boms');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([mockBOM]);
    });
  });

  describe('GET /:id', () => {
    it('returns BOM when found', async () => {
      vi.mocked(db.queryOne).mockReturnValue(mockBOM);
      const res = await request(app).get('/api/boms/1');
      expect(res.status).toBe(200);
    });

    it('returns 404 when not found', async () => {
      vi.mocked(db.queryOne).mockReturnValue(null);
      const res = await request(app).get('/api/boms/999');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /', () => {
    it('creates BOM', async () => {
      vi.mocked(db.insert).mockReturnValue({ ...mockBOM, id: 2 });
      const res = await request(app).post('/api/boms').send({ name: 'New', description: '', items: [] });
      expect(res.status).toBe(201);
    });
  });

  describe('PUT /:id', () => {
    it('updates BOM', async () => {
      vi.mocked(db.update).mockReturnValue({ ...mockBOM, name: 'Updated' });
      const res = await request(app).put('/api/boms/1').send({ name: 'Updated' });
      expect(res.status).toBe(200);
    });

    it('returns 404 when not found', async () => {
      vi.mocked(db.update).mockReturnValue(null);
      const res = await request(app).put('/api/boms/999').send({ name: 'X' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /:id', () => {
    it('deletes BOM', async () => {
      vi.mocked(db.deleteById).mockReturnValue(true);
      const res = await request(app).delete('/api/boms/1');
      expect(res.status).toBe(200);
    });

    it('returns 404 when not found', async () => {
      vi.mocked(db.deleteById).mockReturnValue(false);
      const res = await request(app).delete('/api/boms/999');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /:id/cost', () => {
    it('returns cost breakdown', async () => {
      vi.mocked(db.queryOne)
        .mockReturnValueOnce(mockBOM)
        .mockReturnValueOnce({ id: 1, name: 'Lower', unitValue: 200, quantity: 5 });
      const res = await request(app).get('/api/boms/1/cost');
      expect(res.status).toBe(200);
      expect(res.body.totalCost).toBe(200);
    });

    it('returns 404 when BOM not found', async () => {
      vi.mocked(db.queryOne).mockReturnValue(null);
      const res = await request(app).get('/api/boms/999/cost');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /:id/duplicate', () => {
    it('duplicates BOM', async () => {
      vi.mocked(db.queryOne).mockReturnValue(mockBOM);
      vi.mocked(db.insert).mockReturnValue({ ...mockBOM, id: 3, name: 'Copy' });
      const res = await request(app).post('/api/boms/1/duplicate').send({ name: 'Copy' });
      expect(res.status).toBe(201);
    });

    it('returns 404 when not found', async () => {
      vi.mocked(db.queryOne).mockReturnValue(null);
      const res = await request(app).post('/api/boms/999/duplicate').send({ name: 'Copy' });
      expect(res.status).toBe(404);
    });
  });
});
