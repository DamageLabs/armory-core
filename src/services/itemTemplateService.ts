import { ItemTemplate, ItemTemplateFormData } from '../types/ItemTemplate';
import { itemTemplateRepository } from './db/repositories';

export function getAllTemplates(): ItemTemplate[] {
  return itemTemplateRepository.getAll();
}

export function getTemplateById(id: number): ItemTemplate | null {
  return itemTemplateRepository.getById(id);
}

export function getTemplatesForCategory(category: string): ItemTemplate[] {
  return itemTemplateRepository.findByCategory(category);
}

export function createTemplate(data: ItemTemplateFormData): ItemTemplate {
  return itemTemplateRepository.create({
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export function updateTemplate(id: number, data: Partial<ItemTemplateFormData>): ItemTemplate | null {
  const existing = itemTemplateRepository.getById(id);
  if (!existing) {
    return null;
  }

  return itemTemplateRepository.update(id, {
    ...data,
    updatedAt: new Date().toISOString(),
  } as Partial<ItemTemplate>);
}

export function deleteTemplate(id: number): boolean {
  return itemTemplateRepository.delete(id);
}

export function createTemplateFromItem(
  name: string,
  item: {
    category: string;
    location?: string;
    reorderPoint?: number;
    description?: string;
    customFields?: Record<string, unknown>;
  }
): ItemTemplate {
  return createTemplate({
    name,
    category: item.category,
    defaultFields: {
      vendorName: (item.customFields?.vendorName as string) || '',
      vendorUrl: (item.customFields?.vendorUrl as string) || '',
      location: item.location || '',
      reorderPoint: item.reorderPoint || 0,
      description: item.description || '',
    },
  });
}
