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

    INSERT INTO items_new (
      id, name, description, quantity, unit_value, value, picture, category, 
      location, barcode, reorder_point, inventory_type_id, custom_fields, 
      parent_item_id, created_at, updated_at
    ) SELECT 
      id, name, description, quantity, unit_value, value, picture, category, 
      location, barcode, reorder_point, inventory_type_id, custom_fields, 
      parent_item_id, created_at, updated_at 
    FROM items;

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
 * Add user_id column to items table for RBAC.
 */
function migrateItemsUserColumn(db: Database.Database): void {
  if (!tableExists(db, 'items')) return;
  if (hasColumn(db, 'items', 'user_id')) return;
  
  // Add the user_id column
  db.exec("ALTER TABLE items ADD COLUMN user_id INTEGER REFERENCES users(id)");
  
  // Only backfill if users table exists (not in test scenarios)
  if (tableExists(db, 'users')) {
    const result = db.prepare('UPDATE items SET user_id = 2 WHERE user_id IS NULL').run();
    console.log(`Backfilled ${result.changes} items to user_id = 2`);
  }
  
  // Add index for performance
  db.exec('CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id)');
}

/**
 * Recalculate value for all Firearms items: value = unitValue + SUM(children.value).
 * Runs on every startup to ensure consistency.
 */
function recalcAllFirearmValues(db: Database.Database): void {
  db.exec(`
    UPDATE items SET value = unit_value + COALESCE(
      (SELECT SUM(c.value) FROM items c WHERE c.parent_item_id = items.id), 0
    )
    WHERE inventory_type_id IN (
      SELECT id FROM inventory_types WHERE name = 'Firearms'
    )
  `);
}

/**
 * Add group property to field definitions in inventory_types schema.
 * This is NON-DESTRUCTIVE — only adds the group property, doesn't remove anything.
 */
export function migrateFieldGroups(db: Database.Database): void {
  const groupAssignments: Record<string, Record<string, string>> = {
    'Firearms': {
      'serialNumber': 'Identification',
      'manufacturer': 'Identification', 
      'condition': 'Identification',
      'caliber': 'Specifications',
      'barrelLength': 'Specifications',
      'action': 'Specifications',
      'frame': 'Specifications',
      'weight': 'Specifications',
      'triggerPull': 'Specifications',
      'fflRequired': 'Compliance'
    },
    'Accessories': {
      'accessoryType': 'General',
      'manufacturer': 'General',
      'condition': 'General',
      'compatibility': 'General',
      'magnification': 'Optics',
      'reticleType': 'Optics',
      'tubeDiameter': 'Optics',
      'objectiveLens': 'Optics',
      'eyeRelief': 'Optics',
      'lumens': 'Illumination',
      'candela': 'Illumination',
      'beamDistance': 'Illumination',
      'runtime': 'Illumination',
      'activationMethod': 'Illumination',
      'mountType': 'Physical',
      'batteryType': 'Physical',
      'weight': 'Physical'
    },
    'Ammunition': {
      'caliber': 'Details',
      'grainWeight': 'Details',
      'cartridgeType': 'Details',
      'roundCount': 'Details',
      'casing': 'Details',
      'manufacturer': 'Details'
    }
  };

  const inventoryTypes = db.prepare('SELECT id, name, schema FROM inventory_types').all() as { id: number; name: string; schema: string }[];

  const updateSchema = db.prepare('UPDATE inventory_types SET schema = ? WHERE id = ?');

  for (const type of inventoryTypes) {
    const assignments = groupAssignments[type.name];
    if (!assignments) continue;

    try {
      const schema = JSON.parse(type.schema) as Array<Record<string, unknown>>;
      let hasChanges = false;

      for (const field of schema) {
        const key = field.key as string;
        if (key && assignments[key] && !field.group) {
          field.group = assignments[key];
          hasChanges = true;
        }
      }

      if (hasChanges) {
        updateSchema.run(JSON.stringify(schema), type.id);
        console.log(`Updated field groups for inventory type: ${type.name}`);
      }
    } catch (error) {
      console.error(`Failed to parse schema for ${type.name}:`, error);
    }
  }
}

/**
 * Run all pending migrations. Idempotent — skips tables that already have FK constraints.
 */
/**
 * Check if a migration has already been applied.
 */
/**
 * Ensure app_metadata table exists for migration tracking.
 */
