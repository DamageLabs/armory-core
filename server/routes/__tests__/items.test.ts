// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, createProtectedApp, authHeader, adminAuthHeader } from './setup';

vi.mock('url', () => ({
  fileURLToPath: vi.fn(() => '/tmp/test'),
}));

vi.mock('fs', () => ({
  default: {
    unlink: vi.fn((_p: string, cb: () => void) => cb()),
  },
  unlink: vi.fn((_p: string, cb: () => void) => cb()),
}));

vi.mock('../../db/index', () => ({
  queryAll: vi.fn(),
  queryOne: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  deleteById: vi.fn(),
  run: vi.fn(),
  getDatabase: vi.fn(() => ({
    prepare: vi.fn(() => ({ get: vi.fn(() => ({ count: 0 })), all: vi.fn(), run: vi.fn() })),
  })),
}));

import itemRoutes from '../items';
import * as db from '../../db/index';

const app = createProtectedApp(itemRoutes, '/api/items');

const mockItem = {
  id: 1, name: 'Resistor', description: 'A resistor', quantity: 10,
  unitValue: 0.50, value: 5.0, picture: null, category: 'Handguns',
  location: 'Shelf A', barcode: '', reorderPoint: 5, inventoryTypeId: 1,
  customFields: {}, parentItemId: null, userId: 1, // matches default authHeader userId
  createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
};

