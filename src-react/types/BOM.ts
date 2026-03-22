export interface BOMItem {
  itemId: number;
  quantity: number;
  notes: string;
}

export interface BOM {
  id: number;
  name: string;
  description: string;
  items: BOMItem[];
  createdAt: string;
  updatedAt: string;
}

export type BOMFormData = Omit<BOM, 'id' | 'createdAt' | 'updatedAt'>;

export interface BOMCostBreakdown {
  bomId: number;
  totalCost: number;
  itemCosts: Array<{
    itemId: number;
    itemName: string;
    unitCost: number;
    quantity: number;
    lineCost: number;
    available: number;
    canBuild: boolean;
  }>;
  canBuildQuantity: number;
}
