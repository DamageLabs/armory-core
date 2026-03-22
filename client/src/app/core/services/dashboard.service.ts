import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardStats, CategoryValue } from '../../types/dashboard';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = '/api/dashboard';

  constructor(private http: HttpClient) {}

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats`);
  }

  getCategoryValues(): Observable<CategoryValue[]> {
    return this.http.get<CategoryValue[]>(`${this.apiUrl}/category-values`);
  }
}