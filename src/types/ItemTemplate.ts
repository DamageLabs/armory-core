export interface ItemTemplateDefaultFields {
  vendorName?: string;
  vendorUrl?: string;
  location?: string;
  reorderPoint?: number;
  description?: string;
  [key: string]: unknown;
}

export interface ItemTemplate {
  id: number;
  name: string;
  category: string;
  defaultFields: ItemTemplateDefaultFields;
  createdAt: string;
  updatedAt: string;
}

export type ItemTemplateFormData = Omit<ItemTemplate, 'id' | 'createdAt' | 'updatedAt'>;
