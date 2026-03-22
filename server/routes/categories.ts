import { Router, Request, Response } from 'express';
import { queryAll, queryOne, insert, update, deleteById, count, run } from '../db/index';
import { validate } from '../middleware/validate';
import { requireAdmin } from '../middleware/auth';
import { createCategorySchema, updateCategorySchema, reorderCategoriesSchema } from '../schemas/categories';
import { logAudit } from '../services/auditService';

const router = Router();

// GET / — list categories, optionally filtered by typeId
router.get('/', (req: Request, res: Response) => {
  try {
    const { typeId } = req.query;
    if (typeId) {
      const categories = queryAll(
        'SELECT * FROM categories WHERE inventory_type_id = ? ORDER BY sort_order, name',
        [typeId]
      );
      res.json(categories);
    } else {
      const categories = queryAll('SELECT * FROM categories ORDER BY sort_order, name');
      res.json(categories);
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /counts — category item counts
router.get('/counts', (req: Request, res: Response) => {
  try {
    // Scope counts by user for non-admin users
    const userFilter = req.user?.role !== 'admin' ? 'AND i.user_id = ?' : '';
    const userValues = req.user?.role !== 'admin' ? [req.user?.userId] : [];
    
    const counts = queryAll(
      `SELECT c.name, COUNT(i.id) as count FROM categories c LEFT JOIN items i ON c.name = i.category ${userFilter !== '' ? 'WHERE 1=1 ' + userFilter : ''} GROUP BY c.name`,
      userValues
    );
    res.json(counts);
  } catch (error) {
    console.error('Error fetching category counts:', error);
    res.status(500).json({ error: 'Failed to fetch category counts' });
  }
});

// PUT /reorder — reorder categories
router.put('/reorder', requireAdmin, validate(reorderCategoriesSchema), (req: Request, res: Response) => {
  try {
    const { orderedIds } = req.body as { orderedIds: number[] };
    for (let i = 0; i < orderedIds.length; i++) {
      run('UPDATE categories SET sort_order = ? WHERE id = ?', [i, orderedIds[i]]);
    }
    res.json({ message: 'Categories reordered' });
  } catch (error) {
    console.error('Error reordering categories:', error);
    res.status(500).json({ error: 'Failed to reorder categories' });
  }
});

// POST / — create category
router.post('/', requireAdmin, validate(createCategorySchema), (req: Request, res: Response) => {
  try {
    const { name, sortOrder, inventoryTypeId } = req.body;

    const existing = queryOne(
      'SELECT id FROM categories WHERE LOWER(name) = LOWER(?) AND inventory_type_id = ?',
      [name, inventoryTypeId]
    );
    if (existing) {
      res.status(400).json({ error: 'A category with this name already exists for this inventory type' });
      return;
    }

    const now = new Date().toISOString();
    const category = insert('categories', {
      name, sortOrder, inventoryTypeId, createdAt: now, updatedAt: now,
    }) as Record<string, unknown>;
    logAudit({ userId: req.user?.userId, userEmail: req.user?.email, action: 'category.created', resourceType: 'category', resourceId: category.id as number, details: { name } });
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT /:id — update category
router.put('/:id', requireAdmin, validate(updateCategorySchema), (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { name, sortOrder, inventoryTypeId } = req.body;

    if (name) {
      const current = queryOne<{ inventoryTypeId: number }>('SELECT * FROM categories WHERE id = ?', [id]);
      const typeId = inventoryTypeId ?? current?.inventoryTypeId;
      const existing = queryOne<{ id: number }>(
        'SELECT id FROM categories WHERE LOWER(name) = LOWER(?) AND inventory_type_id = ? AND id != ?',
        [name, typeId, id]
      );
      if (existing) {
        res.status(400).json({ error: 'A category with this name already exists for this inventory type' });
        return;
      }
    }

    const data: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (name !== undefined) data.name = name;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;
    if (inventoryTypeId !== undefined) data.inventoryTypeId = inventoryTypeId;

    const category = update('categories', id, data);
    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    logAudit({ userId: req.user?.userId, userEmail: req.user?.email, action: 'category.updated', resourceType: 'category', resourceId: id, details: { name } });
    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /:id — delete category if not in use
router.delete('/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const cat = queryOne<{ name: string }>('SELECT * FROM categories WHERE id = ?', [id]);
    if (!cat) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    const itemCount = count('items', 'category = ?', [cat.name]);
    if (itemCount > 0) {
      res.status(400).json({ error: `Cannot delete: ${itemCount} item(s) are using this category` });
      return;
    }

    deleteById('categories', id);
    logAudit({ userId: req.user?.userId, userEmail: req.user?.email, action: 'category.deleted', resourceType: 'category', resourceId: id, details: { name: cat.name } });
    res.json({ message: 'Category deleted' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