function ensureMetadataTable(db: Database.Database): void {
  db.exec('CREATE TABLE IF NOT EXISTS app_metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
}

/**
 * Check if a migration has already been applied.
 */
function isMigrationApplied(db: Database.Database, version: string): boolean {
  try {
    ensureMetadataTable(db);
    const row = db.prepare('SELECT value FROM app_metadata WHERE key = ?').get(`migration:${version}`) as { value: string } | undefined;
    return !!row;
  } catch {
    return false;
  }
}

/**
 * Mark a migration as applied.
 */
function markMigrationApplied(db: Database.Database, version: string): void {
  ensureMetadataTable(db);
  db.prepare('INSERT OR REPLACE INTO app_metadata (key, value) VALUES (?, ?)').run(
    `migration:${version}`,
    new Date().toISOString()
  );
}

/**
 * Run a named migration exactly once. Logs clearly on success or error.
 */
function runOnce(db: Database.Database, version: string, name: string, fn: (db: Database.Database) => void): void {
  if (isMigrationApplied(db, version)) return;

  try {
    fn(db);
    markMigrationApplied(db, version);
    console.log(`✅ Migration ${version} applied: ${name}`);
  } catch (error) {
    console.error(`❌ Migration ${version} failed: ${name}`, error);
    throw error; // Don't silently swallow
  }
}

/**
 * Run all pending migrations. Each migration runs exactly once,
 * tracked by version in app_metadata.
 */
export function runMigrations(db: Database.Database): void {
  // v001: Add category column to receipts
  runOnce(db, 'v001', 'Add receipts category column', (db) => {
    migrateReceiptsCategory(db);
    if (tableExists(db, 'receipts') && hasColumn(db, 'receipts', 'category')) {
      db.exec('CREATE INDEX IF NOT EXISTS idx_receipts_category ON receipts(category)');
    }
  });

  // v002: Add user_id column for RBAC
  runOnce(db, 'v002', 'Add user_id column for RBAC', (db) => {
    migrateItemsUserColumn(db);
  });

  // v003: Add FK constraints to items and categories tables
  runOnce(db, 'v003', 'Add FK constraints to items and categories', (db) => {
    const needsItems = !hasForeignKey(db, 'items', 'inventory_type_id');
    const needsCategories = !hasForeignKey(db, 'categories', 'inventory_type_id');

    if (needsItems || needsCategories) {
      db.pragma('foreign_keys = OFF');

      const txn = db.transaction(() => {
        cleanOrphanedRecords(db);
        if (needsItems) migrateItemsTable(db);
        if (needsCategories) migrateCategoriesTable(db);
      });
      txn();

      const check = db.pragma('foreign_key_check') as unknown[];
      if (check.length > 0) {
        console.error('Foreign key violations found after migration:', check);
      }

      db.pragma('foreign_keys = ON');
    }
  });

  // v004: Add field groups to inventory type schemas
  runOnce(db, 'v004', 'Add field groups to schemas', (db) => {
    migrateFieldGroups(db);
  });

  // v005: Add expiration tracking columns
  runOnce(db, 'v005', 'Add expiration tracking columns', (db) => {
    if (!hasColumn(db, 'items', 'expiration_date')) {
      db.exec('ALTER TABLE items ADD COLUMN expiration_date TEXT');
    }
    if (!hasColumn(db, 'items', 'expiration_notes')) {
      db.exec('ALTER TABLE items ADD COLUMN expiration_notes TEXT DEFAULT ""');
    }
  });

  // v006: Create wishlist_items table
  runOnce(db, 'v006', 'Create wishlist_items table', (db) => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS wishlist_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        target_price REAL NOT NULL DEFAULT 0,
        vendor_url TEXT NOT NULL DEFAULT '',
        priority TEXT NOT NULL DEFAULT 'medium',
        inventory_type_id INTEGER DEFAULT 1 REFERENCES inventory_types(id),
        notes TEXT NOT NULL DEFAULT '',
        purchased INTEGER NOT NULL DEFAULT 0,
        purchased_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist_items(user_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_wishlist_priority ON wishlist_items(priority)');
  });

  // v007: Add avatar column to users
  runOnce(db, 'v007', 'Add avatar column to users', (db) => {
    if (tableExists(db, 'users') && !hasColumn(db, 'users', 'avatar_filename')) {
      db.exec("ALTER TABLE users ADD COLUMN avatar_filename TEXT DEFAULT ''");
    }
  });

  // v008: Add is_location column to items
  runOnce(db, 'v008', 'Add is_location column to items', (db) => {
    if (!hasColumn(db, 'items', 'is_location')) {
      db.exec("ALTER TABLE items ADD COLUMN is_location INTEGER NOT NULL DEFAULT 0");
    }
  });

  // Always recalc firearm values to ensure consistency (not a migration, just maintenance)
  recalcAllFirearmValues(db);
}
