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

const OPTICS_SCHEMA = JSON.stringify([
  { key: 'magnification', label: 'Magnification', type: 'text', required: false, placeholder: 'e.g., 1x, 1-6x, 3.25 MOA dot' },
  { key: 'reticleType', label: 'Reticle Type', type: 'select', required: false, options: ['Red Dot', 'Green Dot', 'Holographic', 'Crosshair', 'BDC', 'ACSS', 'MOA', 'MRAD', 'Duplex'] },
  { key: 'tubeDiameter', label: 'Tube Diameter', type: 'text', required: false, placeholder: 'e.g., N/A, 30mm, 34mm' },
  { key: 'mountType', label: 'Mount Type', type: 'text', required: false, placeholder: 'e.g., RMR footprint, Picatinny' },
  { key: 'eyeRelief', label: 'Eye Relief', type: 'text', required: false, placeholder: 'e.g., Unlimited, 3.5"' },
  { key: 'objectiveLens', label: 'Objective Lens', type: 'text', required: false, placeholder: 'e.g., 20mm' },
  { key: 'batteryType', label: 'Battery Type', type: 'text', required: false, placeholder: 'e.g., CR2032' },
  { key: 'weight', label: 'Weight', type: 'text', required: false, placeholder: 'e.g., 1.2 oz' },
  { key: 'manufacturer', label: 'Manufacturer', type: 'text', required: false },
]);

const LIGHTS_SCHEMA = JSON.stringify([
  { key: 'lumens', label: 'Lumens', type: 'text', required: false, placeholder: 'e.g., 1000, 2000' },
  { key: 'candela', label: 'Candela', type: 'text', required: false, placeholder: 'e.g., 27,600' },
  { key: 'beamDistance', label: 'Beam Distance', type: 'text', required: false, placeholder: 'e.g., 332m' },
  { key: 'batteryType', label: 'Battery Type', type: 'text', required: false, placeholder: 'e.g., CR123A, 18650' },
  { key: 'runtime', label: 'Runtime', type: 'text', required: false, placeholder: 'e.g., 1.5 hrs high' },
  { key: 'mountType', label: 'Mount Type', type: 'text', required: false, placeholder: 'e.g., Picatinny, M-LOK' },
  { key: 'activationMethod', label: 'Activation', type: 'select', required: false, options: ['Momentary', 'Constant', 'Strobe', 'Momentary/Constant', 'Programmable'] },
  { key: 'weight', label: 'Weight', type: 'text', required: false, placeholder: 'e.g., 4.0 oz' },
  { key: 'manufacturer', label: 'Manufacturer', type: 'text', required: false },
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
  { name: 'Ammunition', icon: 'FaShieldAlt', schema: AMMUNITION_SCHEMA },
  { name: 'Optics', icon: 'FaBullseye', schema: OPTICS_SCHEMA },
  { name: 'Lights', icon: 'FaLightbulb', schema: LIGHTS_SCHEMA },
];

const CATEGORY_PRESETS: Record<string, string[]> = {
  Firearms: ['Handguns', 'Rifles', 'Shotguns', 'Accessories', 'Holsters & Cases'],
  Ammunition: ['Rimfire', 'Centerfire Pistol', 'Centerfire Rifle', 'Shotshell', 'Specialty'],
  Optics: ['Red Dots', 'Scopes', 'Magnifiers', 'Mounts & Rings', 'Accessories'],
  Lights: ['Weapon Lights', 'Handheld', 'Headlamps', 'Laser/Light Combos', 'Accessories'],
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
    ON CONFLICT(name) DO UPDATE SET schema = excluded.schema, updated_at = excluded.updated_at
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

export function seedDatabase(): void {
  ensureParentItemIdColumn();
  ensureInventoryTypes();
  ensureCategories();
}
