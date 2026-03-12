import { api } from './api';
import { MaintenanceLog, MaintenanceSummary, MaintenanceLogInput } from '../types/MaintenanceLog';

interface PaginatedResponse {
  data: MaintenanceLog[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface MaintenanceReportData {
  totals: {
    totalRounds: number;
    totalCost: number;
    totalEntries: number;
    firearmsServiced: number;
  };
  perFirearm: {
    itemId: number;
    itemName: string;
    totalRounds: number;
    totalCost: number;
    entryCount: number;
    lastServiceDate: string;
  }[];
  byType: {
    type: string;
    count: number;
    totalCost: number;
  }[];
  monthly: {
    month: string;
    totalCost: number;
    totalRounds: number;
    entryCount: number;
  }[];
  allLogs: {
    id: number;
    itemName: string;
    serviceType: string;
    description: string;
    roundsFired: number;
    serviceProvider: string;
    cost: number;
    performedAt: string;
    userEmail: string;
    createdAt: string;
  }[];
}

export async function getReport(): Promise<MaintenanceReportData> {
  return api.get<MaintenanceReportData>('/maintenance/report');
}

export async function getLogs(itemId: number, page = 1, pageSize = 20, type?: string): Promise<PaginatedResponse> {
  const typeParam = type ? `&type=${encodeURIComponent(type)}` : '';
  return api.get<PaginatedResponse>(`/maintenance/${itemId}/logs?page=${page}&pageSize=${pageSize}${typeParam}`);
}

export async function getSummary(itemId: number): Promise<MaintenanceSummary> {
  return api.get<MaintenanceSummary>(`/maintenance/${itemId}/summary`);
}

export async function createLog(itemId: number, data: MaintenanceLogInput): Promise<MaintenanceLog> {
  return api.post<MaintenanceLog>(`/maintenance/${itemId}/logs`, data);
}

export async function updateLog(logId: number, data: Partial<MaintenanceLogInput>): Promise<MaintenanceLog> {
  return api.put<MaintenanceLog>(`/maintenance/${logId}`, data);
}

export async function deleteLog(logId: number): Promise<void> {
  await api.delete(`/maintenance/${logId}`);
}
