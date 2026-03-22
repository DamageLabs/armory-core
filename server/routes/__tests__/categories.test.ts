// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, createProtectedApp, authHeader, adminAuthHeader } from './setup';

vi.mock('../../db/index', () => ({
  queryAll: vi.fn(),
  queryOne: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  deleteById: vi.fn(),
  count: vi.fn(),
  run: vi.fn(),
}));

import categoryRoutes from '../categories';
import * as db from '../../db/index';

const app = createProtectedApp(categoryRoutes, '/api/categories');

const mockCategory = {
  id: 1, name: 'Resistors', sortOrder: 0, inventoryTypeId: 1,
  createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
};

describe('categories routes', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('GET /', () => {
    it('returns all categories', async () => {
      vi.mocked(db.queryAll).mockReturnValue([mockCategory]);
      const res = await request(app).get('/api/categories').set(authHeader());
      expect(res.status).toBe(200);
      expect(res.body).toEqual([mockCategory]);
    });

    it('filters by typeId', async () => {
      vi.mocked(db.queryAll).mockReturnValue([mockCategory]);
      const res = await request(app).get('/api/categories?typeId=1').set(authHeader());
      expect(res.status).toBe(200);
      expect(db.queryAll).toHaveBeenCalledWith(
        expect.stringContaining('inventory_type_id'),
        ['1']
      );
    });
  });

  describe('GET /counts', () => {
    it('returns category item counts', async () => {
      vi.mocked(db.queryAll).mockReturnValue([{ name: 'Resistors', count: 10 }]);
      const res = await request(app).get('/api/categories/counts').set(authHeader());
      expect(res.status).toBe(200);
    });
  });

  describe('POST /', () => {
    it('creates category', async () => {
      vi.mocked(db.queryOne).mockReturnValue(null);
      vi.mocked(db.insert).mockReturnValue({ ...mockCategory, id: 2, name: 'LEDs' });
      const res = await request(app).post('/api/categories').set(adminAuthHeader()).send({ name: 'LEDs', sortOrder: 1, inventoryTypeId: 1 });
      expect(res.status).toBe(201);
    });

    it('returns 400 for missing name', async () => {
      const res = await request(app).post('/api/categories').set(adminAuthHeader()).send({ sortOrder: 0 });
      expect(res.status).toBe(400);
    });

    it('returns 400 for duplicate', async () => {
      vi.mocked(db.queryOne).mockReturnValue({ id: 1 });
      const res = await request(app).post('/api/categories').set(adminAuthHeader()).send({ name: 'Resistors', inventoryTypeId: 1 });
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /reorder', () => {
    it('reorders categories', async () => {
      vi.mocked(db.run).mockReturnValue({ changes: 1, lastInsertRowid: 0 } as never);
      const res = await request(app).put('/api/categories/reorder').set(adminAuthHeader()).send({ orderedIds: [3, 1, 2] });
      expect(res.status).toBe(200);
    });

    it('returns 400 for invalid input', async () => {
      const res = await request(app).put('/api/categories/reorder').set(adminAuthHeader()).send({ orderedIds: 'bad' });
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /:id', () => {
    it('deletes category when not in use', async () => {
      vi.mocked(db.queryOne).mockReturnValue(mockCategory);
      vi.mocked(db.count).mockReturnValue(0);
      vi.mocked(db.deleteById).mockReturnValue(true);
      const res = await request(app).delete('/api/categories/1').set(adminAuthHeader());
      expect(res.status).toBe(200);
    });

    it('returns 400 when category in use', async () => {
      vi.mocked(db.queryOne).mockReturnValue(mockCategory);
      vi.mocked(db.count).mockReturnValue(3);
      const res = await request(app).delete('/api/categories/1').set(adminAuthHeader());
      expect(res.status).toBe(400);
    });

    it('returns 404 when not found', async () => {
      vi.mocked(db.queryOne).mockReturnValue(null);
      const res = await request(app).delete('/api/categories/999').set(adminAuthHeader());
      expect(res.status).toBe(404);
    });
  });
});
