export interface DashboardStats {
  total_items: number;
  total_value: number;
  total_categories: number;
  recent_items: number;
}

export interface CategoryValue {
  category: string;
  value: number;
  count: number;
}