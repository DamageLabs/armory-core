import { InventoryType, InventoryTypeFormData, FieldDefinition } from '../types/InventoryType';
import { inventoryTypeRepository, itemRepository } from './db/repositories';

export function getAllTypes(): InventoryType[] {
  return inventoryTypeRepository.getAll();
}

export function getTypeById(id: number): InventoryType | null {
  return inventoryTypeRepository.getById(id);
}

export function createType(data: InventoryTypeFormData): InventoryType {
  if (!data.name.trim()) {
    throw new Error('Inventory type name is required.');
  }

  if (inventoryTypeRepository.nameExists(data.name)) {
    throw new Error(`Inventory type "${data.name}" already exists.`);
  }

  const now = new Date().toISOString();
  return inventoryTypeRepository.create({
    name: data.name.trim(),
    icon: data.icon || '',
    schema: data.schema || [],
    createdAt: now,
    updatedAt: now,
  });
}

export function updateType(id: number, data: Partial<InventoryTypeFormData>): InventoryType | null {
  const existing = inventoryTypeRepository.getById(id);
  if (!existing) {
    return null;
  }

  if (data.name !== undefined) {
    if (!data.name.trim()) {
      throw new Error('Inventory type name is required.');
    }
    if (inventoryTypeRepository.nameExists(data.name, id)) {
      throw new Error(`Inventory type "${data.name}" already exists.`);
    }
  }

  return inventoryTypeRepository.update(id, {
    ...data,
    name: data.name?.trim(),
    updatedAt: new Date().toISOString(),
  } as Partial<InventoryType>);
}

export function deleteType(id: number): boolean {
  const type = inventoryTypeRepository.getById(id);
  if (!type) {
    throw new Error('Inventory type not found.');
  }

  const items = itemRepository.findByType(id);
  if (items.length > 0) {
    throw new Error(
      `Cannot delete "${type.name}" because ${items.length} item(s) are using it. Reassign those items first.`
    );
  }

  return inventoryTypeRepository.delete(id);
}

export function getTypeSchema(id: number): FieldDefinition[] {
  const type = inventoryTypeRepository.getById(id);
  return type?.schema || [];
}

export function validateCustomFields(
  customFields: Record<string, unknown>,
  schema: FieldDefinition[]
): string[] {
  const errors: string[] = [];

  for (const field of schema) {
    const value = customFields[field.key];
    if (field.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field.label} is required.`);
    }
  }

  return errors;
}

// Preset inventory type definitions
export const PRESET_TYPES: InventoryTypeFormData[] = [
  {
    name: 'Electronics',
    icon: 'FaMicrochip',
    schema: [
      { key: 'modelNumber', label: 'Model Number', type: 'text', required: false, placeholder: 'e.g., R3, V3' },
      { key: 'partNumber', label: 'Part Number', type: 'text', required: false, placeholder: 'e.g., 50, 1501' },
      { key: 'vendorName', label: 'Vendor Name', type: 'text', required: false, placeholder: 'e.g., Adafruit, SparkFun' },
      { key: 'vendorUrl', label: 'Vendor URL', type: 'text', required: false, placeholder: 'https://...' },
    ],
  },
  {
    name: 'Firearms',
    icon: 'FaCrosshairs',
    schema: [
      { key: 'serialNumber', label: 'Serial Number', type: 'text', required: true },
      { key: 'caliber', label: 'Caliber', type: 'text', required: true, placeholder: 'e.g., 9mm, .223, 12ga' },
      { key: 'barrelLength', label: 'Barrel Length', type: 'text', required: false, placeholder: 'e.g., 16"' },
      { key: 'action', label: 'Action', type: 'select', required: false, options: ['Semi-Automatic', 'Bolt Action', 'Pump Action', 'Lever Action', 'Revolver', 'Single Shot', 'Full Auto'] },
      { key: 'manufacturer', label: 'Manufacturer', type: 'text', required: false },
      { key: 'fflRequired', label: 'FFL Required', type: 'boolean', required: false },
      { key: 'condition', label: 'Condition', type: 'select', required: false, options: ['New', 'Like New', 'Excellent', 'Very Good', 'Good', 'Fair', 'Poor'] },
    ],
  },
  {
    name: 'Ammunition',
    icon: 'FaShieldAlt',
    schema: [
      { key: 'caliber', label: 'Caliber', type: 'text', required: true, placeholder: 'e.g., 9mm, .223, 12ga' },
      { key: 'grainWeight', label: 'Grain Weight', type: 'number', required: false, placeholder: 'e.g., 115, 55' },
      { key: 'cartridgeType', label: 'Cartridge Type', type: 'select', required: false, options: ['FMJ', 'JHP', 'SP', 'BTHP', 'Buckshot', 'Slug', 'Birdshot', 'Tracer', 'AP'] },
      { key: 'roundCount', label: 'Rounds Per Box', type: 'number', required: false, placeholder: 'e.g., 50, 20' },
      { key: 'casing', label: 'Casing', type: 'select', required: false, options: ['Brass', 'Steel', 'Aluminum', 'Nickel-Plated'] },
      { key: 'manufacturer', label: 'Manufacturer', type: 'text', required: false },
    ],
  },
];
