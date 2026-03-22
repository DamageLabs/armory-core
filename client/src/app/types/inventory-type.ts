export type FieldType = 'text' | 'number' | 'select' | 'date' | 'boolean';

export interface FieldDefinition {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
  placeholder?: string;
  group?: string; // Defaults to "Details"
}

export interface InventoryType {
  id: number;
  name: string;
  icon: string;
  schema: FieldDefinition[];
  createdAt: string;
  updatedAt: string;
}

export interface InventoryTypeFormData {
  name: string;
  icon: string;
  schema: FieldDefinition[];
}