// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from './setup';

const { mockUserQueries, mockRateLimitQueries, mockHashPassword, mockVerifyPassword } = vi.hoisted(() => ({
  mockUserQueries: {
    findByEmail: vi.fn(),
    findByVerificationToken: vi.fn(),
    create: vi.fn(),
    markEmailVerified: vi.fn(),
    setVerificationToken: vi.fn(),
  },
  mockRateLimitQueries: {
    canSendEmail: vi.fn(),
    recordEmailSent: vi.fn(),
  },
  mockHashPassword: vi.fn<(plain: string) => Promise<string>>().mockResolvedValue('$2b$12$hashedvalue'),
  mockVerifyPassword: vi.fn<(plain: string, hash: string) => Promise<boolean>>().mockResolvedValue(true),
}));

vi.mock('../../db', () => ({
  userQueries: mockUserQueries,
  rateLimitQueries: mockRateLimitQueries,
  getDatabase: vi.fn(() => ({
    prepare: vi.fn(() => ({ run: vi.fn(), get: vi.fn(() => ({})) })),
  })),
}));

vi.mock('../../services/emailService', () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../utils/password', () => ({
  hashPassword: mockHashPassword,
  verifyPassword: mockVerifyPassword,
}));

import authRoutes from '../auth';

const app = createApp(authRoutes, '/api/auth');

const mockUser = {
  id: 1, email: 'test@example.com', password: '$2b$12$hashedvalue',
  role: 'user', signInCount: 0, lastSignInAt: null, lastSignInIp: null,
  emailVerified: true, emailVerificationToken: null,
  emailVerificationTokenExpiresAt: null,
  createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
};

