export interface Category {
  id: number;
  name: string;
  sortOrder: number;
  inventoryTypeId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryFormData {
  name: string;
  inventoryTypeId: number;
  sortOrder?: number;
}

export interface CategoriesGrouped {
  [inventoryTypeName: string]: Category[];
}