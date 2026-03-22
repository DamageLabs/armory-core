export interface CostHistoryEntry {
  id: number;
  itemId: number;
  oldValue: number;
  newValue: number;
  source: 'manual' | 'vendor_lookup' | 'import';
  timestamp: string;
}

export interface CostStats {
  min: number;
  max: number;
  avg: number;
  current: number;
  changeCount: number;
  trend: 'up' | 'down' | 'stable';
  firstRecorded: string | null;
  lastChanged: string | null;
}
