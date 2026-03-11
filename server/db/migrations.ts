import type Database from 'better-sqlite3';

/**
 * Check if a table has a foreign key constraint on a given column.
 */
function hasForeignKey(db: Database.Database, table: string, column: string): boolean {
  const fks = db.pragma(`foreign_key_list(${table})`) as { from: string }[];
  return fks.some((fk) => fk.from === column);
}

/**
 * Clean up orphaned records that reference non-existent inventory types.
 * Reassigns them to inventory_type_id = 1 (the default type).
 */
function cleanOrphanedRecords(db: Database.Database): void {
  db.prepare(`
    UPDATE items SET inventory_type_id = 1
    WHERE inventory_type_id NOT IN (SELECT id FROM inventory_types)
  `).run();

  db.prepare(`
    DELETE FROM categories
    WHERE inventory_type_id NOT IN (SELECT id FROM inventory_types)
  `).run();
}

/**
 * Recreate the items table with FK constraint on inventory_type_id.
 */
function migrateItemsTable(db: Database.Database): void {
  db.exec(`
    CREATE TABLE items_new (
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
      inventory_type_id INTEGER NOT NULL DEFAULT 1 REFERENCES inventory_types(id) ON DELETE RESTRICT,
      custom_fields TEXT NOT NULL DEFAULT '{}',
      parent_item_id INTEGER REFERENCES items_new(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    INSERT INTO items_new SELECT * FROM items;

    DROP TABLE items;

    ALTER TABLE items_new RENAME TO items;

    CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
    CREATE INDEX IF NOT EXISTS idx_items_barcode ON items(barcode);
    CREATE INDEX IF NOT EXISTS idx_items_type_id ON items(inventory_type_id);
    CREATE INDEX IF NOT EXISTS idx_items_parent_id ON items(parent_item_id);
  `);
}

/**
 * Recreate the categories table with FK constraint on inventory_type_id.
 */
function migrateCategoriesTable(db: Database.Database): void {
  db.exec(`
    CREATE TABLE categories_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      inventory_type_id INTEGER NOT NULL DEFAULT 1 REFERENCES inventory_types(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(name, inventory_type_id)
    );

    INSERT INTO categories_new SELECT * FROM categories;

    DROP TABLE categories;

    ALTER TABLE categories_new RENAME TO categories;

    CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);
    CREATE INDEX IF NOT EXISTS idx_categories_type_id ON categories(inventory_type_id);
  `);
}

/**
 * Check if a column exists in a table.
 */
function hasColumn(db: Database.Database, table: string, column: string): boolean {
  const cols = db.pragma(`table_info(${table})`) as { name: string }[];
  return cols.some((c) => c.name === column);
}

/**
 * Add category column to receipts table for existing databases.
 */
function tableExists(db: Database.Database, table: string): boolean {
  const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table) as { name: string } | undefined;
  return !!row;
}

function migrateReceiptsCategory(db: Database.Database): void {
  if (!tableExists(db, 'receipts')) return;
  if (hasColumn(db, 'receipts', 'category')) return;
  db.exec("ALTER TABLE receipts ADD COLUMN category TEXT NOT NULL DEFAULT 'receipt'");
}

/**
 * Run all pending migrations. Idempotent — skips tables that already have FK constraints.
 */
export function runMigrations(db: Database.Database): void {
  // Column migrations that must run before schema indexes
  migrateReceiptsCategory(db);
  if (tableExists(db, 'receipts') && hasColumn(db, 'receipts', 'category')) {
    db.exec('CREATE INDEX IF NOT EXISTS idx_receipts_category ON receipts(category)');
  }

  const needsItems = !hasForeignKey(db, 'items', 'inventory_type_id');
  const needsCategories = !hasForeignKey(db, 'categories', 'inventory_type_id');

  if (!needsItems && !needsCategories) {
    return;
  }

  // Must disable FK checks during table recreation to avoid issues
  // with self-referencing FKs and cross-table references
  db.pragma('foreign_keys = OFF');

  const txn = db.transaction(() => {
    cleanOrphanedRecords(db);

    if (needsItems) {
      migrateItemsTable(db);
    }

    if (needsCategories) {
      migrateCategoriesTable(db);
    }
  });
  txn();

  // Verify integrity after migration
  const check = db.pragma('foreign_key_check') as unknown[];
  if (check.length > 0) {
    console.error('Foreign key violations found after migration:', check);
  }

  db.pragma('foreign_keys = ON');
}
