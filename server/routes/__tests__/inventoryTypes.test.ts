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
  count: vi.fn(),
}));

import inventoryTypeRoutes from '../inventoryTypes';
import * as db from '../../db/index';

const app = createApp(inventoryTypeRoutes, '/api/inventory-types');

const mockType = {
  id: 1, name: 'Electronics', icon: 'FaMicrochip',
  schema: [{ key: 'modelNumber', label: 'Model Number', type: 'text', required: false }],
  createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
};

describe('inventoryTypes routes', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('GET /', () => {
    it('returns all types', async () => {
      vi.mocked(db.queryAll).mockReturnValue([mockType]);
      const res = await request(app).get('/api/inventory-types');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([mockType]);
    });
  });

  describe('GET /:id', () => {
    it('returns type when found', async () => {
      vi.mocked(db.queryOne).mockReturnValue(mockType);
      const res = await request(app).get('/api/inventory-types/1');
      expect(res.status).toBe(200);
    });

    it('returns 404 when not found', async () => {
      vi.mocked(db.queryOne).mockReturnValue(null);
      const res = await request(app).get('/api/inventory-types/999');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /', () => {
    it('creates type and returns 201', async () => {
      vi.mocked(db.queryOne).mockReturnValue(null);
      vi.mocked(db.insert).mockReturnValue({ ...mockType, id: 2, name: 'Tools' });
      const res = await request(app).post('/api/inventory-types').send({ name: 'Tools', icon: 'FaWrench', schema: [] });
      expect(res.status).toBe(201);
    });

    it('returns 400 when name missing', async () => {
      const res = await request(app).post('/api/inventory-types').send({ icon: 'X' });
      expect(res.status).toBe(400);
    });

    it('returns 400 for duplicate name', async () => {
      vi.mocked(db.queryOne).mockReturnValue({ id: 1 });
      const res = await request(app).post('/api/inventory-types').send({ name: 'Electronics' });
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /:id', () => {
    it('updates type', async () => {
      vi.mocked(db.queryOne).mockReturnValue(null);
      vi.mocked(db.update).mockReturnValue({ ...mockType, name: 'Updated' });
      const res = await request(app).put('/api/inventory-types/1').send({ name: 'Updated' });
      expect(res.status).toBe(200);
    });

    it('returns 404 when not found', async () => {
      vi.mocked(db.queryOne).mockReturnValue(null);
      vi.mocked(db.update).mockReturnValue(null);
      const res = await request(app).put('/api/inventory-types/999').send({ icon: 'X' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /:id', () => {
    it('deletes type when not in use', async () => {
      vi.mocked(db.count).mockReturnValue(0);
      vi.mocked(db.deleteById).mockReturnValue(true);
      const res = await request(app).delete('/api/inventory-types/1');
      expect(res.status).toBe(200);
    });

    it('returns 400 when type is in use', async () => {
      vi.mocked(db.count).mockReturnValue(5);
      const res = await request(app).delete('/api/inventory-types/1');
      expect(res.status).toBe(400);
    });

    it('returns 404 when not found', async () => {
      vi.mocked(db.count).mockReturnValue(0);
      vi.mocked(db.deleteById).mockReturnValue(false);
      const res = await request(app).delete('/api/inventory-types/999');
      expect(res.status).toBe(404);
    });
  });
});
