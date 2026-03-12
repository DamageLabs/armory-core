import { Router, Request, Response } from 'express';
import { queryAll, queryOne, getDatabase, mapRowToEntity } from '../db/index';
import { buildPaginationMeta } from '../db/pagination';
import { logAudit } from '../services/auditService';

const router = Router();

const VALID_TYPES = ['Cleaning', 'Repair', 'Inspection', 'Modification', 'Service', 'Other'];

// GET /report — fleet-wide maintenance report
router.get('/report', (_req: Request, res: Response) => {
  try {
    const db = getDatabase();

    // Fleet totals
    const totals = db.prepare(`
      SELECT
        COALESCE(SUM(rounds_fired), 0) as totalRounds,
        COALESCE(SUM(cost), 0) as totalCost,
        COUNT(*) as totalEntries,
        COUNT(DISTINCT item_id) as firearmsServiced
      FROM maintenance_logs
    `).get() as { totalRounds: number; totalCost: number; totalEntries: number; firearmsServiced: number };

    // Per-firearm summaries
    const perFirearm = db.prepare(`
      SELECT
        m.item_id as itemId,
        i.name as itemName,
        COALESCE(SUM(m.rounds_fired), 0) as totalRounds,
        COALESCE(SUM(m.cost), 0) as totalCost,
        COUNT(*) as entryCount,
        MAX(m.performed_at) as lastServiceDate
      FROM maintenance_logs m
      JOIN items i ON i.id = m.item_id
      GROUP BY m.item_id
      ORDER BY MAX(m.performed_at) DESC
    `).all() as { itemId: number; itemName: string; totalRounds: number; totalCost: number; entryCount: number; lastServiceDate: string }[];

    // By service type (count + cost)
    const byType = db.prepare(`
      SELECT
        service_type as type,
        COUNT(*) as count,
        COALESCE(SUM(cost), 0) as totalCost
      FROM maintenance_logs
      GROUP BY service_type
      ORDER BY count DESC
    `).all() as { type: string; count: number; totalCost: number }[];

    // Monthly time series (last 12 months)
    const monthly = db.prepare(`
      SELECT
        strftime('%Y-%m', performed_at) as month,
        COALESCE(SUM(cost), 0) as totalCost,
        COALESCE(SUM(rounds_fired), 0) as totalRounds,
        COUNT(*) as entryCount
      FROM maintenance_logs
      WHERE performed_at >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', performed_at)
      ORDER BY month ASC
    `).all() as { month: string; totalCost: number; totalRounds: number; entryCount: number }[];

    // All logs for CSV export
    const allLogs = db.prepare(`
      SELECT
        m.id, i.name as item_name, m.service_type, m.description,
        m.rounds_fired, m.service_provider, m.cost, m.performed_at,
        m.user_email, m.created_at
      FROM maintenance_logs m
      JOIN items i ON i.id = m.item_id
      ORDER BY m.performed_at DESC
    `).all() as Record<string, unknown>[];

    res.json({ totals, perFirearm, byType, monthly, allLogs });
  } catch (error) {
    console.error('Error fetching maintenance report:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance report' });
  }
});

