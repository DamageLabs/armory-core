import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { queryAll, queryOne, run, getDatabase, mapRowToEntity } from '../db/index';
import { logAudit } from '../services/auditService';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PHOTOS_DIR = process.env.PHOTOS_PATH || path.join(__dirname, '../../data/photos');

if (!fs.existsSync(PHOTOS_DIR)) {
  fs.mkdirSync(PHOTOS_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PHOTOS_DIR),
  filename: (_req, file, cb) => {
    const uuid = crypto.randomUUID();
    const ext = path.extname(file.originalname).toLowerCase();
    const sanitized = file.originalname
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .substring(0, 100);
    cb(null, `${uuid}-${sanitized}${ext ? '' : '.bin'}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if ((ALLOWED_MIME_TYPES as readonly string[]).includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Allowed: PNG, JPEG, WebP'));
    }
  },
});

const router = Router();

// GET /:itemId/photos — list photos for an item
router.get('/:itemId/photos', (req: Request, res: Response) => {
  try {
    const itemId = parseInt(req.params.itemId, 10);
    const item = queryOne('SELECT id FROM items WHERE id = ?', [itemId]);
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }
    const photos = queryAll(
      'SELECT * FROM item_photos WHERE item_id = ? ORDER BY sort_order ASC, created_at ASC',
      [itemId],
    );
    res.json(photos);
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
});

// GET /download/:photoId — serve a photo file
router.get('/download/:photoId', (req: Request, res: Response) => {
  try {
    const photoId = parseInt(req.params.photoId, 10);
    const photo = queryOne<{ filename: string; originalName: string; mimeType: string }>(
      'SELECT * FROM item_photos WHERE id = ?',
      [photoId],
    );
    if (!photo) {
      res.status(404).json({ error: 'Photo not found' });
      return;
    }
    const filePath = path.join(PHOTOS_DIR, photo.filename);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Photo file not found' });
      return;
    }
    res.setHeader('Content-Type', photo.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(photo.originalName)}"`);
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error downloading photo:', error);
    res.status(500).json({ error: 'Failed to download photo' });
  }
});

// POST /:itemId/photos — upload photo
router.post('/:itemId/photos', (req: Request, res: Response) => {
  const itemId = parseInt(req.params.itemId, 10);
  const item = queryOne('SELECT id FROM items WHERE id = ?', [itemId]);
  if (!item) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }

  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ error: 'File must be under 10MB' });
        return;
      }
      res.status(400).json({ error: err.message });
      return;
    }
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    try {
      const db = getDatabase();
      const now = new Date().toISOString();
      const caption = req.body?.caption || '';

      // Check if this is the first photo — make it primary
      const countRow = db.prepare('SELECT COUNT(*) as count FROM item_photos WHERE item_id = ?').get(itemId) as { count: number };
      const isPrimary = countRow.count === 0 ? 1 : 0;
      const sortOrder = countRow.count;

      const result = db.prepare(
        'INSERT INTO item_photos (item_id, filename, original_name, mime_type, size_bytes, is_primary, caption, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ).run(itemId, req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, isPrimary, caption, sortOrder, now);

      const row = db.prepare('SELECT * FROM item_photos WHERE id = ?').get(result.lastInsertRowid) as Record<string, unknown>;

      // If this is the new primary, update item.picture
      if (isPrimary) {
        syncPrimaryPicture(itemId);
      }

      logAudit({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        action: 'photo.uploaded',
        resourceType: 'photo',
        resourceId: result.lastInsertRowid as number,
        details: { itemId, originalName: req.file!.originalname },
      });

      res.status(201).json(mapRowToEntity(row));
    } catch (error) {
      fs.unlink(req.file.path, () => {});
      console.error('Error saving photo:', error);
      res.status(500).json({ error: 'Failed to save photo' });
    }
  });
});

