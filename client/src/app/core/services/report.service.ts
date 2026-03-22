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
}