// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from './setup';

vi.mock('../../db/index', () => ({
  queryAll: vi.fn(),
  queryOne: vi.fn(),
  update: vi.fn(),
  deleteById: vi.fn(),
}));

import userRoutes from '../users';
import * as db from '../../db/index';

const app = createApp(userRoutes, '/api/users');

const mockUser = {
  id: 1, email: 'test@example.com', password: 'secret', role: 'user',
  signInCount: 3, lastSignInAt: null, lastSignInIp: null,
  createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
};

describe('users routes', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('GET /', () => {
    it('returns users without passwords', async () => {
      vi.mocked(db.queryAll).mockReturnValue([mockUser]);
      const res = await request(app).get('/api/users');
      expect(res.status).toBe(200);
      expect(res.body[0]).not.toHaveProperty('password');
      expect(res.body[0].email).toBe('test@example.com');
    });
  });

  describe('GET /:id', () => {
    it('returns user without password', async () => {
      vi.mocked(db.queryOne).mockReturnValue(mockUser);
      const res = await request(app).get('/api/users/1');
      expect(res.status).toBe(200);
      expect(res.body).not.toHaveProperty('password');
    });

    it('returns 404 when not found', async () => {
      vi.mocked(db.queryOne).mockReturnValue(null);
      const res = await request(app).get('/api/users/999');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /:id/role', () => {
    it('updates user role', async () => {
      vi.mocked(db.update).mockReturnValue({ ...mockUser, role: 'admin' });
      const res = await request(app).put('/api/users/1/role').send({ role: 'admin' });
      expect(res.status).toBe(200);
      expect(res.body.role).toBe('admin');
      expect(res.body).not.toHaveProperty('password');
    });

    it('returns 400 when role missing', async () => {
      const res = await request(app).put('/api/users/1/role').send({});
      expect(res.status).toBe(400);
    });

    it('returns 404 when user not found', async () => {
      vi.mocked(db.update).mockReturnValue(null);
      const res = await request(app).put('/api/users/999/role').send({ role: 'admin' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /:id', () => {
    it('deletes user', async () => {
      vi.mocked(db.deleteById).mockReturnValue(true);
      const res = await request(app).delete('/api/users/1');
      expect(res.status).toBe(200);
    });

    it('returns 404 when not found', async () => {
      vi.mocked(db.deleteById).mockReturnValue(false);
      const res = await request(app).delete('/api/users/999');
      expect(res.status).toBe(404);
    });
  });
});
