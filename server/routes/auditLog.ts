import { Router, Request, Response } from 'express';
import { queryAll, getDatabase } from '../db/index';

const router = Router();
const JSON_FIELDS = ['details'];

// GET / — paginated audit log with filters
router.get('/', (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const pageSize = Math.min(200, Math.max(1, parseInt(req.query.pageSize as string, 10) || 50));
    const { action, resourceType, userId, startDate, endDate, search } = req.query;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (action) {
      conditions.push('action = ?');
      params.push(action);
    }
    if (resourceType) {
      conditions.push('resource_type = ?');
      params.push(resourceType);
    }
    if (userId) {
      conditions.push('user_id = ?');
      params.push(Number(userId));
    }
    if (startDate) {
      conditions.push('timestamp >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('timestamp <= ?');
      params.push(endDate);
    }
    if (search) {
      conditions.push('details LIKE ?');
      params.push(`%${search}%`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const db = getDatabase();
    const countRow = db.prepare(`SELECT COUNT(*) as count FROM audit_log ${where}`).get(...params) as { count: number };
    const totalItems = countRow.count;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const offset = (page - 1) * pageSize;

    const data = queryAll(
      `SELECT * FROM audit_log ${where} ORDER BY timestamp DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset],
      JSON_FIELDS
    );

    res.json({
      data,
      pagination: { page, pageSize, totalItems, totalPages },
    });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

// GET /actions — list distinct action types
router.get('/actions', (_req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const rows = db.prepare('SELECT DISTINCT action FROM audit_log ORDER BY action').all() as { action: string }[];
    res.json(rows.map((r) => r.action));
  } catch (error) {
    console.error('Error fetching audit actions:', error);
    res.status(500).json({ error: 'Failed to fetch audit actions' });
  }
});

// GET /users — list distinct users in audit log
router.get('/users', (_req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const rows = db.prepare(
      'SELECT DISTINCT user_id, user_email FROM audit_log WHERE user_id IS NOT NULL ORDER BY user_email'
    ).all() as { user_id: number; user_email: string }[];
    res.json(rows.map((r) => ({ userId: r.user_id, userEmail: r.user_email })));
  } catch (error) {
    console.error('Error fetching audit users:', error);
    res.status(500).json({ error: 'Failed to fetch audit users' });
  }
});

export default router;
