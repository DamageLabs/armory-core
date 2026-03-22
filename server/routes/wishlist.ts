import { Router, Request, Response } from 'express';
import { queryAll, queryOne, run, insert, getDatabase } from '../db/index';
import { validate } from '../middleware/validate';
import { logAudit } from '../services/auditService';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createWishlistItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().default(''),
  targetPrice: z.number().min(0).default(0),
  vendorUrl: z.string().default(''),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  inventoryTypeId: z.number().int().positive().default(1),
  notes: z.string().default('')
});

const updateWishlistItemSchema = createWishlistItemSchema.partial();

// Helper to check ownership or admin
function canAccessWishlistItem(itemUserId: number, requestUserId: number, userRole: string): boolean {
  return itemUserId === requestUserId || userRole === 'admin';
}

// GET /api/wishlist - List user's wishlist items
router.get('/', (req: Request, res: Response) => {
  const user = req.user!;
  const { priority, purchased, sort = 'date', order = 'desc' } = req.query;

  let baseQuery = `
    SELECT 
      w.id,
      w.user_id as userId,
      w.name,
      w.description,
      w.target_price as targetPrice,
      w.vendor_url as vendorUrl,
      w.priority,
      w.inventory_type_id as inventoryTypeId,
      w.notes,
      w.purchased,
      w.purchased_at as purchasedAt,
      w.created_at as createdAt,
      w.updated_at as updatedAt,
      it.name as inventoryTypeName
    FROM wishlist_items w
    LEFT JOIN inventory_types it ON w.inventory_type_id = it.id
  `;

  const params: any[] = [];
  const conditions: string[] = [];

  // Scope by user unless admin
  if (user.role !== 'admin') {
    conditions.push('w.user_id = ?');
    params.push(user.userId);
  }

  // Filter by priority
  if (priority && priority !== 'all') {
    conditions.push('w.priority = ?');
    params.push(priority);
  }

  // Filter by purchased status
  if (purchased !== undefined) {
    const isPurchased = purchased === 'true' ? 1 : 0;
    conditions.push('w.purchased = ?');
    params.push(isPurchased);
  }

  if (conditions.length > 0) {
    baseQuery += ' WHERE ' + conditions.join(' AND ');
  }

  // Sort
  const validSortColumns = {
    date: 'w.created_at',
    priority: 'CASE w.priority WHEN "urgent" THEN 1 WHEN "high" THEN 2 WHEN "medium" THEN 3 WHEN "low" THEN 4 END',
    price: 'w.target_price',
    name: 'w.name'
  };

  const sortColumn = validSortColumns[sort as keyof typeof validSortColumns] || validSortColumns.date;
  const sortOrder = order === 'asc' ? 'ASC' : 'DESC';
  baseQuery += ` ORDER BY ${sortColumn} ${sortOrder}`;

  try {
    const items = queryAll(baseQuery, params);
    res.json(items);
  } catch (error) {
    console.error('Error fetching wishlist items:', error);
    res.status(500).json({ error: 'Failed to fetch wishlist items' });
  }
});