// GET /:itemId/logs — paginated maintenance logs for an item
router.get('/:itemId/logs', (req: Request, res: Response) => {
  try {
    const itemId = parseInt(req.params.itemId, 10);
    const item = queryOne('SELECT id FROM items WHERE id = ?', [itemId]);
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string, 10) || 20));
    const typeFilter = req.query.type as string | undefined;

    const db = getDatabase();
    const where = typeFilter && VALID_TYPES.includes(typeFilter)
      ? 'WHERE item_id = ? AND service_type = ?'
      : 'WHERE item_id = ?';
    const params = typeFilter && VALID_TYPES.includes(typeFilter)
      ? [itemId, typeFilter]
      : [itemId];

    const countRow = db.prepare(`SELECT COUNT(*) as count FROM maintenance_logs ${where}`).get(...params) as { count: number };
    const offset = (page - 1) * pageSize;

    const data = queryAll(
      `SELECT * FROM maintenance_logs ${where} ORDER BY performed_at DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset],
    );

    res.json({
      data,
      pagination: buildPaginationMeta(countRow.count, page, pageSize),
    });
  } catch (error) {
    console.error('Error fetching maintenance logs:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance logs' });
  }
});

// GET /:itemId/summary — maintenance summary for an item
router.get('/:itemId/summary', (req: Request, res: Response) => {
  try {
    const itemId = parseInt(req.params.itemId, 10);
    const db = getDatabase();

    const row = db.prepare(`
      SELECT
        COALESCE(SUM(rounds_fired), 0) as totalRounds,
        COALESCE(SUM(cost), 0) as totalCost,
        COUNT(*) as totalEntries,
        MAX(performed_at) as lastServiceDate
      FROM maintenance_logs WHERE item_id = ?
    `).get(itemId) as { totalRounds: number; totalCost: number; totalEntries: number; lastServiceDate: string | null };

    const typeCounts = db.prepare(
      'SELECT service_type as type, COUNT(*) as count FROM maintenance_logs WHERE item_id = ? GROUP BY service_type',
    ).all(itemId) as { type: string; count: number }[];

    res.json({ ...row, typeCounts });
  } catch (error) {
    console.error('Error fetching maintenance summary:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance summary' });
  }
});

// POST /:itemId/logs — create a maintenance log entry
router.post('/:itemId/logs', (req: Request, res: Response) => {
  try {
    const itemId = parseInt(req.params.itemId, 10);
    const item = queryOne('SELECT id FROM items WHERE id = ?', [itemId]);
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    const { serviceType, description, roundsFired, serviceProvider, cost, performedAt } = req.body;

    if (!serviceType || !VALID_TYPES.includes(serviceType)) {
      res.status(400).json({ error: `Service type must be one of: ${VALID_TYPES.join(', ')}` });
      return;
    }
    if (!performedAt) {
      res.status(400).json({ error: 'Service date is required' });
      return;
    }

    const now = new Date().toISOString();
    const db = getDatabase();
    const result = db.prepare(
      'INSERT INTO maintenance_logs (item_id, user_id, user_email, service_type, description, rounds_fired, service_provider, cost, performed_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ).run(
      itemId,
      req.user?.userId,
      req.user?.email,
      serviceType,
      (description || '').trim(),
      Number(roundsFired) || 0,
      (serviceProvider || '').trim(),
      Number(cost) || 0,
      performedAt,
      now,
      now,
    );

    const row = db.prepare('SELECT * FROM maintenance_logs WHERE id = ?').get(result.lastInsertRowid) as Record<string, unknown>;
    logAudit({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      action: 'maintenance.created',
      resourceType: 'maintenance_log',
      resourceId: result.lastInsertRowid as number,
      details: { itemId, serviceType },
    });

    res.status(201).json(mapRowToEntity(row));
  } catch (error) {
    console.error('Error creating maintenance log:', error);
    res.status(500).json({ error: 'Failed to create maintenance log' });
  }
});

// PUT /:logId — update a maintenance log entry (author or admin)
router.put('/:logId', (req: Request, res: Response) => {
  try {
    const logId = parseInt(req.params.logId, 10);
    const existing = queryOne<{ userId: number; itemId: number }>(
      'SELECT * FROM maintenance_logs WHERE id = ?',
      [logId],
    );
    if (!existing) {
      res.status(404).json({ error: 'Maintenance log not found' });
      return;
    }

    const isAuthor = req.user?.userId === existing.userId;
    const isAdmin = req.user?.role === 'admin';
    if (!isAuthor && !isAdmin) {
      res.status(403).json({ error: 'Not authorized to update this entry' });
      return;
    }

    const { serviceType, description, roundsFired, serviceProvider, cost, performedAt } = req.body;
    if (serviceType && !VALID_TYPES.includes(serviceType)) {
      res.status(400).json({ error: `Service type must be one of: ${VALID_TYPES.join(', ')}` });
      return;
    }

    const now = new Date().toISOString();
    const db = getDatabase();
    db.prepare(`
      UPDATE maintenance_logs SET
        service_type = COALESCE(?, service_type),
        description = COALESCE(?, description),
        rounds_fired = COALESCE(?, rounds_fired),
        service_provider = COALESCE(?, service_provider),
        cost = COALESCE(?, cost),
        performed_at = COALESCE(?, performed_at),
        updated_at = ?
      WHERE id = ?
    `).run(
      serviceType || null,
      description !== undefined ? (description || '').trim() : null,
      roundsFired !== undefined ? (Number(roundsFired) || 0) : null,
      serviceProvider !== undefined ? (serviceProvider || '').trim() : null,
      cost !== undefined ? (Number(cost) || 0) : null,
      performedAt || null,
      now,
      logId,
    );

    const row = db.prepare('SELECT * FROM maintenance_logs WHERE id = ?').get(logId) as Record<string, unknown>;
    logAudit({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      action: 'maintenance.updated',
      resourceType: 'maintenance_log',
      resourceId: logId,
      details: { itemId: existing.itemId },
    });

    res.json(mapRowToEntity(row));
  } catch (error) {
    console.error('Error updating maintenance log:', error);
    res.status(500).json({ error: 'Failed to update maintenance log' });
  }
});

// DELETE /:logId — delete a maintenance log entry (author or admin)
router.delete('/:logId', (req: Request, res: Response) => {
  try {
    const logId = parseInt(req.params.logId, 10);
    const entry = queryOne<{ userId: number; itemId: number }>(
      'SELECT * FROM maintenance_logs WHERE id = ?',
      [logId],
    );
    if (!entry) {
      res.status(404).json({ error: 'Maintenance log not found' });
      return;
    }

    const isAuthor = req.user?.userId === entry.userId;
    const isAdmin = req.user?.role === 'admin';
    if (!isAuthor && !isAdmin) {
      res.status(403).json({ error: 'Not authorized to delete this entry' });
      return;
    }

    const db = getDatabase();
    db.prepare('DELETE FROM maintenance_logs WHERE id = ?').run(logId);

    logAudit({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      action: 'maintenance.deleted',
      resourceType: 'maintenance_log',
      resourceId: logId,
      details: { itemId: entry.itemId },
    });

    res.json({ message: 'Maintenance log deleted' });
  } catch (error) {
    console.error('Error deleting maintenance log:', error);
    res.status(500).json({ error: 'Failed to delete maintenance log' });
  }
});

export default router;
