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
  run: vi.fn(),
  getDatabase: vi.fn(() => ({
    prepare: vi.fn(() => ({ get: vi.fn(), all: vi.fn(), run: vi.fn() })),
  })),
}));

import itemRoutes from '../items';
import * as db from '../../db/index';

const app = createApp(itemRoutes, '/api/items');

const mockItem = {
  id: 1, name: 'Resistor', description: 'A resistor', quantity: 10,
  unitValue: 0.50, value: 5.0, picture: null, category: 'Handguns',
  location: 'Shelf A', barcode: '', reorderPoint: 5, inventoryTypeId: 1,
  customFields: {}, parentItemId: null,
  createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
};

describe('items routes', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('GET /api/items', () => {
    it('returns all items', async () => {
      vi.mocked(db.queryAll).mockReturnValue([mockItem]);
      const res = await request(app).get('/api/items');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([mockItem]);
    });
  });

  describe('GET /api/items/stats', () => {
    it('returns stats', async () => {
      const mockDb = { prepare: vi.fn(() => ({ get: vi.fn(() => ({ totalQuantity: 100, totalValue: 500 })) })) };
      vi.mocked(db.getDatabase).mockReturnValue(mockDb as never);
      const res = await request(app).get('/api/items/stats');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ totalQuantity: 100, totalValue: 500 });
    });
  });

  describe('GET /api/items/:id', () => {
    it('returns item when found', async () => {
      vi.mocked(db.queryOne).mockReturnValue(mockItem);
      const res = await request(app).get('/api/items/1');
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Resistor');
    });

    it('returns 404 when not found', async () => {
      vi.mocked(db.queryOne).mockReturnValue(null);
      const res = await request(app).get('/api/items/999');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/items', () => {
    it('creates item and returns 201', async () => {
      vi.mocked(db.insert).mockReturnValue({ ...mockItem, id: 2 });
      vi.mocked(db.run).mockReturnValue({ changes: 1, lastInsertRowid: 1 } as never);
      const res = await request(app).post('/api/items').send({
        name: 'Glock 19', quantity: 5, unitValue: 1.0, category: 'Handguns',
      });
      expect(res.status).toBe(201);
      expect(db.insert).toHaveBeenCalled();
    });
  });

  describe('PUT /api/items/:id', () => {
    it('updates item', async () => {
      vi.mocked(db.queryOne).mockReturnValue(mockItem);
      vi.mocked(db.update).mockReturnValue({ ...mockItem, name: 'Updated' });
      vi.mocked(db.run).mockReturnValue({ changes: 1, lastInsertRowid: 1 } as never);
      const res = await request(app).put('/api/items/1').send({ name: 'Updated' });
      expect(res.status).toBe(200);
    });

    it('returns 404 when item not found', async () => {
      vi.mocked(db.queryOne).mockReturnValue(null);
      const res = await request(app).put('/api/items/999').send({ name: 'X' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/items/:id', () => {
    it('deletes item', async () => {
      vi.mocked(db.queryOne).mockReturnValue(mockItem);
      vi.mocked(db.run).mockReturnValue({ changes: 1, lastInsertRowid: 0 } as never);
      vi.mocked(db.deleteById).mockReturnValue(true);
      const res = await request(app).delete('/api/items/1');
      expect(res.status).toBe(200);
    });

    it('returns 404 when not found', async () => {
      vi.mocked(db.queryOne).mockReturnValue(null);
      const res = await request(app).delete('/api/items/999');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/items/bulk-delete', () => {
    it('deletes multiple items', async () => {
      vi.mocked(db.queryOne).mockReturnValue(mockItem);
      vi.mocked(db.run).mockReturnValue({ changes: 1, lastInsertRowid: 0 } as never);
      vi.mocked(db.deleteById).mockReturnValue(true);
      const mockDb = { transaction: vi.fn((fn: () => void) => fn) };
      vi.mocked(db.getDatabase).mockReturnValue(mockDb as never);
      const res = await request(app).post('/api/items/bulk-delete').send({ ids: [1, 2] });
      expect(res.status).toBe(200);
    });

    it('returns 400 when ids missing', async () => {
      const res = await request(app).post('/api/items/bulk-delete').send({});
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/items/:id/children', () => {
    it('returns child items', async () => {
      vi.mocked(db.queryAll).mockReturnValue([{ ...mockItem, id: 2, parentItemId: 1 }]);
      const res = await request(app).get('/api/items/1/children');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });
  });

  describe('POST /api/items/bulk-create', () => {
    it('creates multiple items and returns count with id mapping', async () => {
      let insertCallCount = 0;
      vi.mocked(db.insert).mockImplementation(() => {
        insertCallCount++;
        return { id: insertCallCount, name: 'Item' };
      });
      vi.mocked(db.run).mockReturnValue({ changes: 1, lastInsertRowid: 0 } as never);
      const mockDb = { transaction: vi.fn((fn: () => void) => fn) };
      vi.mocked(db.getDatabase).mockReturnValue(mockDb as never);

      const res = await request(app).post('/api/items/bulk-create').send({
        items: [
          { id: 10, name: 'Item A', quantity: 5, unitValue: 10 },
          { id: 11, name: 'Item B', quantity: 3, unitValue: 20 },
        ],
      });
      expect(res.status).toBe(201);
      expect(res.body.created).toBe(2);
      expect(res.body.idMapping).toBeDefined();
    });

    it('remaps parent-child relationships', async () => {
      let insertCallCount = 0;
      vi.mocked(db.insert).mockImplementation(() => {
        insertCallCount++;
        return { id: 100 + insertCallCount, name: 'Item' };
      });
      vi.mocked(db.run).mockReturnValue({ changes: 1, lastInsertRowid: 0 } as never);
      const mockDb = { transaction: vi.fn((fn: () => void) => fn) };
      vi.mocked(db.getDatabase).mockReturnValue(mockDb as never);

      const res = await request(app).post('/api/items/bulk-create').send({
        items: [
          { id: 1, name: 'Parent' },
          { id: 2, name: 'Child', parentItemId: 1 },
        ],
      });
      expect(res.status).toBe(201);
      expect(res.body.created).toBe(2);
    });

    it('returns 400 when items array is missing', async () => {
      const res = await request(app).post('/api/items/bulk-create').send({});
      expect(res.status).toBe(400);
    });

    it('returns 400 when items array is empty', async () => {
      const res = await request(app).post('/api/items/bulk-create').send({ items: [] });
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/items/all', () => {
    it('deletes all items and history', async () => {
      vi.mocked(db.run).mockReturnValue({ changes: 1, lastInsertRowid: 0 } as never);
      const mockDb = { transaction: vi.fn((fn: () => void) => fn) };
      vi.mocked(db.getDatabase).mockReturnValue(mockDb as never);

      const res = await request(app).delete('/api/items/all');
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('cleared');
      expect(db.run).toHaveBeenCalledTimes(3);
    });
  });
});
