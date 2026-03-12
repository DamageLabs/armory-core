export interface MaintenanceLog {
  id: number;
  itemId: number;
  userId: number;
  userEmail: string;
  serviceType: string;
  description: string;
  roundsFired: number;
  serviceProvider: string;
  cost: number;
  performedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceSummary {
  totalRounds: number;
  totalCost: number;
  totalEntries: number;
  lastServiceDate: string | null;
  typeCounts: { type: string; count: number }[];
}

export interface MaintenanceLogInput {
  serviceType: string;
  description: string;
  roundsFired: number;
  serviceProvider: string;
  cost: number;
  performedAt: string;
}
