// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { requireAuth, requireAdmin, signToken, JwtPayload } from '../auth';

const JWT_SECRET = 'rims-dev-secret-change-in-production';

function mockReq(authHeader?: string): Partial<Request> {
  return { headers: authHeader ? { authorization: authHeader } : {} };
}

function mockRes(): Partial<Response> & { statusCode: number; body: unknown } {
  const res = { statusCode: 0, body: null as unknown } as Partial<Response> & { statusCode: number; body: unknown };
  res.status = vi.fn((code: number) => { res.statusCode = code; return res as Response; });
  res.json = vi.fn((data: unknown) => { res.body = data; return res as Response; });
  return res;
}

describe('signToken', () => {
  it('returns a valid JWT with correct payload', () => {
    const payload: JwtPayload = { userId: 1, email: 'a@b.com', role: 'user' };
    const token = signToken(payload);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    expect(decoded.userId).toBe(1);
    expect(decoded.email).toBe('a@b.com');
    expect(decoded.role).toBe('user');
  });
});

describe('requireAuth', () => {
  let next: NextFunction;

  beforeEach(() => { next = vi.fn(); });

  it('returns 401 when no Authorization header', () => {
    const req = mockReq();
    const res = mockRes();
    requireAuth(req as Request, res as Response, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when header is not Bearer', () => {
    const req = mockReq('Basic abc123');
    const res = mockRes();
    requireAuth(req as Request, res as Response, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for invalid token', () => {
    const req = mockReq('Bearer invalid.token.here');
    const res = mockRes();
    requireAuth(req as Request, res as Response, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for expired token', () => {
    const token = jwt.sign({ userId: 1, email: 'a@b.com', role: 'user' }, JWT_SECRET, { expiresIn: '0s' });
    const req = mockReq(`Bearer ${token}`);
    const res = mockRes();
    requireAuth(req as Request, res as Response, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next and sets req.user for valid token', () => {
    const token = signToken({ userId: 1, email: 'a@b.com', role: 'user' });
    const req = mockReq(`Bearer ${token}`);
    const res = mockRes();
    requireAuth(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
    expect((req as Request).user).toEqual(expect.objectContaining({ userId: 1, email: 'a@b.com', role: 'user' }));
  });
});

describe('requireAdmin', () => {
  let next: NextFunction;

  beforeEach(() => { next = vi.fn(); });

  it('returns 401 when req.user is not set', () => {
    const req = {} as Request;
    const res = mockRes();
    requireAdmin(req, res as Response, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 for non-admin user', () => {
    const req = { user: { userId: 1, email: 'a@b.com', role: 'user' } } as Request;
    const res = mockRes();
    requireAdmin(req, res as Response, next);
    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next for admin user', () => {
    const req = { user: { userId: 1, email: 'a@b.com', role: 'admin' } } as Request;
    const res = mockRes();
    requireAdmin(req, res as Response, next);
    expect(next).toHaveBeenCalled();
  });
});
