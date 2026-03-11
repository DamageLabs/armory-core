import { Router, Request, Response } from 'express';
import { queryAll, queryOne, run, getDatabase } from '../db/index';
import { logAudit } from '../services/auditService';

const router = Router();
const JSON_FIELDS = ['filterConfig'];

// GET / — Get all saved filters for the current user
router.get('/', (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const filters = queryAll(
      'SELECT * FROM saved_filters WHERE user_id = ? ORDER BY name',
      [userId],
      JSON_FIELDS,
    );
    res.json(filters);
  } catch (error) {
    console.error('Error fetching saved filters:', error);
    res.status(500).json({ error: 'Failed to fetch saved filters' });
  }
});

// POST / — Create a saved filter
router.post('/', (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { name, filterConfig } = req.body;
    if (!name || !filterConfig) {
      res.status(400).json({ error: 'Name and filterConfig are required' });
      return;
    }

    const now = new Date().toISOString();
    const db = getDatabase();
    const configJson = JSON.stringify(filterConfig);
    const result = db.prepare(
      'INSERT INTO saved_filters (user_id, name, filter_config, created_at) VALUES (?, ?, ?, ?)',
    ).run(userId, name, configJson, now);

    const created = queryOne(
      'SELECT * FROM saved_filters WHERE id = ?',
      [result.lastInsertRowid],
      JSON_FIELDS,
    );

    logAudit({
      userId,
      userEmail: req.user?.email,
      action: 'saved_filter.created',
      resourceType: 'saved_filter',
      resourceId: result.lastInsertRowid as number,
      details: { name },
    });

    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating saved filter:', error);
    res.status(500).json({ error: 'Failed to create saved filter' });
  }
});

// PUT /:id — Update a saved filter
router.put('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const userId = req.user?.userId;
    const existing = queryOne(
      'SELECT * FROM saved_filters WHERE id = ? AND user_id = ?',
      [id, userId],
      JSON_FIELDS,
    );
    if (!existing) {
      res.status(404).json({ error: 'Saved filter not found' });
      return;
    }

    const { name, filterConfig } = req.body;
    const configJson = JSON.stringify(filterConfig);
    run(
      'UPDATE saved_filters SET name = ?, filter_config = ? WHERE id = ? AND user_id = ?',
      [name, configJson, id, userId],
    );

    const updated = queryOne(
      'SELECT * FROM saved_filters WHERE id = ?',
      [id],
      JSON_FIELDS,
    );

    logAudit({
      userId,
      userEmail: req.user?.email,
      action: 'saved_filter.updated',
      resourceType: 'saved_filter',
      resourceId: id,
      details: { name },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating saved filter:', error);
    res.status(500).json({ error: 'Failed to update saved filter' });
  }
});

// DELETE /:id — Delete a saved filter
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const userId = req.user?.userId;
    const existing = queryOne<Record<string, unknown>>(
      'SELECT * FROM saved_filters WHERE id = ? AND user_id = ?',
      [id, userId],
      JSON_FIELDS,
    );
    if (!existing) {
      res.status(404).json({ error: 'Saved filter not found' });
      return;
    }

    run('DELETE FROM saved_filters WHERE id = ? AND user_id = ?', [id, userId]);

    logAudit({
      userId,
      userEmail: req.user?.email,
      action: 'saved_filter.deleted',
      resourceType: 'saved_filter',
      resourceId: id,
      details: { name: existing.name },
    });

    res.json({ message: 'Saved filter deleted' });
  } catch (error) {
    console.error('Error deleting saved filter:', error);
    res.status(500).json({ error: 'Failed to delete saved filter' });
  }
});

export default router;
