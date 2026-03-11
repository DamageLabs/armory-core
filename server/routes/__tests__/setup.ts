import express from 'express';
import { signToken, requireAuth, requireAdmin, JwtPayload } from '../../middleware/auth';

export function createApp(router: express.Router, prefix = '/api') {
  const app = express();
  app.use(express.json());
  app.use(prefix, router);
  return app;
}

export function createProtectedApp(router: express.Router, prefix = '/api', adminOnly = false) {
  const app = express();
  app.use(express.json());
  if (adminOnly) {
    app.use(prefix, requireAuth, requireAdmin, router);
  } else {
    app.use(prefix, requireAuth, router);
  }
  return app;
}

export function authHeader(overrides?: Partial<JwtPayload>): { Authorization: string } {
  const payload: JwtPayload = {
    userId: 1,
    email: 'test@example.com',
    role: 'user',
    ...overrides,
  };
  return { Authorization: `Bearer ${signToken(payload)}` };
}

export function adminAuthHeader(overrides?: Partial<JwtPayload>): { Authorization: string } {
  return authHeader({ role: 'admin', ...overrides });
}
