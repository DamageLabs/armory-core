export type FieldType = 'text' | 'number' | 'select' | 'date' | 'boolean';

export interface FieldDefinition {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
  placeholder?: string;
  group?: string;  // NEW — defaults to "Details"
}

export interface InventoryType {
  id: number;
  name: string;
  icon: string;
  schema: FieldDefinition[];
  createdAt: string;
  updatedAt: string;
}

export type InventoryTypeFormData = Pick<InventoryType, 'name' | 'icon' | 'schema'>;
