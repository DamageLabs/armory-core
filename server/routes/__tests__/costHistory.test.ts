// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from './setup';

vi.mock('../../db/index', () => ({
  queryAll: vi.fn(),
  run: vi.fn(),
}));

import costHistoryRoutes from '../costHistory';
import * as db from '../../db/index';

const app = createApp(costHistoryRoutes, '/api/cost-history');

describe('costHistory routes', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('GET /item/:id', () => {
    it('returns cost history for item', async () => {
      vi.mocked(db.queryAll).mockReturnValue([{ id: 1, itemId: 10, unitValue: 24.95 }]);
      const res = await request(app).get('/api/cost-history/item/10');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });
  });

  describe('GET /item/:id/stats', () => {
    it('returns stats with trend', async () => {
      vi.mocked(db.queryAll).mockReturnValue([
        { id: 1, itemId: 10, unitValue: 20, timestamp: '2026-01-01T00:00:00Z' },
        { id: 2, itemId: 10, unitValue: 30, timestamp: '2026-02-01T00:00:00Z' },
      ]);
      const res = await request(app).get('/api/cost-history/item/10/stats?currentValue=35');
      expect(res.status).toBe(200);
      expect(res.body.stats.trend).toBe('up');
      expect(res.body.stats.min).toBe(20);
      expect(res.body.stats.max).toBe(35);
    });

    it('returns stable trend with no history', async () => {
      vi.mocked(db.queryAll).mockReturnValue([]);
      const res = await request(app).get('/api/cost-history/item/10/stats');
      expect(res.status).toBe(200);
      expect(res.body.stats.trend).toBe('stable');
    });
  });

  describe('DELETE /item/:id', () => {
    it('returns deleted count', async () => {
      vi.mocked(db.run).mockReturnValue({ changes: 3, lastInsertRowid: 0 } as never);
      const res = await request(app).delete('/api/cost-history/item/10');
      expect(res.status).toBe(200);
      expect(res.body.deleted).toBe(3);
    });
  });
});
