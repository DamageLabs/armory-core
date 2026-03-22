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

export interface ValueByTypeStats {
  name: string;
  value: number;
  count: number;
}

export interface TopValuedItem {
  name: string;
  value: number;
  category: string;
}

export interface CategoryBreakdown {
  category: string;
  itemCount: number;
  totalValue: number;
  avgValue: number;
}
