import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { queryAll, queryOne, run, getDatabase, mapRowToEntity } from '../db/index';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '../schemas/receipts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RECEIPTS_DIR = process.env.RECEIPTS_PATH || path.join(__dirname, '../../data/receipts');

// Ensure receipts directory exists
if (!fs.existsSync(RECEIPTS_DIR)) {
  fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, RECEIPTS_DIR),
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
      cb(new Error('File must be PNG, JPEG, or PDF'));
    }
  },
});

const router = Router();

// POST /:itemId/receipts — Upload receipt for an item
router.post('/:itemId/receipts', (req: Request, res: Response) => {
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
      const now = new Date().toISOString();
      const db = getDatabase();
      const result = db.prepare(
        'INSERT INTO receipts (item_id, filename, original_name, mime_type, size_bytes, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(itemId, req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, now);

      const row = db.prepare('SELECT * FROM receipts WHERE id = ?').get(result.lastInsertRowid) as Record<string, unknown>;
      res.status(201).json(mapRowToEntity(row));
    } catch (error) {
      // Clean up uploaded file on DB failure
      fs.unlink(req.file.path, () => {});
      console.error('Error saving receipt:', error);
      res.status(500).json({ error: 'Failed to save receipt' });
    }
  });
});

// GET /:itemId/receipts — List receipts for an item
router.get('/:itemId/receipts', (req: Request, res: Response) => {
  try {
    const itemId = parseInt(req.params.itemId, 10);
    const item = queryOne('SELECT id FROM items WHERE id = ?', [itemId]);
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    const receipts = queryAll(
      'SELECT * FROM receipts WHERE item_id = ? ORDER BY created_at DESC',
      [itemId]
    );
    res.json(receipts);
  } catch (error) {
    console.error('Error fetching receipts:', error);
    res.status(500).json({ error: 'Failed to fetch receipts' });
  }
});

// GET /download/:receiptId — Download/serve a receipt file
router.get('/download/:receiptId', (req: Request, res: Response) => {
  try {
    const receiptId = parseInt(req.params.receiptId, 10);
    const receipt = queryOne<{ filename: string; originalName: string; mimeType: string }>(
      'SELECT * FROM receipts WHERE id = ?',
      [receiptId]
    );
    if (!receipt) {
      res.status(404).json({ error: 'Receipt not found' });
      return;
    }

    const filePath = path.join(RECEIPTS_DIR, receipt.filename);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Receipt file not found' });
      return;
    }

    res.setHeader('Content-Type', receipt.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(receipt.originalName)}"`);
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error downloading receipt:', error);
    res.status(500).json({ error: 'Failed to download receipt' });
  }
});

// DELETE /:receiptId — Delete a receipt
router.delete('/:receiptId', (req: Request, res: Response) => {
  try {
    const receiptId = parseInt(req.params.receiptId, 10);
    const receipt = queryOne<{ filename: string }>(
      'SELECT * FROM receipts WHERE id = ?',
      [receiptId]
    );
    if (!receipt) {
      res.status(404).json({ error: 'Receipt not found' });
      return;
    }

    run('DELETE FROM receipts WHERE id = ?', [receiptId]);

    const filePath = path.join(RECEIPTS_DIR, receipt.filename);
    fs.unlink(filePath, () => {});

    res.json({ message: 'Receipt deleted' });
  } catch (error) {
    console.error('Error deleting receipt:', error);
    res.status(500).json({ error: 'Failed to delete receipt' });
  }
});

export { RECEIPTS_DIR };
export default router;
