import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MaintenanceLog {
  id: number;
  itemId: number;
  serviceType: 'Cleaning' | 'Inspection' | 'Repair' | 'Modification' | 'Other';
  description: string;
  roundsFired: number | null;
  serviceProvider: string | null;
  cost: number | null;
  performedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceSummary {
  totalRounds: number;
  totalCost: number;
  lastServiceDate: string | null;
}

export interface CreateMaintenanceRequest {
  serviceType: MaintenanceLog['serviceType'];
  description: string;
  roundsFired?: number | null;
  serviceProvider?: string | null;
  cost?: number | null;
  performedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class MaintenanceService {
  private apiUrl = '/api/maintenance';

  constructor(private http: HttpClient) {}

  getMaintenanceLogs(itemId: number): Observable<MaintenanceLog[]> {
    return this.http.get<MaintenanceLog[]>(`${this.apiUrl}/${itemId}/logs`);
  }

  getMaintenanceSummary(itemId: number): Observable<MaintenanceSummary> {
    return this.http.get<MaintenanceSummary>(`${this.apiUrl}/${itemId}/summary`);
  }

  createMaintenanceLog(itemId: number, data: CreateMaintenanceRequest): Observable<MaintenanceLog> {
    return this.http.post<MaintenanceLog>(`${this.apiUrl}/${itemId}/logs`, data);
  }

  updateMaintenanceLog(logId: number, data: Partial<CreateMaintenanceRequest>): Observable<MaintenanceLog> {
    return this.http.put<MaintenanceLog>(`${this.apiUrl}/${logId}`, data);
  }

  deleteMaintenanceLog(logId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${logId}`);
  }
}