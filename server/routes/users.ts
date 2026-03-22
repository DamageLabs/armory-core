import { Router, Request, Response } from 'express';
import { queryAll, queryOne, update, deleteById } from '../db/index';
import { validate } from '../middleware/validate';
import { updateRoleSchema } from '../schemas/users';
import { logAudit } from '../services/auditService';

const router = Router();

interface UserRow {
  id: number;
  email: string;
  password: string;
  role: string;
  signInCount: number;
  lastSignInAt: string | null;
  lastSignInIp: string | null;
  createdAt: string;
  updatedAt: string;
}

function stripPassword(user: UserRow): Omit<UserRow, 'password'> {
  const { password, ...rest } = user;
  return rest;
}

// GET / — list all users (without passwords)
router.get('/', (_req: Request, res: Response) => {
  try {
    const users = queryAll<UserRow>('SELECT * FROM users');
    res.json(users.map(stripPassword));
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /:id — get one user (without password)
router.get('/:id', (req: Request, res: Response) => {
  try {
    const user = queryOne<UserRow>('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(stripPassword(user));
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// PUT /:id/role — update user role
router.put('/:id/role', validate(updateRoleSchema), (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { role } = req.body;

    const user = update<UserRow>('users', id, { role, updatedAt: new Date().toISOString() });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    logAudit({ userId: req.user?.userId, userEmail: req.user?.email, action: 'user.role_changed', resourceType: 'user', resourceId: id, details: { role, targetEmail: user.email } });
    res.json(stripPassword(user));
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// DELETE /:id — delete user
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const deleted = deleteById('users', id);
    if (!deleted) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    logAudit({ userId: req.user?.userId, userEmail: req.user?.email, action: 'user.deleted', resourceType: 'user', resourceId: id });
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// PUT /:id/password — admin reset user password
router.put('/:id/password', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { password } = req.body;

    if (!password || password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters' });
      return;
    }

    const { hashPassword } = await import('../utils/password');
    const hashedPassword = await hashPassword(password);

    const user = update<UserRow>('users', id, { password: hashedPassword, updatedAt: new Date().toISOString() });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    logAudit({ userId: req.user?.userId, userEmail: req.user?.email, action: 'user.password_reset', resourceType: 'user', resourceId: id, details: { targetEmail: user.email } });
    res.json({ message: 'Password updated' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

export default router;