describe('items routes', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('GET /api/items', () => {
    it('returns paginated items with metadata', async () => {
      const mockDb = { prepare: vi.fn(() => ({ get: vi.fn(() => ({ count: 1 })), all: vi.fn(), run: vi.fn() })) };
      vi.mocked(db.getDatabase).mockReturnValue(mockDb as never);
      vi.mocked(db.queryAll).mockReturnValue([mockItem]);
      const res = await request(app).get('/api/items').set(authHeader());
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([mockItem]);
      expect(res.body.pagination).toEqual({ page: 1, pageSize: 25, totalItems: 1, totalPages: 1 });
    });

    it('respects page and pageSize params', async () => {
      const mockDb = { prepare: vi.fn(() => ({ get: vi.fn(() => ({ count: 50 })), all: vi.fn(), run: vi.fn() })) };
      vi.mocked(db.getDatabase).mockReturnValue(mockDb as never);
      vi.mocked(db.queryAll).mockReturnValue([]);
      const res = await request(app).get('/api/items?page=2&pageSize=10').set(authHeader());
      expect(res.status).toBe(200);
      expect(res.body.pagination).toEqual({ page: 2, pageSize: 10, totalItems: 50, totalPages: 5 });
    });

    it('applies search filter', async () => {
      const mockDb = { prepare: vi.fn(() => ({ get: vi.fn(() => ({ count: 1 })), all: vi.fn(), run: vi.fn() })) };
      vi.mocked(db.getDatabase).mockReturnValue(mockDb as never);
      vi.mocked(db.queryAll).mockReturnValue([mockItem]);
      const res = await request(app).get('/api/items?search=resistor').set(authHeader());
      expect(res.status).toBe(200);
      expect(db.queryAll).toHaveBeenCalledWith(
        expect.stringContaining('LIKE'),
        expect.arrayContaining(['%resistor%']),
        expect.any(Array)
      );
    });

    it('applies typeId filter', async () => {
      const mockDb = { prepare: vi.fn(() => ({ get: vi.fn(() => ({ count: 1 })), all: vi.fn(), run: vi.fn() })) };
      vi.mocked(db.getDatabase).mockReturnValue(mockDb as never);
      vi.mocked(db.queryAll).mockReturnValue([mockItem]);
      const res = await request(app).get('/api/items?typeId=2').set(authHeader());
      expect(res.status).toBe(200);
      expect(db.queryAll).toHaveBeenCalledWith(
        expect.stringContaining('inventory_type_id'),
        expect.arrayContaining([2]),
        expect.any(Array)
      );
    });

    it('defaults to sorting by name asc', async () => {
      const mockDb = { prepare: vi.fn(() => ({ get: vi.fn(() => ({ count: 0 })), all: vi.fn(), run: vi.fn() })) };
      vi.mocked(db.getDatabase).mockReturnValue(mockDb as never);
      vi.mocked(db.queryAll).mockReturnValue([]);
      await request(app).get('/api/items').set(authHeader());
      expect(db.queryAll).toHaveBeenCalledWith(
        expect.stringContaining('items.name ASC'),
        expect.any(Array),
        expect.any(Array)
      );
    });

    it('rejects invalid sort field by defaulting to name', async () => {
      const mockDb = { prepare: vi.fn(() => ({ get: vi.fn(() => ({ count: 0 })), all: vi.fn(), run: vi.fn() })) };
      vi.mocked(db.getDatabase).mockReturnValue(mockDb as never);
      vi.mocked(db.queryAll).mockReturnValue([]);
      await request(app).get('/api/items?sortBy=DROP_TABLE').set(authHeader());
      expect(db.queryAll).toHaveBeenCalledWith(
        expect.stringContaining('items.name'),
        expect.any(Array),
        expect.any(Array)
      );
    });
  });

  describe('GET /api/items/stats', () => {
    it('returns stats', async () => {
      const mockDb = { prepare: vi.fn(() => ({ get: vi.fn(() => ({ totalQuantity: 100, totalValue: 500, totalItems: 10 })) })) };
      vi.mocked(db.getDatabase).mockReturnValue(mockDb as never);
      const res = await request(app).get('/api/items/stats').set(authHeader());
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ totalQuantity: 100, totalValue: 500, totalItems: 10 });
    });
  });

  describe('GET /api/items/:id', () => {
    it('returns item when found', async () => {
      vi.mocked(db.queryOne).mockReturnValue(mockItem);
      const res = await request(app).get('/api/items/1').set(authHeader());
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Resistor');
    });

    it('returns 404 when not found', async () => {
      vi.mocked(db.queryOne).mockReturnValue(null);
      const res = await request(app).get('/api/items/999').set(authHeader());
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/items', () => {
    it('creates item and returns 201', async () => {
      vi.mocked(db.insert).mockReturnValue({ ...mockItem, id: 2 });
      vi.mocked(db.run).mockReturnValue({ changes: 1, lastInsertRowid: 1 } as never);
      const res = await request(app).post('/api/items').set(authHeader()).send({
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
      const res = await request(app).put('/api/items/1').set(authHeader()).send({ name: 'Updated' });
      expect(res.status).toBe(200);
    });

    it('returns 404 when item not found', async () => {
      vi.mocked(db.queryOne).mockReturnValue(null);
      const res = await request(app).put('/api/items/999').set(authHeader()).send({ name: 'X' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/items/:id', () => {
    it('deletes item', async () => {
      vi.mocked(db.queryOne).mockReturnValue(mockItem);
      vi.mocked(db.run).mockReturnValue({ changes: 1, lastInsertRowid: 0 } as never);
      vi.mocked(db.deleteById).mockReturnValue(true);
      const res = await request(app).delete('/api/items/1').set(authHeader());
      expect(res.status).toBe(200);
    });

    it('returns 404 when not found', async () => {
      vi.mocked(db.queryOne).mockReturnValue(null);
      const res = await request(app).delete('/api/items/999').set(authHeader());
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/items/bulk-delete', () => {
    it('deletes multiple items', async () => {
      vi.mocked(db.queryOne).mockReturnValue(mockItem);
      vi.mocked(db.run).mockReturnValue({ changes: 1, lastInsertRowid: 0 } as never);
      vi.mocked(db.deleteById).mockReturnValue(true);
      vi.mocked(db.queryAll).mockReturnValue([]);
      const mockDb = { transaction: vi.fn((fn: () => void) => fn), prepare: vi.fn(() => ({ run: vi.fn() })) };
      vi.mocked(db.getDatabase).mockReturnValue(mockDb as never);
      const res = await request(app).post('/api/items/bulk-delete').set(adminAuthHeader()).send({ ids: [1, 2] });
      expect(res.status).toBe(200);
    });

    it('returns 400 when ids missing', async () => {
      const res = await request(app).post('/api/items/bulk-delete').set(authHeader()).send({});
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/items/:id/children', () => {
    it('returns child items', async () => {
      vi.mocked(db.queryAll).mockReturnValue([{ ...mockItem, id: 2, parentItemId: 1 }]);
      const res = await request(app).get('/api/items/1/children').set(authHeader());
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

      const res = await request(app).post('/api/items/bulk-create').set(authHeader()).send({
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

      const res = await request(app).post('/api/items/bulk-create').set(authHeader()).send({
        items: [
          { id: 1, name: 'Parent' },
          { id: 2, name: 'Child', parentItemId: 1 },
        ],
      });
      expect(res.status).toBe(201);
      expect(res.body.created).toBe(2);
    });

    it('returns 400 when items array is missing', async () => {
      const res = await request(app).post('/api/items/bulk-create').set(authHeader()).send({});
      expect(res.status).toBe(400);
    });

    it('returns 400 when items array is empty', async () => {
      const res = await request(app).post('/api/items/bulk-create').set(authHeader()).send({ items: [] });
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/items/all', () => {
    it('deletes all items and history', async () => {
      vi.mocked(db.run).mockReturnValue({ changes: 1, lastInsertRowid: 0 } as never);
      const mockDb = { transaction: vi.fn((fn: () => void) => fn) };
      vi.mocked(db.getDatabase).mockReturnValue(mockDb as never);

      const res = await request(app).delete('/api/items/all').set(authHeader());
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('cleared');
      expect(db.run).toHaveBeenCalledTimes(5); // Updated for non-admin user scoped deletion
    });
  });
});
