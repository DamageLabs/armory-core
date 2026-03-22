import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface StockHistoryEntry {
  id: number;
  itemId: number;
  itemName: string;
  changeType: 'created' | 'updated' | 'deleted' | 'quantity_change' | 'value_change' | 'category_change';
  previousQuantity: number | null;
  newQuantity: number | null;
  previousValue: number | null;
  newValue: number | null;
  previousCategory: string | null;
  newCategory: string | null;
  notes: string | null;
  userId: number;
  userEmail: string;
  timestamp: string;
}

export interface StockHistoryStats {
  totalChanges: number;
  changesByType: Record<string, number>;
  recentChanges: number;
}

export interface StockHistoryFilters {
  page?: number;
  pageSize?: number;
  itemId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class StockHistoryService {
  private apiUrl = '/api/stock-history';

  constructor(private http: HttpClient) {}

  getHistory(filters?: StockHistoryFilters): Observable<StockHistoryEntry[]> {
    let params = new HttpParams();
    
    if (filters?.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters?.pageSize) {
      params = params.set('pageSize', filters.pageSize.toString());
    }
    if (filters?.itemId) {
      params = params.set('itemId', filters.itemId.toString());
    }

    return this.http.get<StockHistoryEntry[]>(this.apiUrl, { params });
  }

  getItemHistory(itemId: number): Observable<StockHistoryEntry[]> {
    return this.http.get<StockHistoryEntry[]>(`${this.apiUrl}/item/${itemId}`);
  }

  getRecentHistory(): Observable<StockHistoryEntry[]> {
    return this.http.get<StockHistoryEntry[]>(`${this.apiUrl}/recent`);
  }

  getStats(): Observable<StockHistoryStats> {
    return this.http.get<StockHistoryStats>(`${this.apiUrl}/stats`);
  }
}