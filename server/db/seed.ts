import { getDatabase } from './index';

const FIREARMS_SCHEMA = JSON.stringify([
  { key: 'serialNumber', label: 'Serial Number', type: 'text', required: true },
  { key: 'caliber', label: 'Caliber', type: 'text', required: true, placeholder: 'e.g., 9mm, .223, 12ga' },
  { key: 'barrelLength', label: 'Barrel Length', type: 'text', required: false, placeholder: 'e.g., 16"' },
  { key: 'action', label: 'Action', type: 'select', required: false, options: ['Semi-Automatic', 'Bolt Action', 'Pump Action', 'Lever Action', 'Revolver', 'Single Shot', 'Full Auto'] },
  { key: 'manufacturer', label: 'Manufacturer', type: 'text', required: false },
  { key: 'triggerPull', label: 'Trigger Pull', type: 'text', required: false, placeholder: 'e.g., 5.5 lbs' },
  { key: 'frame', label: 'Frame', type: 'select', required: false, options: ['Polymer', 'Aluminum', 'Steel', 'Titanium', 'Alloy'] },
  { key: 'weight', label: 'Weight', type: 'text', required: false, placeholder: 'e.g., 30 oz' },
  { key: 'fflRequired', label: 'FFL Required', type: 'boolean', required: false },
  { key: 'condition', label: 'Condition', type: 'select', required: false, options: ['New', 'Like New', 'Excellent', 'Very Good', 'Good', 'Fair', 'Poor'] },
]);

const ACCESSORIES_SCHEMA = JSON.stringify([
  { key: 'accessoryType', label: 'Accessory Type', type: 'select', required: false, options: ['Optic', 'Light', 'Laser', 'Grip', 'Magazine', 'Holster', 'Case', 'Mount', 'Suppressor', 'Bipod', 'Sling', 'Trigger', 'Muzzle Device', 'Other'] },
  { key: 'magnification', label: 'Magnification', type: 'text', required: false, placeholder: 'e.g., 1x, 1-6x, 3.25 MOA dot' },
  { key: 'reticleType', label: 'Reticle Type', type: 'select', required: false, options: ['Red Dot', 'Green Dot', 'Holographic', 'Crosshair', 'BDC', 'ACSS', 'MOA', 'MRAD', 'Duplex'] },
  { key: 'tubeDiameter', label: 'Tube Diameter', type: 'text', required: false, placeholder: 'e.g., N/A, 30mm, 34mm' },
  { key: 'objectiveLens', label: 'Objective Lens', type: 'text', required: false, placeholder: 'e.g., 20mm' },
  { key: 'eyeRelief', label: 'Eye Relief', type: 'text', required: false, placeholder: 'e.g., Unlimited, 3.5"' },
  { key: 'lumens', label: 'Lumens', type: 'text', required: false, placeholder: 'e.g., 1000, 2000' },
  { key: 'candela', label: 'Candela', type: 'text', required: false, placeholder: 'e.g., 27,600' },
  { key: 'beamDistance', label: 'Beam Distance', type: 'text', required: false, placeholder: 'e.g., 332m' },
  { key: 'runtime', label: 'Runtime', type: 'text', required: false, placeholder: 'e.g., 1.5 hrs high' },
  { key: 'activationMethod', label: 'Activation', type: 'select', required: false, options: ['Momentary', 'Constant', 'Strobe', 'Momentary/Constant', 'Programmable'] },
  { key: 'mountType', label: 'Mount Type', type: 'text', required: false, placeholder: 'e.g., Picatinny, M-LOK, RMR footprint' },
  { key: 'batteryType', label: 'Battery Type', type: 'text', required: false, placeholder: 'e.g., CR2032, CR123A' },
  { key: 'weight', label: 'Weight', type: 'text', required: false, placeholder: 'e.g., 1.2 oz' },
  { key: 'manufacturer', label: 'Manufacturer', type: 'text', required: false },
  { key: 'compatibility', label: 'Compatibility', type: 'text', required: false, placeholder: 'e.g., Glock MOS, Picatinny rail' },
  { key: 'condition', label: 'Condition', type: 'select', required: false, options: ['New', 'Like New', 'Excellent', 'Very Good', 'Good', 'Fair', 'Poor'] },
]);

const AMMUNITION_SCHEMA = JSON.stringify([
  { key: 'caliber', label: 'Caliber', type: 'text', required: true, placeholder: 'e.g., 9mm, .223, 12ga' },
  { key: 'grainWeight', label: 'Grain Weight', type: 'number', required: false, placeholder: 'e.g., 115, 55' },
  { key: 'cartridgeType', label: 'Cartridge Type', type: 'select', required: false, options: ['FMJ', 'JHP', 'SP', 'BTHP', 'Buckshot', 'Slug', 'Birdshot', 'Tracer', 'AP'] },
  { key: 'roundCount', label: 'Rounds Per Box', type: 'number', required: false, placeholder: 'e.g., 50, 20' },
  { key: 'casing', label: 'Casing', type: 'select', required: false, options: ['Brass', 'Steel', 'Aluminum', 'Nickel-Plated'] },
  { key: 'manufacturer', label: 'Manufacturer', type: 'text', required: false },
]);