// PATCH /:photoId/primary — set a photo as primary
router.put('/:photoId/primary', (req: Request, res: Response) => {
  try {
    const photoId = parseInt(req.params.photoId, 10);
    const photo = queryOne<{ itemId: number }>('SELECT * FROM item_photos WHERE id = ?', [photoId]);
    if (!photo) {
      res.status(404).json({ error: 'Photo not found' });
      return;
    }

    const db = getDatabase();
    db.prepare('UPDATE item_photos SET is_primary = 0 WHERE item_id = ?').run(photo.itemId);
    db.prepare('UPDATE item_photos SET is_primary = 1 WHERE id = ?').run(photoId);

    syncPrimaryPicture(photo.itemId);

    res.json({ message: 'Primary photo updated' });
  } catch (error) {
    console.error('Error setting primary photo:', error);
    res.status(500).json({ error: 'Failed to set primary photo' });
  }
});

// PATCH /:itemId/reorder — update sort order
router.put('/:itemId/reorder', (req: Request, res: Response) => {
  try {
    const itemId = parseInt(req.params.itemId, 10);
    const { photoIds } = req.body;
    if (!Array.isArray(photoIds)) {
      res.status(400).json({ error: 'photoIds array required' });
      return;
    }

    const db = getDatabase();
    const stmt = db.prepare('UPDATE item_photos SET sort_order = ? WHERE id = ? AND item_id = ?');
    for (let i = 0; i < photoIds.length; i++) {
      stmt.run(i, photoIds[i], itemId);
    }

    res.json({ message: 'Photos reordered' });
  } catch (error) {
    console.error('Error reordering photos:', error);
    res.status(500).json({ error: 'Failed to reorder photos' });
  }
});

// DELETE /:photoId — delete a photo
router.delete('/:photoId', (req: Request, res: Response) => {
  try {
    const photoId = parseInt(req.params.photoId, 10);
    const photo = queryOne<{ filename: string; itemId: number; isPrimary: number }>(
      'SELECT * FROM item_photos WHERE id = ?',
      [photoId],
    );
    if (!photo) {
      res.status(404).json({ error: 'Photo not found' });
      return;
    }

    run('DELETE FROM item_photos WHERE id = ?', [photoId]);
    fs.unlink(path.join(PHOTOS_DIR, photo.filename), () => {});

    // If deleted photo was primary, promote the next one
    if (photo.isPrimary) {
      const db = getDatabase();
      const next = db.prepare('SELECT id FROM item_photos WHERE item_id = ? ORDER BY sort_order ASC LIMIT 1').get(photo.itemId) as { id: number } | undefined;
      if (next) {
        db.prepare('UPDATE item_photos SET is_primary = 1 WHERE id = ?').run(next.id);
      }
      syncPrimaryPicture(photo.itemId);
    }

    logAudit({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      action: 'photo.deleted',
      resourceType: 'photo',
      resourceId: photoId,
      details: { itemId: photo.itemId },
    });

    res.json({ message: 'Photo deleted' });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

/**
 * Read the primary photo from disk and update items.picture as base64.
 * If no photos remain, sets picture to null.
 */
function syncPrimaryPicture(itemId: number): void {
  const primary = queryOne<{ filename: string; mimeType: string }>(
    'SELECT * FROM item_photos WHERE item_id = ? AND is_primary = 1',
    [itemId],
  );
  if (!primary) {
    run('UPDATE items SET picture = NULL WHERE id = ?', [itemId]);
    return;
  }
  const filePath = path.join(PHOTOS_DIR, primary.filename);
  try {
    const data = fs.readFileSync(filePath);
    const base64 = `data:${primary.mimeType};base64,${data.toString('base64')}`;
    run('UPDATE items SET picture = ? WHERE id = ?', [base64, itemId]);
  } catch {
    // File missing — clear picture
    run('UPDATE items SET picture = NULL WHERE id = ?', [itemId]);
  }
}

export { PHOTOS_DIR };
export default router;
