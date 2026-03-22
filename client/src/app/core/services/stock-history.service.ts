import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface StockHistoryEntry {
  id: number;
  item_id: number;
  change_type: string;
  old_quantity: number;
  new_quantity: number;
  change_amount: number;
  reason: string | null;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class StockHistoryService {
  private apiUrl = '/api/stock-history';

  constructor(private http: HttpClient) {}

  getItemHistory(itemId: number): Observable<StockHistoryEntry[]> {
    return this.http.get<StockHistoryEntry[]>(`${this.apiUrl}/item/${itemId}`);
  }

  getRecentHistory(limit: number = 10): Observable<StockHistoryEntry[]> {
    return this.http.get<StockHistoryEntry[]>(`${this.apiUrl}/recent?limit=${limit}`);
  }
}