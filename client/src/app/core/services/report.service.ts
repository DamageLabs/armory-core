import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PortfolioSnapshot {
  date: string;
  totalValue: number;
  byType?: Record<string, number>;
}

export interface PortfolioSummary {
  currentValue: number;
  periodStartValue: number;
  change: number;
  percentChange: number;
}

export interface PortfolioValueResponse {
  snapshots: PortfolioSnapshot[];
  summary: PortfolioSummary;
}

export interface InsuranceReportItem {
  id: number;
  name: string;
  category: string;
  serialNumber: string | null;
  caliber: string | null;
  manufacturer: string | null;
  condition: string | null;
  unitValue: number;
  value: number;
  location: string;
  createdAt: string;
  photoId: number | null;
}

export interface InsuranceReportResponse {
  generatedAt: string;
  totalItems: number;
  totalValue: number;
  items: InsuranceReportItem[];
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  constructor(private http: HttpClient) {}

  getPortfolioValue(period: string = 'all', groupBy: string = 'none'): Observable<PortfolioValueResponse> {
    const params = new URLSearchParams();
    params.set('period', period);
    params.set('groupBy', groupBy);
    
    return this.http.get<PortfolioValueResponse>(`/api/cost-history/portfolio?${params.toString()}`);
  }

  getInsuranceReport(typeId?: number): Observable<InsuranceReportResponse> {
    const params = new URLSearchParams();
    if (typeId) {
      params.set('typeId', typeId.toString());
    }
    
    return this.http.get<InsuranceReportResponse>(`/api/reports/insurance?${params.toString()}`);
  }
}