const INVENTORY_TYPES = [
  { name: 'Firearms', icon: 'FaCrosshairs', schema: FIREARMS_SCHEMA },
  { name: 'Accessories', icon: 'FaToolbox', schema: ACCESSORIES_SCHEMA },
  { name: 'Ammunition', icon: 'FaShieldAlt', schema: AMMUNITION_SCHEMA },
];

const CATEGORY_PRESETS: Record<string, string[]> = {
  Firearms: ['Handguns', 'Rifles', 'Shotguns', 'Pistol Caliber Carbines', 'AR Platform', 'AK Platform', 'Bolt Action', 'Lever Action', 'Other'],
  Accessories: ['Optics', 'Lights', 'Lasers', 'Grips & Foregrips', 'Magazines', 'Holsters', 'Cases & Bags', 'Mounts & Rings', 'Suppressors & Muzzle Devices', 'Bipods & Supports', 'Slings', 'Triggers & Fire Control', 'Stocks & Braces', 'Barrels & Handguards', 'Cleaning & Maintenance', 'Other'],
  Ammunition: ['Rimfire', 'Centerfire Pistol', 'Centerfire Rifle', 'Shotshell', 'Specialty', 'Reloading Components'],
};

function ensureParentItemIdColumn(): void {
  const db = getDatabase();
  try {
    db.exec('ALTER TABLE items ADD COLUMN parent_item_id INTEGER REFERENCES items(id) ON DELETE SET NULL');
    db.exec('CREATE INDEX IF NOT EXISTS idx_items_parent_id ON items(parent_item_id)');
  } catch {
    // Column already exists — ignore
  }
}

function ensureInventoryTypes(): void {
  const db = getDatabase();
  const now = new Date().toISOString();
  const upsert = db.prepare(`
    INSERT INTO inventory_types (name, icon, schema, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(name) DO UPDATE SET schema = excluded.schema, icon = excluded.icon, updated_at = excluded.updated_at
  `);
  for (const t of INVENTORY_TYPES) {
    upsert.run(t.name, t.icon, t.schema, now, now);
  }
}

function ensureCategories(): void {
  const db = getDatabase();
  const now = new Date().toISOString();
  const upsert = db.prepare(`
    INSERT OR IGNORE INTO categories (name, sort_order, inventory_type_id, created_at, updated_at)
    SELECT ?, ?, id, ?, ? FROM inventory_types WHERE name = ?
  `);
  for (const [typeName, cats] of Object.entries(CATEGORY_PRESETS)) {
    cats.forEach((cat, idx) => {
      upsert.run(cat, idx, now, now, typeName);
    });
  }
}

function migrateOpticsAndLights(): void {
  const db = getDatabase();
  const accessoriesType = db.prepare("SELECT id FROM inventory_types WHERE name = 'Accessories'").get() as { id: number } | undefined;
  if (!accessoriesType) return;

  const accessoriesId = accessoriesType.id;

  const oldTypes = db.prepare("SELECT id, name FROM inventory_types WHERE name IN ('Optics', 'Lights', 'Electronics')").all() as { id: number; name: string }[];
  if (oldTypes.length === 0) return;

  const oldIds = oldTypes.map((t) => t.id);

  const txn = db.transaction(() => {
    // Reassign items from old types to Accessories
    const updateItems = db.prepare(`UPDATE items SET inventory_type_id = ? WHERE inventory_type_id = ?`);
    for (const oldId of oldIds) {
      updateItems.run(accessoriesId, oldId);
    }

    // Delete old-type categories that would conflict when merged into Accessories
    // (duplicates across old types or with existing Accessories categories)
    const placeholders = oldIds.map(() => '?').join(',');
    db.prepare(`
      DELETE FROM categories
      WHERE inventory_type_id IN (${placeholders})
        AND name IN (SELECT name FROM categories WHERE inventory_type_id = ?)
    `).run(...oldIds, accessoriesId);

    // Among the remaining old-type categories, keep only one per name (delete duplicates)
    db.prepare(`
      DELETE FROM categories
      WHERE inventory_type_id IN (${placeholders})
        AND id NOT IN (
          SELECT MIN(id) FROM categories
          WHERE inventory_type_id IN (${placeholders})
          GROUP BY name
        )
    `).run(...oldIds, ...oldIds);

    // Reassign remaining categories from old types to Accessories
    const updateCats = db.prepare(`UPDATE categories SET inventory_type_id = ? WHERE inventory_type_id = ?`);
    for (const oldId of oldIds) {
      updateCats.run(accessoriesId, oldId);
    }

    // Delete old types
    const deleteType = db.prepare(`DELETE FROM inventory_types WHERE id = ?`);
    for (const oldId of oldIds) {
      deleteType.run(oldId);
    }
  });
  txn();
}

export function seedDatabase(): void {
  ensureParentItemIdColumn();
  ensureInventoryTypes();
  migrateOpticsAndLights();
  ensureCategories();
}