describe('auth routes', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('POST /login', () => {
    it('returns user on valid credentials', async () => {
      mockUserQueries.findByEmail.mockReturnValue(mockUser);
      mockVerifyPassword.mockResolvedValue(true);
      const res = await request(app).post('/api/auth/login').send({ email: 'test@example.com', password: 'changeme' });
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('test@example.com');
      expect(mockVerifyPassword).toHaveBeenCalledWith('changeme', '$2b$12$hashedvalue');
    });

    it('returns 401 on invalid password', async () => {
      mockUserQueries.findByEmail.mockReturnValue(mockUser);
      mockVerifyPassword.mockResolvedValue(false);
      const res = await request(app).post('/api/auth/login').send({ email: 'test@example.com', password: 'wrong' });
      expect(res.status).toBe(401);
    });

    it('returns 401 when user not found', async () => {
      mockUserQueries.findByEmail.mockReturnValue(null);
      const res = await request(app).post('/api/auth/login').send({ email: 'no@example.com', password: 'pass' });
      expect(res.status).toBe(401);
    });

    it('returns 403 when email not verified', async () => {
      mockUserQueries.findByEmail.mockReturnValue({ ...mockUser, emailVerified: false });
      mockVerifyPassword.mockResolvedValue(true);
      const res = await request(app).post('/api/auth/login').send({ email: 'test@example.com', password: 'changeme' });
      expect(res.status).toBe(403);
    });

    it('returns 400 when fields missing', async () => {
      const res = await request(app).post('/api/auth/login').send({});
      expect(res.status).toBe(400);
    });

    it('does not return password in response', async () => {
      mockUserQueries.findByEmail.mockReturnValue(mockUser);
      mockVerifyPassword.mockResolvedValue(true);
      const res = await request(app).post('/api/auth/login').send({ email: 'test@example.com', password: 'changeme' });
      expect(res.body.user).not.toHaveProperty('password');
    });
  });

  describe('POST /register', () => {
    it('creates user with hashed password and returns 201', async () => {
      mockUserQueries.findByEmail.mockReturnValue(null);
      mockUserQueries.create.mockReturnValue({ ...mockUser, id: 2 });
      const res = await request(app).post('/api/auth/register').send({
        email: 'new@example.com', password: 'password123', passwordConfirmation: 'password123',
      });
      expect(res.status).toBe(201);
      expect(res.body.message).toContain('Registration successful');
      expect(mockHashPassword).toHaveBeenCalledWith('password123');
      expect(mockUserQueries.create).toHaveBeenCalledWith(
        expect.objectContaining({ password: '$2b$12$hashedvalue' }),
      );
    });

    it('returns 400 for duplicate email', async () => {
      mockUserQueries.findByEmail.mockReturnValue(mockUser);
      const res = await request(app).post('/api/auth/register').send({
        email: 'test@example.com', password: 'password123', passwordConfirmation: 'password123',
      });
      expect(res.status).toBe(400);
    });

    it('returns 400 for password mismatch', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'new@test.com', password: 'password123', passwordConfirmation: 'different',
      });
      expect(res.status).toBe(400);
    });

    it('returns 400 for short password', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'new@test.com', password: 'short', passwordConfirmation: 'short',
      });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /verify-email', () => {
    it('verifies email with valid token', async () => {
      mockUserQueries.findByVerificationToken.mockReturnValue({
        ...mockUser,
        emailVerified: false,
        emailVerificationToken: 'valid-token',
        emailVerificationTokenExpiresAt: new Date(Date.now() + 86400000).toISOString(),
      });
      mockUserQueries.markEmailVerified.mockReturnValue({ ...mockUser, emailVerified: true });
      const res = await request(app).post('/api/auth/verify-email').send({ token: 'valid-token' });
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('verified');
    });

    it('does not return password in verify-email response', async () => {
      mockUserQueries.findByVerificationToken.mockReturnValue({
        ...mockUser,
        emailVerified: false,
        emailVerificationToken: 'valid-token',
        emailVerificationTokenExpiresAt: new Date(Date.now() + 86400000).toISOString(),
      });
      mockUserQueries.markEmailVerified.mockReturnValue({ ...mockUser, emailVerified: true });
      const res = await request(app).post('/api/auth/verify-email').send({ token: 'valid-token' });
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('returns 400 for invalid token', async () => {
      mockUserQueries.findByVerificationToken.mockReturnValue(null);
      const res = await request(app).post('/api/auth/verify-email').send({ token: 'bad-token' });
      expect(res.status).toBe(400);
    });

    it('returns 400 for missing token', async () => {
      const res = await request(app).post('/api/auth/verify-email').send({});
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /profile/:id', () => {
    it('verifies current password with bcrypt', async () => {
      const mockDb = {
        prepare: vi.fn(() => ({
          run: vi.fn(),
          get: vi.fn(() => ({ id: 1, email: 'test@example.com', password: '$2b$12$hashedvalue', role: 'user', sign_in_count: 0, last_sign_in_at: null, last_sign_in_ip: null, email_verified: 1, created_at: '2026-01-01', updated_at: '2026-01-01' })),
        })),
      };
      const { getDatabase } = await import('../../db');
      vi.mocked(getDatabase).mockReturnValue(mockDb as never);
      mockVerifyPassword.mockResolvedValue(true);
      const res = await request(app).put('/api/auth/profile/1').send({ currentPassword: 'changeme', password: 'newpassword' });
      expect(res.status).toBe(200);
      expect(mockVerifyPassword).toHaveBeenCalledWith('changeme', '$2b$12$hashedvalue');
      expect(mockHashPassword).toHaveBeenCalledWith('newpassword');
    });

    it('returns 400 for incorrect current password', async () => {
      const mockDb = {
        prepare: vi.fn(() => ({
          run: vi.fn(),
          get: vi.fn(() => ({ id: 1, email: 'test@example.com', password: '$2b$12$hashedvalue', role: 'user', sign_in_count: 0 })),
        })),
      };
      const { getDatabase } = await import('../../db');
      vi.mocked(getDatabase).mockReturnValue(mockDb as never);
      mockVerifyPassword.mockResolvedValue(false);
      const res = await request(app).put('/api/auth/profile/1').send({ currentPassword: 'wrong' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /sync', () => {
    it('validates password with bcrypt', async () => {
      mockUserQueries.findByEmail.mockReturnValue(mockUser);
      mockVerifyPassword.mockResolvedValue(true);
      const res = await request(app).post('/api/auth/sync').send({ email: 'test@example.com', password: 'changeme' });
      expect(res.status).toBe(200);
      expect(mockVerifyPassword).toHaveBeenCalledWith('changeme', '$2b$12$hashedvalue');
    });

    it('does not return password in sync response', async () => {
      mockUserQueries.findByEmail.mockReturnValue(mockUser);
      mockVerifyPassword.mockResolvedValue(true);
      const res = await request(app).post('/api/auth/sync').send({ email: 'test@example.com', password: 'changeme' });
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('returns 401 for invalid credentials', async () => {
      mockUserQueries.findByEmail.mockReturnValue(mockUser);
      mockVerifyPassword.mockResolvedValue(false);
      const res = await request(app).post('/api/auth/sync').send({ email: 'test@example.com', password: 'wrong' });
      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /profile/:id', () => {
    it('deletes account', async () => {
      const mockDb = { prepare: vi.fn(() => ({ run: vi.fn(() => ({ changes: 1 })) })) };
      const { getDatabase } = await import('../../db');
      vi.mocked(getDatabase).mockReturnValue(mockDb as never);
      const res = await request(app).delete('/api/auth/profile/1');
      expect(res.status).toBe(200);
    });

    it('returns 404 when not found', async () => {
      const mockDb = { prepare: vi.fn(() => ({ run: vi.fn(() => ({ changes: 0 })) })) };
      const { getDatabase } = await import('../../db');
      vi.mocked(getDatabase).mockReturnValue(mockDb as never);
      const res = await request(app).delete('/api/auth/profile/999');
      expect(res.status).toBe(404);
    });
  });
});
