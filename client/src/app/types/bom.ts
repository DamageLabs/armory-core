export interface BomItem {
  itemId: number;
  quantity: number;
  // Additional fields populated when fetching BOMs
  itemName?: string;
  unitValue?: number;
  totalValue?: number;
}

export interface Bom {
  id: number;
  name: string;
  description: string;
  items: BomItem[];
  createdAt: string;
  updatedAt: string;
  // Additional calculated fields
  totalCost?: number;
  itemCount?: number;
}

export interface CreateBomRequest {
  name: string;
  description: string;
  items: BomItem[];
}

export interface UpdateBomRequest {
  name: string;
  description: string;
  items: BomItem[];
}

export interface BomCostResponse {
  totalCost: number;
  itemCosts: Array<{
    itemId: number;
    itemName: string;
    quantity: number;
    unitValue: number;
    totalValue: number;
  }>;
}