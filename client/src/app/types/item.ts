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
  expirationDate?: string;
  expirationNotes?: string;
  expirationStatus?: 'expired' | 'warning' | 'good';
  isLocation?: boolean;
  // Additional fields from API joins
  child_count?: number;
  parent_name?: string;
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
  location?: string;
  typeId?: number;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}
