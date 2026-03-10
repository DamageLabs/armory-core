// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from './setup';

vi.mock('../../db/index', () => ({
  queryAll: vi.fn(),
  run: vi.fn(),
}));

import stockHistoryRoutes from '../stockHistory';
import * as db from '../../db/index';

const app = createApp(stockHistoryRoutes, '/api/stock-history');

const mockEntry = {
  id: 1, itemId: 10, itemName: 'Resistor', changeType: 'created',
  previousQuantity: 0, newQuantity: 10, timestamp: '2026-01-01T00:00:00Z',
};

describe('stockHistory routes', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('GET /', () => {
    it('returns all history', async () => {
      vi.mocked(db.queryAll).mockReturnValue([mockEntry]);
      const res = await request(app).get('/api/stock-history');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([mockEntry]);
    });

    it('applies filters', async () => {
      vi.mocked(db.queryAll).mockReturnValue([]);
      const res = await request(app).get('/api/stock-history?itemId=10&changeType=created');
      expect(res.status).toBe(200);
      expect(db.queryAll).toHaveBeenCalledWith(
        expect.stringContaining('item_id = ?'),
        ['10', 'created']
      );
    });
  });

  describe('GET /recent', () => {
    it('returns recent entries with default limit', async () => {
      vi.mocked(db.queryAll).mockReturnValue([]);
      const res = await request(app).get('/api/stock-history/recent');
      expect(res.status).toBe(200);
      expect(db.queryAll).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT'),
        [10]
      );
    });

    it('uses custom limit', async () => {
      vi.mocked(db.queryAll).mockReturnValue([]);
      await request(app).get('/api/stock-history/recent?limit=5');
      expect(db.queryAll).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT'),
        [5]
      );
    });
  });

  describe('GET /item/:id', () => {
    it('returns history for item', async () => {
      vi.mocked(db.queryAll).mockReturnValue([mockEntry]);
      const res = await request(app).get('/api/stock-history/item/10');
      expect(res.status).toBe(200);
    });
  });

  describe('GET /stats', () => {
    it('returns stats with date filters', async () => {
      vi.mocked(db.queryAll).mockReturnValue([]);
      const res = await request(app).get('/api/stock-history/stats?startDate=2026-01-01&endDate=2026-12-31');
      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /', () => {
    it('clears all stock history', async () => {
      vi.mocked(db.run).mockReturnValue({ changes: 5, lastInsertRowid: 0 } as never);
      const res = await request(app).delete('/api/stock-history');
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Stock history cleared');
    });
  });
});
