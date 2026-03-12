import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { queryAll, queryOne, run, insert, update, deleteById, getDatabase } from '../db/index';
import { parsePaginationParams, buildItemWhereClause, getSortColumn, buildPaginationMeta } from '../db/pagination';
import { validate } from '../middleware/validate';
import { createItemSchema, updateItemSchema, bulkCreateSchema, bulkDeleteSchema, bulkCategorySchema } from '../schemas/items';
import { logAudit } from '../services/auditService';

const router = Router();
const JSON_FIELDS = ['customFields'];

/** Check whether an inventory_type_id corresponds to 'Firearms'. */
function isFirearmType(inventoryTypeId: number): boolean {
  const row = queryOne<{ name: string }>(
    'SELECT name FROM inventory_types WHERE id = ?',
    [inventoryTypeId]
  );
  return row?.name === 'Firearms';
}

/** Recalculate a firearm's total value = unitValue + SUM(children.value). No-op for non-firearms. */
function recalcFirearmValue(itemId: number): void {
  const item = queryOne<{ inventoryTypeId: number; unitValue: number }>(
    'SELECT inventory_type_id as inventoryTypeId, unit_value as unitValue FROM items WHERE id = ?',
    [itemId]
  );
  if (!item || !isFirearmType(item.inventoryTypeId)) return;

  const db = getDatabase();
  const row = db.prepare(
    'SELECT COALESCE(SUM(value), 0) as childTotal FROM items WHERE parent_item_id = ?'
  ).get(itemId) as { childTotal: number };

  const newValue = item.unitValue + row.childTotal;
  run('UPDATE items SET value = ?, updated_at = ? WHERE id = ?', [newValue, new Date().toISOString(), itemId]);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RECEIPTS_DIR = process.env.RECEIPTS_PATH || path.join(__dirname, '../../data/receipts');
const PHOTOS_DIR = process.env.PHOTOS_PATH || path.join(__dirname, '../../data/photos');

function cleanupReceiptFiles(itemId: number): void {
  const receipts = queryAll<{ filename: string }>('SELECT filename FROM receipts WHERE item_id = ?', [itemId]);
  for (const r of receipts) {
    fs.unlink(path.join(RECEIPTS_DIR, r.filename), () => {});
  }
}

function cleanupPhotoFiles(itemId: number): void {
  const photos = queryAll<{ filename: string }>('SELECT filename FROM item_photos WHERE item_id = ?', [itemId]);
  for (const p of photos) {
    fs.unlink(path.join(PHOTOS_DIR, p.filename), () => {});
  }
}

// GET / — Get items (paginated)
router.get('/', (req: Request, res: Response) => {
  try {
    const params = parsePaginationParams(req.query as Record<string, unknown>);
    const { where, values } = buildItemWhereClause(params);
    const sortCol = getSortColumn(params.sortBy);
    const sortDir = params.sortDir.toUpperCase();

    const db = getDatabase();
    const countRow = db.prepare(`SELECT COUNT(*) as count FROM items ${where}`).get(...values) as { count: number };
    const totalItems = countRow.count;

    const offset = (params.page - 1) * params.pageSize;
    const rows = queryAll(
      `SELECT items.*, (SELECT COUNT(*) FROM items c WHERE c.parent_item_id = items.id) AS child_count, (SELECT p.name FROM items p WHERE p.id = items.parent_item_id) AS parent_name FROM items ${where} ORDER BY ${sortCol} ${sortDir} LIMIT ? OFFSET ?`,
      [...values, params.pageSize, offset],
      JSON_FIELDS
    );

    res.json({
      data: rows,
      pagination: buildPaginationMeta(totalItems, params.page, params.pageSize),
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// GET /stats — Return totalQuantity and totalValue (with optional filters)
router.get('/stats', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const params = parsePaginationParams(req.query as Record<string, unknown>);
    const { where, values } = buildItemWhereClause(params);
    const row = db.prepare(
      `SELECT COALESCE(SUM(quantity), 0) as totalQuantity, COALESCE(SUM(value), 0) as totalValue, COUNT(*) as totalItems FROM items ${where}`
    ).get(...values) as { totalQuantity: number; totalValue: number; totalItems: number };
    res.json(row);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /reorder — Items needing reorder (Ammunition only)
router.get('/reorder', (_req: Request, res: Response) => {
  try {
    const items = queryAll(
      `SELECT items.* FROM items
       JOIN inventory_types ON items.inventory_type_id = inventory_types.id
       WHERE items.quantity <= items.reorder_point AND items.reorder_point > 0
         AND inventory_types.name IN ('Ammunition')
       ORDER BY items.name`,
      [],
      JSON_FIELDS
    );
    res.json(items);
  } catch (error) {
    console.error('Error fetching reorder items:', error);
    res.status(500).json({ error: 'Failed to fetch reorder items' });
  }
});

// GET /low-stock — Items below threshold (Ammunition only)
router.get('/low-stock', (req: Request, res: Response) => {
  try {
    const threshold = parseInt(req.query.threshold as string, 10) || 10;
    const items = queryAll(
      `SELECT items.* FROM items
       JOIN inventory_types ON items.inventory_type_id = inventory_types.id
       WHERE items.quantity < ?
         AND inventory_types.name IN ('Ammunition')
       ORDER BY items.name`,
      [threshold],
      JSON_FIELDS
    );
    res.json(items);
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({ error: 'Failed to fetch low stock items' });
  }
});

// GET /low-stock-counts — Per-item reorder point based counts
router.get('/low-stock-counts', (_req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const row = db.prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN items.quantity <= items.reorder_point AND items.quantity > 0 THEN 1 ELSE 0 END), 0) as lowStock,
         COALESCE(SUM(CASE WHEN items.quantity = 0 THEN 1 ELSE 0 END), 0) as outOfStock
       FROM items
       JOIN inventory_types ON items.inventory_type_id = inventory_types.id
       WHERE items.reorder_point > 0
         AND inventory_types.name IN ('Ammunition')`
    ).get() as { lowStock: number; outOfStock: number };
    res.json(row);
  } catch (error) {
    console.error('Error fetching low stock counts:', error);
    res.status(500).json({ error: 'Failed to fetch low stock counts' });
  }
});

// POST /bulk-create — Create multiple items with parent-child remapping
router.post('/bulk-create', validate(bulkCreateSchema), (req: Request, res: Response) => {
  try {
    const { items } = req.body as { items: Record<string, unknown>[] };

    const now = new Date().toISOString();
    const db = getDatabase();
    const idMapping: Record<number, number> = {};
    let created = 0;

    const parents = items.filter((it) => !it.parentItemId);
    const children = items.filter((it) => it.parentItemId);

    const parentIdsToRecalc = new Set<number>();
    const txn = db.transaction(() => {
      for (const item of parents) {
        const typeId = Number(item.inventoryTypeId) || 1;
        const qty = Number(item.quantity) || 0;
        const uv = Number(item.unitValue) || 0;
        const value = isFirearmType(typeId) ? uv : qty * uv;
        const oldId = item.id as number | undefined;

        const result = insert('items', {
          name: item.name || '',
          description: item.description || '',
          quantity: qty,
          unitValue: uv,
          value,
          picture: item.picture || null,
          category: item.category || '',
          location: item.location || '',
          barcode: item.barcode || '',
          reorderPoint: Number(item.reorderPoint) || 0,
          inventoryTypeId: typeId,
          customFields: item.customFields || {},
          parentItemId: null,
          createdAt: now,
          updatedAt: now,
        }, JSON_FIELDS) as Record<string, unknown>;

        if (oldId) idMapping[oldId] = result.id as number;
        run(
          'INSERT INTO stock_history (item_id, item_name, change_type, previous_quantity, new_quantity, previous_value, new_value, previous_category, new_category, notes, user_id, user_email, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [result.id, item.name, 'created', 0, qty, 0, value, null, item.category || '', 'Bulk restore', req.user?.userId ?? null, req.user?.email ?? null, now]
        );
        created++;
      }

      for (const item of children) {
        const qty = Number(item.quantity) || 0;
        const uv = Number(item.unitValue) || 0;
        const value = qty * uv;
        const oldId = item.id as number | undefined;
        const oldParentId = item.parentItemId as number;
        const newParentId = idMapping[oldParentId] || null;

        const result = insert('items', {
          name: item.name || '',
          description: item.description || '',
          quantity: qty,
          unitValue: uv,
          value,
          picture: item.picture || null,
          category: item.category || '',
          location: item.location || '',
          barcode: item.barcode || '',
          reorderPoint: Number(item.reorderPoint) || 0,
          inventoryTypeId: Number(item.inventoryTypeId) || 1,
          customFields: item.customFields || {},
          parentItemId: newParentId,
          createdAt: now,
          updatedAt: now,
        }, JSON_FIELDS) as Record<string, unknown>;

        if (oldId) idMapping[oldId] = result.id as number;
        if (newParentId) parentIdsToRecalc.add(newParentId);
        run(
          'INSERT INTO stock_history (item_id, item_name, change_type, previous_quantity, new_quantity, previous_value, new_value, previous_category, new_category, notes, user_id, user_email, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [result.id, item.name, 'created', 0, qty, 0, value, null, item.category || '', 'Bulk restore', req.user?.userId ?? null, req.user?.email ?? null, now]
        );
        created++;
      }
    });
    txn();

    // Recalc parent firearm values after children are restored
    for (const pid of parentIdsToRecalc) {
      recalcFirearmValue(pid);
    }

    logAudit({ userId: req.user?.userId, userEmail: req.user?.email, action: 'item.bulk_created', resourceType: 'item', details: { count: created } });

    res.status(201).json({ created, idMapping });
  } catch (error) {
    console.error('Error bulk creating items:', error);
    res.status(500).json({ error: 'Failed to bulk create items' });
  }
});

// DELETE /all — Delete all items and related history
router.delete('/all', (_req: Request, res: Response) => {
  try {
    const db = getDatabase();
    // Clean up all receipt files before deleting
    try {
      const allReceipts = queryAll<{ filename: string }>('SELECT filename FROM receipts', []);
      for (const r of allReceipts) {
        if (r.filename) {
          fs.unlink(path.join(RECEIPTS_DIR, r.filename), () => {});
        }
      }
    } catch {
      // receipts table may not exist yet during tests
    }

    const txn = db.transaction(() => {
      try { run('DELETE FROM receipts'); } catch { /* table may not exist */ }
      run('DELETE FROM stock_history');
      run('DELETE FROM cost_history');
      run('DELETE FROM items');
    });
    txn();

    res.json({ message: 'All items and history cleared' });
  } catch (error) {
    console.error('Error deleting all items:', error);
    res.status(500).json({ error: 'Failed to delete all items' });
  }
});

// POST /bulk-delete — Delete multiple items (must be before /:id)
router.post('/bulk-delete', validate(bulkDeleteSchema), (req: Request, res: Response) => {
  try {
    const { ids } = req.body as { ids: number[] };

    const now = new Date().toISOString();
    const db = getDatabase();
    const parentIdsToRecalc = new Set<number>();
    const txn = db.transaction(() => {
      for (const id of ids) {
        const existing = queryOne<Record<string, unknown>>('SELECT * FROM items WHERE id = ?', [id], JSON_FIELDS);
        if (existing) {
          if (existing.parentItemId && !ids.includes(existing.parentItemId as number)) {
            parentIdsToRecalc.add(existing.parentItemId as number);
          }
          run('UPDATE items SET parent_item_id = NULL WHERE parent_item_id = ?', [id]);
          run(
            'INSERT INTO stock_history (item_id, item_name, change_type, previous_quantity, new_quantity, previous_value, new_value, previous_category, new_category, notes, user_id, user_email, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, existing.name, 'deleted', existing.quantity, 0, existing.value, 0, existing.category, null, 'Bulk delete', req.user?.userId ?? null, req.user?.email ?? null, now]
          );
          cleanupReceiptFiles(id);
          cleanupPhotoFiles(id);
          deleteById('items', id);
        }
      }
    });
    txn();

    // Recalc parent firearm values after bulk delete
    for (const pid of parentIdsToRecalc) {
      recalcFirearmValue(pid);
    }

    logAudit({ userId: req.user?.userId, userEmail: req.user?.email, action: 'item.bulk_deleted', resourceType: 'item', details: { count: ids.length } });

    res.json({ message: `Deleted ${ids.length} items` });
  } catch (error) {
    console.error('Error bulk deleting items:', error);
    res.status(500).json({ error: 'Failed to bulk delete items' });
  }
});

// PUT /bulk-category — Update category for multiple items (must be before /:id)
router.put('/bulk-category', validate(bulkCategorySchema), (req: Request, res: Response) => {
  try {
    const { ids, category } = req.body as { ids: number[]; category: string };

    const now = new Date().toISOString();
    const db = getDatabase();
    const txn = db.transaction(() => {
      for (const id of ids) {
        const existing = queryOne<Record<string, unknown>>('SELECT * FROM items WHERE id = ?', [id], JSON_FIELDS);
        if (existing) {
          run(
            'INSERT INTO stock_history (item_id, item_name, change_type, previous_quantity, new_quantity, previous_value, new_value, previous_category, new_category, notes, user_id, user_email, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, existing.name, 'category_change', existing.quantity, existing.quantity, existing.value, existing.value, existing.category, category, 'Bulk category update', req.user?.userId ?? null, req.user?.email ?? null, now]
          );
          update('items', id, { category, updatedAt: now }, JSON_FIELDS);
        }
      }
    });
    txn();

    logAudit({ userId: req.user?.userId, userEmail: req.user?.email, action: 'item.category_changed', resourceType: 'item', details: { count: ids.length, category } });

    res.json({ message: `Updated category for ${ids.length} items` });
  } catch (error) {
    console.error('Error bulk updating category:', error);
    res.status(500).json({ error: 'Failed to bulk update category' });
  }
});

// GET /:id/children — Get child items of a parent
router.get('/:id/children', (req: Request, res: Response) => {
  try {
    const children = queryAll(
      'SELECT * FROM items WHERE parent_item_id = ? ORDER BY name',
      [req.params.id],
      JSON_FIELDS
    );
    res.json(children);
  } catch (error) {
    console.error('Error fetching child items:', error);
    res.status(500).json({ error: 'Failed to fetch child items' });
  }
});

// GET /:id — Get item by id
router.get('/:id', (req: Request, res: Response) => {
  try {
    const item = queryOne('SELECT * FROM items WHERE id = ?', [req.params.id], JSON_FIELDS);
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }
    res.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// POST / — Create item
router.post('/', validate(createItemSchema), (req: Request, res: Response) => {
  try {
    const now = new Date().toISOString();
    const { name, description, quantity, unitValue, picture, category, location, barcode, reorderPoint, inventoryTypeId, customFields, parentItemId } = req.body;
    const typeId = inventoryTypeId || 1;
    const qty = quantity || 0;
    const uv = unitValue || 0;
    const value = isFirearmType(typeId) ? uv : qty * uv;

    const item = insert('items', {
      name: name || '',
      description: description || '',
      quantity: qty,
      unitValue: uv,
      value,
      picture: picture || null,
      category: category || '',
      location: location || '',
      barcode: barcode || '',
      reorderPoint: reorderPoint || 0,
      inventoryTypeId: typeId,
      customFields: customFields || {},
      parentItemId: parentItemId || null,
      createdAt: now,
      updatedAt: now,
    }, JSON_FIELDS);

    const created = item as Record<string, unknown>;
    run(
      'INSERT INTO stock_history (item_id, item_name, change_type, previous_quantity, new_quantity, previous_value, new_value, previous_category, new_category, notes, user_id, user_email, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [created.id, name || '', 'created', 0, qty, 0, value, null, category || '', 'Item created', req.user?.userId ?? null, req.user?.email ?? null, now]
    );
    logAudit({ userId: req.user?.userId, userEmail: req.user?.email, action: 'item.created', resourceType: 'item', resourceId: created.id as number, details: { name: name || '' } });

    // Recalc parent firearm value when adding a child
    if (parentItemId) {
      recalcFirearmValue(parentItemId);
    }

    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// PUT /:id — Update item
router.put('/:id', validate(updateItemSchema), (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = queryOne<Record<string, unknown>>('SELECT * FROM items WHERE id = ?', [id], JSON_FIELDS);
    if (!existing) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    const now = new Date().toISOString();
    const merged = { ...existing, ...req.body, updatedAt: now };
    const qty = merged.quantity || 0;
    const uv = merged.unitValue || 0;
    const firearm = isFirearmType(merged.inventoryTypeId as number);
    // Firearms: value = unitValue (children added separately via recalc)
    // Others: value = quantity * unitValue
    merged.value = firearm ? uv : qty * uv;
    delete merged.id;

    const oldParentId = existing.parentItemId as number | null;
    const newParentId = merged.parentItemId as number | null;

    const updated = update('items', id, merged, JSON_FIELDS);

    if (existing.quantity !== qty) {
      run(
        'INSERT INTO stock_history (item_id, item_name, change_type, previous_quantity, new_quantity, previous_value, new_value, previous_category, new_category, notes, user_id, user_email, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, merged.name, 'updated', existing.quantity, qty, existing.value, merged.value, existing.category, merged.category, 'Quantity updated', req.user?.userId ?? null, req.user?.email ?? null, now]
      );
    }

    if (existing.unitValue !== uv) {
      run(
        'INSERT INTO cost_history (item_id, old_value, new_value, source, timestamp) VALUES (?, ?, ?, ?, ?)',
        [id, existing.unitValue, uv, 'manual', now]
      );
    }

    logAudit({ userId: req.user?.userId, userEmail: req.user?.email, action: 'item.updated', resourceType: 'item', resourceId: id, details: { name: merged.name } });

    // Recalc parent firearm values when child value/parent changes
    if (firearm) {
      recalcFirearmValue(id);
    }
    if (oldParentId && oldParentId !== newParentId) {
      recalcFirearmValue(oldParentId);
    }
    if (newParentId) {
      recalcFirearmValue(newParentId);
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// DELETE /:id — Delete item
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = queryOne<Record<string, unknown>>('SELECT * FROM items WHERE id = ?', [id], JSON_FIELDS);
    if (!existing) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    const now = new Date().toISOString();
    const parentId = existing.parentItemId as number | null;

    // Unlink children before deleting parent
    run('UPDATE items SET parent_item_id = NULL WHERE parent_item_id = ?', [id]);

    run(
      'INSERT INTO stock_history (item_id, item_name, change_type, previous_quantity, new_quantity, previous_value, new_value, previous_category, new_category, notes, user_id, user_email, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, existing.name, 'deleted', existing.quantity, 0, existing.value, 0, existing.category, null, 'Item deleted', req.user?.userId ?? null, req.user?.email ?? null, now]
    );

    cleanupReceiptFiles(id);
    cleanupPhotoFiles(id);
    deleteById('items', id);
    logAudit({ userId: req.user?.userId, userEmail: req.user?.email, action: 'item.deleted', resourceType: 'item', resourceId: id, details: { name: existing.name as string } });

    // Recalc parent firearm value after removing a child
    if (parentId) {
      recalcFirearmValue(parentId);
    }

    res.json({ message: 'Item deleted' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

export default router;
