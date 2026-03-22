import Papa from 'papaparse';
import { ItemFormData } from '../types/Item';

export interface RestoreItem extends ItemFormData {
  oldId?: number;
  valid: boolean;
  errors: string[];
}

const BACKUP_CSV_FIELDS: Record<string, keyof ItemFormData | 'id'> = {
  'ID': 'id' as keyof ItemFormData,
  'Name': 'name',
  'Description': 'description',
  'Quantity': 'quantity',
  'Unit Value': 'unitValue',
  'Category': 'category',
  'Location': 'location',
  'Inventory Type ID': 'inventoryTypeId',
  'Parent Item ID': 'parentItemId',
  'Barcode': 'barcode',
  'Reorder Point': 'reorderPoint',
};

const KNOWN_HEADERS = new Set([
  ...Object.keys(BACKUP_CSV_FIELDS),
  'Total Value', 'Created At', 'Updated At',
]);

export function parseBackupJSON(content: string): RestoreItem[] {
  let parsed: unknown[];
  try {
    parsed = JSON.parse(content);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  return parsed.map((raw) => {
    const item = raw as Record<string, unknown>;
    return toRestoreItem(item);
  });
}

export function parseBackupCSV(content: string): RestoreItem[] {
  const result = Papa.parse(content, { header: true, skipEmptyLines: true });
  if (!result.data || result.data.length === 0) return [];

  const headers = result.meta.fields || [];
  const customFieldHeaders = headers.filter((h) => !KNOWN_HEADERS.has(h));

  return (result.data as Record<string, string>[]).map((row) => {
    const item: Record<string, unknown> = {};

    for (const [header, field] of Object.entries(BACKUP_CSV_FIELDS)) {
      if (row[header] !== undefined && row[header] !== '') {
        item[field] = row[header];
      }
    }

    const customFields: Record<string, unknown> = {};
    for (const header of customFieldHeaders) {
      if (row[header] !== undefined && row[header] !== '') {
        customFields[header] = row[header];
      }
    }
    item.customFields = customFields;

    return toRestoreItem(item);
  });
}

function toRestoreItem(item: Record<string, unknown>): RestoreItem {
  const oldId = item.id ? Number(item.id) : undefined;
  const parentItemId = item.parentItemId ? Number(item.parentItemId) : null;

  return {
    oldId,
    name: String(item.name || ''),
    description: String(item.description || ''),
    quantity: Number(item.quantity) || 0,
    unitValue: Number(item.unitValue) || 0,
    picture: (item.picture as string) || null,
    category: String(item.category || ''),
    location: String(item.location || ''),
    barcode: String(item.barcode || ''),
    reorderPoint: Number(item.reorderPoint) || 0,
    inventoryTypeId: Number(item.inventoryTypeId) || 1,
    customFields: (item.customFields as Record<string, unknown>) || {},
    parentItemId,
    valid: true,
    errors: [],
  };
}

export function validateRestoreItems(
  items: RestoreItem[],
  validTypeIds: number[],
): RestoreItem[] {
  return items.map((item) => {
    const errors: string[] = [];
    if (!item.name || item.name.trim() === '') {
      errors.push('Name is required');
    }
    if (!validTypeIds.includes(item.inventoryTypeId)) {
      errors.push(`Invalid inventory type ID: ${item.inventoryTypeId}`);
    }
    return { ...item, valid: errors.length === 0, errors };
  });
}
