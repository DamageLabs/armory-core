import { Item } from '../../../types/Item';
import { BaseRepository } from '../BaseRepository';
import { execQuery, execStatement } from '../db';
import { mapRowsToEntities } from '../mapper';

export class ItemRepository extends BaseRepository<Item> {
  protected tableName = 'items';
  protected jsonFields = ['customFields'];

  /**
   * Find items by inventory type
   */
  findByType(inventoryTypeId: number): Item[] {
    return this.query(
      `SELECT * FROM ${this.tableName} WHERE inventory_type_id = ?`,
      [inventoryTypeId]
    );
  }

  /**
   * Find items by category
   */
  findByCategory(category: string): Item[] {
    const rows = execQuery<Record<string, unknown>>(
      `SELECT * FROM ${this.tableName} WHERE category = ?`,
      [category]
    );
    return mapRowsToEntities<Item>(rows, this.jsonFields);
  }

  /**
   * Find an item by barcode
   */
  findByBarcode(barcode: string): Item | null {
    return this.queryOne(
      `SELECT * FROM ${this.tableName} WHERE barcode = ?`,
      [barcode]
    );
  }

  /**
   * Delete multiple items by IDs
   */
  deleteMany(ids: number[]): number {
    if (ids.length === 0) {
      return 0;
    }
    const placeholders = ids.map(() => '?').join(', ');
    return execStatement(
      `DELETE FROM ${this.tableName} WHERE id IN (${placeholders})`,
      ids
    );
  }

  /**
   * Update category for multiple items
   */
  updateCategoryBulk(ids: number[], category: string, updatedAt: string): number {
    if (ids.length === 0) {
      return 0;
    }
    const placeholders = ids.map(() => '?').join(', ');
    return execStatement(
      `UPDATE ${this.tableName} SET category = ?, updated_at = ? WHERE id IN (${placeholders})`,
      [category, updatedAt, ...ids]
    );
  }

  /**
   * Get items with quantity at or below threshold
   */
  getLowStock(threshold: number): Item[] {
    return this.query(
      `SELECT * FROM ${this.tableName} WHERE quantity <= ?`,
      [threshold]
    );
  }

  /**
   * Get items needing reorder (quantity <= reorderPoint and reorderPoint > 0)
   */
  getItemsNeedingReorder(): Item[] {
    return this.query(
      `SELECT * FROM ${this.tableName} WHERE reorder_point > 0 AND quantity <= reorder_point`
    );
  }

  /**
   * Get total quantity of all items
   */
  getTotalQuantity(): number {
    const result = execQuery<{ total: number }>(
      `SELECT COALESCE(SUM(quantity), 0) as total FROM ${this.tableName}`
    );
    return result[0]?.total ?? 0;
  }

  /**
   * Get total value of all items
   */
  getTotalValue(): number {
    const result = execQuery<{ total: number }>(
      `SELECT COALESCE(SUM(value), 0) as total FROM ${this.tableName}`
    );
    return result[0]?.total ?? 0;
  }

  /**
   * Update item with calculated value
   */
  updateWithValue(
    id: number,
    data: Partial<Item>,
    updatedAt: string
  ): Item | null {
    const existing = this.getById(id);
    if (!existing) {
      return null;
    }

    const quantity = data.quantity ?? existing.quantity;
    const unitValue = data.unitValue ?? existing.unitValue;
    const value = quantity * unitValue;

    return this.update(id, {
      ...data,
      value,
      updatedAt,
    } as Partial<Item>);
  }

  /**
   * Create item with calculated value
   */
  createWithValue(data: Omit<Item, 'id' | 'value'>): Item {
    const value = data.quantity * data.unitValue;
    return this.create({
      ...data,
      value,
    } as Omit<Item, 'id'>);
  }
}

// Singleton instance
export const itemRepository = new ItemRepository();
