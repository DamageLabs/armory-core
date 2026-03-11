import { Router, Request, Response } from 'express';
import { queryAll, queryOne, getDatabase, mapRowToEntity } from '../db/index';
import { buildPaginationMeta } from '../db/pagination';
import { logAudit } from '../services/auditService';

const router = Router();

// GET /:itemId/notes — paginated notes for an item
router.get('/:itemId/notes', (req: Request, res: Response) => {
  try {
    const itemId = parseInt(req.params.itemId, 10);
    const item = queryOne('SELECT id FROM items WHERE id = ?', [itemId]);
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string, 10) || 20));

    const db = getDatabase();
    const countRow = db.prepare('SELECT COUNT(*) as count FROM item_notes WHERE item_id = ?').get(itemId) as { count: number };
    const offset = (page - 1) * pageSize;

    const data = queryAll(
      'SELECT * FROM item_notes WHERE item_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [itemId, pageSize, offset],
    );

    res.json({
      data,
      pagination: buildPaginationMeta(countRow.count, page, pageSize),
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// GET /count/:itemId — note count for an item
router.get('/count/:itemId', (req: Request, res: Response) => {
  try {
    const itemId = parseInt(req.params.itemId, 10);
    const db = getDatabase();
    const row = db.prepare('SELECT COUNT(*) as count FROM item_notes WHERE item_id = ?').get(itemId) as { count: number };
    res.json({ count: row.count });
  } catch (error) {
    console.error('Error fetching note count:', error);
    res.status(500).json({ error: 'Failed to fetch note count' });
  }
});

// POST /:itemId/notes — create a note
router.post('/:itemId/notes', (req: Request, res: Response) => {
  try {
    const itemId = parseInt(req.params.itemId, 10);
    const item = queryOne('SELECT id FROM items WHERE id = ?', [itemId]);
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    const { content } = req.body;
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      res.status(400).json({ error: 'Content is required' });
      return;
    }

    const now = new Date().toISOString();
    const db = getDatabase();
    const result = db.prepare(
      'INSERT INTO item_notes (item_id, user_id, user_email, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(itemId, req.user?.userId, req.user?.email, content.trim(), now, now);

    const row = db.prepare('SELECT * FROM item_notes WHERE id = ?').get(result.lastInsertRowid) as Record<string, unknown>;
    logAudit({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      action: 'note.created',
      resourceType: 'note',
      resourceId: result.lastInsertRowid as number,
      details: { itemId },
    });

    res.status(201).json(mapRowToEntity(row));
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// DELETE /:noteId — delete a note (author or admin only)
router.delete('/:noteId', (req: Request, res: Response) => {
  try {
    const noteId = parseInt(req.params.noteId, 10);
    const note = queryOne<{ userId: number; itemId: number }>(
      'SELECT * FROM item_notes WHERE id = ?',
      [noteId],
    );
    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    const isAuthor = req.user?.userId === note.userId;
    const isAdmin = req.user?.role === 'admin';
    if (!isAuthor && !isAdmin) {
      res.status(403).json({ error: 'Not authorized to delete this note' });
      return;
    }

    const db = getDatabase();
    db.prepare('DELETE FROM item_notes WHERE id = ?').run(noteId);

    logAudit({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      action: 'note.deleted',
      resourceType: 'note',
      resourceId: noteId,
      details: { itemId: note.itemId },
    });

    res.json({ message: 'Note deleted' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

export default router;
