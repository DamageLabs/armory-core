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
  customFields: Record<string, any>;
  parentItemId: number | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedItems {
  data: Item[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface ItemFilters {
  search?: string;
  category?: string;
  typeId?: number;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}
