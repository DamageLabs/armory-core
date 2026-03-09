import { InventoryType } from '../../../types/InventoryType';
import { BaseRepository } from '../BaseRepository';
import { execQuery } from '../db';

export class InventoryTypeRepository extends BaseRepository<InventoryType> {
  protected tableName = 'inventory_types';
  protected jsonFields = ['schema'];

  findByName(name: string): InventoryType | null {
    return this.queryOne(
      `SELECT * FROM ${this.tableName} WHERE LOWER(name) = LOWER(?)`,
      [name]
    );
  }

  nameExists(name: string, excludeId?: number): boolean {
    const sql = excludeId
      ? `SELECT COUNT(*) as count FROM ${this.tableName} WHERE LOWER(name) = LOWER(?) AND id != ?`
      : `SELECT COUNT(*) as count FROM ${this.tableName} WHERE LOWER(name) = LOWER(?)`;
    const params = excludeId ? [name, excludeId] : [name];
    const rows = execQuery<{ count: number }>(sql, params);
    return rows.length > 0 && rows[0].count > 0;
  }
}

export const inventoryTypeRepository = new InventoryTypeRepository();