// GET /api/wishlist/:id - Get single item
router.get('/:id', (req: Request, res: Response) => {
  const user = req.user!;
  const { id } = req.params;

  try {
    const item = queryOne(`
      SELECT 
        w.id,
        w.user_id as userId,
        w.name,
        w.description,
        w.target_price as targetPrice,
        w.vendor_url as vendorUrl,
        w.priority,
        w.inventory_type_id as inventoryTypeId,
        w.notes,
        w.purchased,
        w.purchased_at as purchasedAt,
        w.created_at as createdAt,
        w.updated_at as updatedAt,
        it.name as inventoryTypeName
      FROM wishlist_items w
      LEFT JOIN inventory_types it ON w.inventory_type_id = it.id
      WHERE w.id = ?
    `, [id]);

    if (!item) {
      return res.status(404).json({ error: 'Wishlist item not found' });
    }

    if (!canAccessWishlistItem(item.userId, user.userId, user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(item);
  } catch (error) {
    console.error('Error fetching wishlist item:', error);
    res.status(500).json({ error: 'Failed to fetch wishlist item' });
  }
});

// POST /api/wishlist - Create new item
router.post('/', validate(createWishlistItemSchema), (req: Request, res: Response) => {
  const user = req.user!;
  const data = req.body;

  try {
    const now = new Date().toISOString();
    const itemId = insert(
      'wishlist_items',
      {
        user_id: user.userId,
        name: data.name,
        description: data.description,
        target_price: data.targetPrice,
        vendor_url: data.vendorUrl,
        priority: data.priority,
        inventory_type_id: data.inventoryTypeId,
        notes: data.notes,
        purchased: 0,
        purchased_at: null,
        created_at: now,
        updated_at: now
      }
    );

    logAudit(user.userId, user.email, 'create', 'wishlist_item', itemId, data);

    // Fetch the created item with inventory type name
    const newItem = queryOne(`
      SELECT 
        w.id,
        w.user_id as userId,
        w.name,
        w.description,
        w.target_price as targetPrice,
        w.vendor_url as vendorUrl,
        w.priority,
        w.inventory_type_id as inventoryTypeId,
        w.notes,
        w.purchased,
        w.purchased_at as purchasedAt,
        w.created_at as createdAt,
        w.updated_at as updatedAt,
        it.name as inventoryTypeName
      FROM wishlist_items w
      LEFT JOIN inventory_types it ON w.inventory_type_id = it.id
      WHERE w.id = ?
    `, [itemId]);

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating wishlist item:', error);
    res.status(500).json({ error: 'Failed to create wishlist item' });
  }
});

// PUT /api/wishlist/:id - Update item
router.put('/:id', validate(updateWishlistItemSchema), (req: Request, res: Response) => {
  const user = req.user!;
  const { id } = req.params;
  const data = req.body;

  try {
    // Check if item exists and user has access
    const existingItem = queryOne('SELECT user_id as userId FROM wishlist_items WHERE id = ?', [id]);
    if (!existingItem) {
      return res.status(404).json({ error: 'Wishlist item not found' });
    }

    if (!canAccessWishlistItem(existingItem.userId, user.userId, user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Build update fields
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.targetPrice !== undefined) updateData.target_price = data.targetPrice;
    if (data.vendorUrl !== undefined) updateData.vendor_url = data.vendorUrl;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.inventoryTypeId !== undefined) updateData.inventory_type_id = data.inventoryTypeId;
    if (data.notes !== undefined) updateData.notes = data.notes;

    run(
      `UPDATE wishlist_items SET ${Object.keys(updateData).map(key => `${key} = ?`).join(', ')} WHERE id = ?`,
      [...Object.values(updateData), id]
    );

    logAudit(user.userId, user.email, 'update', 'wishlist_item', parseInt(id), data);

    // Fetch updated item
    const updatedItem = queryOne(`
      SELECT 
        w.id,
        w.user_id as userId,
        w.name,
        w.description,
        w.target_price as targetPrice,
        w.vendor_url as vendorUrl,
        w.priority,
        w.inventory_type_id as inventoryTypeId,
        w.notes,
        w.purchased,
        w.purchased_at as purchasedAt,
        w.created_at as createdAt,
        w.updated_at as updatedAt,
        it.name as inventoryTypeName
      FROM wishlist_items w
      LEFT JOIN inventory_types it ON w.inventory_type_id = it.id
      WHERE w.id = ?
    `, [id]);

    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating wishlist item:', error);
    res.status(500).json({ error: 'Failed to update wishlist item' });
  }
});

// DELETE /api/wishlist/:id - Delete item
router.delete('/:id', (req: Request, res: Response) => {
  const user = req.user!;
  const { id } = req.params;

  try {
    // Check if item exists and user has access
    const existingItem = queryOne('SELECT user_id as userId FROM wishlist_items WHERE id = ?', [id]);
    if (!existingItem) {
      return res.status(404).json({ error: 'Wishlist item not found' });
    }

    if (!canAccessWishlistItem(existingItem.userId, user.userId, user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    run('DELETE FROM wishlist_items WHERE id = ?', [id]);

    logAudit(user.userId, user.email, 'delete', 'wishlist_item', parseInt(id));

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting wishlist item:', error);
    res.status(500).json({ error: 'Failed to delete wishlist item' });
  }
});

// POST /api/wishlist/:id/purchase - Mark as purchased and create inventory item
router.post('/:id/purchase', (req: Request, res: Response) => {
  const user = req.user!;
  const { id } = req.params;

  const db = getDatabase();
  const transaction = db.transaction(() => {
    // Get the wishlist item
    const wishlistItem = queryOne(`
      SELECT * FROM wishlist_items WHERE id = ?
    `, [id]);

    if (!wishlistItem) {
      throw new Error('Wishlist item not found');
    }

    if (!canAccessWishlistItem(wishlistItem.user_id, user.userId, user.role)) {
      throw new Error('Access denied');
    }

    if (wishlistItem.purchased) {
      throw new Error('Item already purchased');
    }

    // Mark wishlist item as purchased
    const now = new Date().toISOString();
    run(
      'UPDATE wishlist_items SET purchased = 1, purchased_at = ?, updated_at = ? WHERE id = ?',
      [now, now, id]
    );

    // Create inventory item
    const inventoryItemId = insert('items', {
      user_id: user.userId,
      name: wishlistItem.name,
      description: wishlistItem.description,
      quantity: 1,
      unit_value: wishlistItem.target_price,
      value: wishlistItem.target_price,
      picture: null,
      category: '',
      location: '',
      barcode: '',
      reorder_point: 0,
      inventory_type_id: wishlistItem.inventory_type_id,
      custom_fields: '{}',
      parent_item_id: null,
      expiration_date: null,
      expiration_notes: '',
      created_at: now,
      updated_at: now
    });

    // Log audit for both actions
    logAudit(user.userId, user.email, 'purchase', 'wishlist_item', parseInt(id));
    logAudit(user.userId, user.email, 'create', 'item', inventoryItemId, {
      name: wishlistItem.name,
      source: 'wishlist_purchase'
    });

    return inventoryItemId;
  });

  try {
    const inventoryItemId = transaction();
    res.json({ inventoryItemId });
  } catch (error) {
    console.error('Error purchasing wishlist item:', error);
    const message = error instanceof Error ? error.message : 'Failed to purchase wishlist item';
    res.status(400).json({ error: message });
  }
});

export default router;