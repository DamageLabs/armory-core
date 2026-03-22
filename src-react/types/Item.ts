export interface Item {
  id: number;
  name: string;
  description: string;
  quantity: number;
  unitValue: number;
  value: number;
  picture: string | null;
  category: string;
  location: string;
  barcode: string;
  reorderPoint: number;
  inventoryTypeId: number;
  customFields: Record<string, unknown>;
  parentItemId: number | null;
  parentName?: string;
  childCount?: number;
  createdAt: string;
  updatedAt: string;
}

export type ItemFormData = Omit<Item, 'id' | 'value' | 'createdAt' | 'updatedAt'>;

/**
 * @deprecated Use categoryService.getCategoryNames() for dynamic categories from the database.
 * This constant is retained only for seed/migration purposes.
 */
export const DEFAULT_CATEGORIES = [
  'Handguns',
  'Rifles',
  'Shotguns',
  'AR Platform',
  'AK Platform',
  'Bolt Action',
  'Optics',
  'Lights',
  'Magazines',
  'Holsters',
  'Suppressors & Muzzle Devices',
  'Rimfire',
  'Centerfire Pistol',
  'Centerfire Rifle',
  'Shotshell',
  'Cleaning & Maintenance',
  'Cases & Bags',
] as const;
