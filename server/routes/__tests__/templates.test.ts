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

import templateRoutes from '../templates';
import * as db from '../../db/index';

const app = createApp(templateRoutes, '/api/templates');

const mockTemplate = {
  id: 1, name: 'Arduino Template', category: 'Arduino',
  defaultFields: { vendorName: 'Adafruit' },
  createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
};

describe('templates routes', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('GET /', () => {
    it('returns all templates', async () => {
      vi.mocked(db.queryAll).mockReturnValue([mockTemplate]);
      const res = await request(app).get('/api/templates');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([mockTemplate]);
    });
  });

  describe('GET /:id', () => {
    it('returns template when found', async () => {
      vi.mocked(db.queryOne).mockReturnValue(mockTemplate);
      const res = await request(app).get('/api/templates/1');
      expect(res.status).toBe(200);
    });

    it('returns 404 when not found', async () => {
      vi.mocked(db.queryOne).mockReturnValue(null);
      const res = await request(app).get('/api/templates/999');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /', () => {
    it('creates template', async () => {
      vi.mocked(db.insert).mockReturnValue({ ...mockTemplate, id: 2 });
      const res = await request(app).post('/api/templates').send({ name: 'New', category: 'Sensors', defaultFields: {} });
      expect(res.status).toBe(201);
    });
  });

  describe('PUT /:id', () => {
    it('updates template', async () => {
      vi.mocked(db.update).mockReturnValue({ ...mockTemplate, name: 'Updated' });
      const res = await request(app).put('/api/templates/1').send({ name: 'Updated' });
      expect(res.status).toBe(200);
    });

    it('returns 404 when not found', async () => {
      vi.mocked(db.update).mockReturnValue(null);
      const res = await request(app).put('/api/templates/999').send({ name: 'X' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /:id', () => {
    it('deletes template', async () => {
      vi.mocked(db.deleteById).mockReturnValue(true);
      const res = await request(app).delete('/api/templates/1');
      expect(res.status).toBe(200);
    });

    it('returns 404 when not found', async () => {
      vi.mocked(db.deleteById).mockReturnValue(false);
      const res = await request(app).delete('/api/templates/999');
      expect(res.status).toBe(404);
    });
  });
});
