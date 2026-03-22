export interface DashboardStats {
  totalItems: number;
  totalValue: number;
  totalQuantity: number;
}

export interface CategoryStats {
  category: string;
  value: number;
  count: number;
}

export interface InventoryTypeStats {
  name: string;
  count: number;
  value: number;
}
