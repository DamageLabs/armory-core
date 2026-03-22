export type StockChangeType = 'created' | 'updated' | 'deleted' | 'adjusted' | 'category_changed';

export interface StockHistoryEntry {
  id: number;
  itemId: number;
  itemName: string;
  changeType: StockChangeType;
  previousQuantity: number | null;
  newQuantity: number | null;
  previousValue: number | null;
  newValue: number | null;
  previousCategory: string | null;
  newCategory: string | null;
  notes: string;
  userId: number | null;
  userEmail: string | null;
  timestamp: string;
}

export interface StockHistoryFilter {
  itemId?: number;
  changeType?: StockChangeType;
  startDate?: string;
  endDate?: string;
  userId?: number;
}
