import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { runMigrations } from '../migrations';

// Schema WITHOUT FK constraints (simulates pre-migration database)
const OLD_SCHEMA = `
CREATE TABLE IF NOT EXISTS inventory_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL DEFAULT '',
  schema TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_value REAL NOT NULL DEFAULT 0,
  value REAL NOT NULL DEFAULT 0,
  picture TEXT,
  category TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  barcode TEXT NOT NULL DEFAULT '',
  reorder_point INTEGER NOT NULL DEFAULT 0,
  inventory_type_id INTEGER NOT NULL DEFAULT 1,
  custom_fields TEXT NOT NULL DEFAULT '{}',
  parent_item_id INTEGER REFERENCES items(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  inventory_type_id INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(name, inventory_type_id)
);
`;

const now = '2026-01-01T00:00:00Z';

function seedType(db: Database.Database, id: number, name: string): void {
  db.prepare(
    'INSERT INTO inventory_types (id, name, icon, schema, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(id, name, '', '[]', now, now);
}

function seedItem(db: Database.Database, name: string, typeId: number): number {
  const result = db.prepare(
    'INSERT INTO items (name, inventory_type_id, custom_fields, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
  ).run(name, typeId, '{}', now, now);
  return Number(result.lastInsertRowid);
}

function seedCategory(db: Database.Database, name: string, typeId: number): void {
  db.prepare(
    'INSERT INTO categories (name, inventory_type_id, created_at, updated_at) VALUES (?, ?, ?, ?)',
  ).run(name, typeId, now, now);
}

function getForeignKeys(db: Database.Database, table: string): { from: string; table: string }[] {
  return db.pragma(`foreign_key_list(${table})`) as { from: string; table: string }[];
}

describe('migrations', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
  });

  afterEach(() => {
    db.close();
  });

  it('adds FK constraint to items.inventory_type_id', () => {
    db.exec(OLD_SCHEMA);
    seedType(db, 1, 'Firearms');
    seedItem(db, 'Test Item', 1);

    runMigrations(db);

    const fks = getForeignKeys(db, 'items');
    const typeFK = fks.find((fk) => fk.from === 'inventory_type_id');
    expect(typeFK).toBeDefined();
    expect(typeFK!.table).toBe('inventory_types');
  });

  it('adds FK constraint to categories.inventory_type_id', () => {
    db.exec(OLD_SCHEMA);
    seedType(db, 1, 'Firearms');
    seedCategory(db, 'Handguns', 1);

    runMigrations(db);

    const fks = getForeignKeys(db, 'categories');
    const typeFK = fks.find((fk) => fk.from === 'inventory_type_id');
    expect(typeFK).toBeDefined();
    expect(typeFK!.table).toBe('inventory_types');
  });

  it('preserves existing data after migration', () => {
    db.exec(OLD_SCHEMA);
    seedType(db, 1, 'Firearms');
    seedItem(db, 'Glock 19', 1);
    seedItem(db, 'AR-15', 1);
    seedCategory(db, 'Handguns', 1);

    runMigrations(db);

    const items = db.prepare('SELECT * FROM items').all() as { name: string }[];
    expect(items).toHaveLength(2);
    expect(items.map((i) => i.name)).toContain('Glock 19');
    expect(items.map((i) => i.name)).toContain('AR-15');

    const cats = db.prepare('SELECT * FROM categories').all() as { name: string }[];
    expect(cats).toHaveLength(1);
    expect(cats[0].name).toBe('Handguns');
  });

  it('cleans up orphaned items with invalid inventory_type_id', () => {
    db.exec(OLD_SCHEMA);
    seedType(db, 1, 'Firearms');
    // Insert item with non-existent type (possible without FK)
    db.prepare(
      'INSERT INTO items (name, inventory_type_id, custom_fields, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    ).run('Orphan', 999, '{}', now, now);

    runMigrations(db);

    const item = db.prepare('SELECT inventory_type_id FROM items WHERE name = ?').get('Orphan') as {
      inventory_type_id: number;
    };
    expect(item.inventory_type_id).toBe(1);
  });

  it('deletes orphaned categories with invalid inventory_type_id', () => {
    db.exec(OLD_SCHEMA);
    seedType(db, 1, 'Firearms');
    seedCategory(db, 'Valid', 1);
    // Insert category with non-existent type
    db.prepare(
      'INSERT INTO categories (name, inventory_type_id, created_at, updated_at) VALUES (?, ?, ?, ?)',
    ).run('Orphan Cat', 999, now, now);

    runMigrations(db);

    const cats = db.prepare('SELECT * FROM categories').all();
    expect(cats).toHaveLength(1);
  });

  it('is idempotent — running twice has no effect', () => {
    db.exec(OLD_SCHEMA);
    seedType(db, 1, 'Firearms');
    seedItem(db, 'Test', 1);
    seedCategory(db, 'Handguns', 1);

    runMigrations(db);
    runMigrations(db);

    const items = db.prepare('SELECT * FROM items').all();
    expect(items).toHaveLength(1);

    const cats = db.prepare('SELECT * FROM categories').all();
    expect(cats).toHaveLength(1);

    const fks = getForeignKeys(db, 'items');
    expect(fks.find((fk) => fk.from === 'inventory_type_id')).toBeDefined();
  });

  it('enforces FK constraint after migration — rejects invalid inventory_type_id', () => {
    db.exec(OLD_SCHEMA);
    seedType(db, 1, 'Firearms');

    runMigrations(db);

    expect(() => {
      db.prepare(
        'INSERT INTO items (name, inventory_type_id, custom_fields, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      ).run('Bad Item', 999, '{}', now, now);
    }).toThrow();
  });

  it('enforces RESTRICT on items — blocks inventory type deletion when items exist', () => {
    db.exec(OLD_SCHEMA);
    seedType(db, 1, 'Firearms');
    seedItem(db, 'Test Item', 1);

    runMigrations(db);

    expect(() => {
      db.prepare('DELETE FROM inventory_types WHERE id = 1').run();
    }).toThrow();
  });

  it('enforces CASCADE on categories — deletes categories when type is deleted', () => {
    db.exec(OLD_SCHEMA);
    seedType(db, 1, 'Firearms');
    seedType(db, 2, 'Accessories');
    seedCategory(db, 'Optics', 2);

    runMigrations(db);

    db.prepare('DELETE FROM inventory_types WHERE id = 2').run();

    const cats = db.prepare('SELECT * FROM categories WHERE inventory_type_id = 2').all();
    expect(cats).toHaveLength(0);
  });

  it('preserves parent-child relationships after migration', () => {
    db.exec(OLD_SCHEMA);
    seedType(db, 1, 'Firearms');
    const parentId = seedItem(db, 'Parent', 1);
    db.prepare(
      'INSERT INTO items (name, inventory_type_id, custom_fields, parent_item_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    ).run('Child', 1, '{}', parentId, now, now);

    runMigrations(db);

    const child = db.prepare('SELECT parent_item_id FROM items WHERE name = ?').get('Child') as {
      parent_item_id: number;
    };
    expect(child.parent_item_id).toBe(parentId);
  });
});
