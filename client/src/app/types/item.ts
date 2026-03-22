export interface Item {
  id: string;
  name: string;
  description: string;
  category_id?: string;
  inventory_type_id?: string;
  custom_fields: Record<string, any>;
  cost?: number;
  quantity: number;
  location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface PaginatedItems {
  data: Item[];
  meta: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

export interface ItemFilters {
  search?: string;
  category_id?: string;
  inventory_type_id?: string;
  page?: number;
  per_page?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}