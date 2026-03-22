export interface Category {
  id: number;
  name: string;
  sortOrder: number;
  inventoryTypeId: number;
  createdAt: string;
  updatedAt: string;
}

export type CategoryFormData = Pick<Category, 'name' | 'sortOrder' | 'inventoryTypeId'>;
