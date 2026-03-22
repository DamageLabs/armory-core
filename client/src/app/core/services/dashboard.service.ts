import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DashboardStats, CategoryStats, InventoryTypeStats, ValueByTypeStats, TopValuedItem, CategoryBreakdown } from '../../types/dashboard';
import { Item, PaginatedItems } from '../../types/item';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(private http: HttpClient) {}

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>('/api/items/stats');
  }

  /**
   * Get all items and group by category for chart data
   */
  getCategoryStats(): Observable<CategoryStats[]> {
    return this.http.get<PaginatedItems>('/api/items?pageSize=1000').pipe(
      map(response => {
        const categoryMap = new Map<string, { value: number; count: number }>();
        
        response.data.forEach(item => {
          const category = item.category || 'Uncategorized';
          const existing = categoryMap.get(category) || { value: 0, count: 0 };
          categoryMap.set(category, {
            value: existing.value + (item.value || 0),
            count: existing.count + 1
          });
        });

        return Array.from(categoryMap.entries()).map(([category, data]) => ({
          category,
          value: data.value,
          count: data.count
        }));
      })
    );
  }

  /**
   * Get all items and group by inventory type for chart data
   */
  getInventoryTypeStats(): Observable<InventoryTypeStats[]> {
    return this.http.get<PaginatedItems>('/api/items?pageSize=1000').pipe(
      map(response => {
        const typeMap = new Map<number, { name: string; count: number; value: number }>();
        
        response.data.forEach(item => {
          const typeId = item.inventoryTypeId || 0;
          const existing = typeMap.get(typeId) || { name: this.getTypeName(typeId), count: 0, value: 0 };
          typeMap.set(typeId, {
            name: existing.name,
            count: existing.count + 1,
            value: existing.value + (item.value || 0)
          });
        });

        return Array.from(typeMap.values());
      })
    );
  }

  /**
   * Get recent items (last 10 added)
   */
  getRecentItems(): Observable<Item[]> {
    return this.http.get<PaginatedItems>('/api/items?pageSize=10&sortBy=createdAt&sortDir=desc').pipe(
      map(response => response.data)
    );
  }

  /**
   * Get value by inventory type for chart data
   */
  getValueByTypeStats(): Observable<ValueByTypeStats[]> {
    return this.http.get<PaginatedItems>('/api/items?pageSize=1000').pipe(
      map(response => {
        const typeMap = new Map<number, { name: string; value: number; count: number }>();
        
        response.data.forEach(item => {
          const typeId = item.inventoryTypeId || 0;
          const existing = typeMap.get(typeId) || { name: this.getTypeName(typeId), value: 0, count: 0 };
          typeMap.set(typeId, {
            name: existing.name,
            value: existing.value + (item.value || 0),
            count: existing.count + 1
          });
        });

        return Array.from(typeMap.values());
      })
    );
  }

  /**
   * Get top 5 most valuable items
   */
  getTopValuedItems(): Observable<TopValuedItem[]> {
    return this.http.get<PaginatedItems>('/api/items?pageSize=1000').pipe(
      map(response => {
        return response.data
          .sort((a, b) => (b.value || 0) - (a.value || 0))
          .slice(0, 5)
          .map(item => ({
            name: item.name,
            value: item.value || 0,
            category: item.category
          }));
      })
    );
  }

  /**
   * Get category breakdown for table
   */
  getCategoryBreakdown(): Observable<CategoryBreakdown[]> {
    return this.http.get<PaginatedItems>('/api/items?pageSize=1000').pipe(
      map(response => {
        const categoryMap = new Map<string, { count: number; totalValue: number }>();
        
        response.data.forEach(item => {
          const category = item.category || 'Uncategorized';
          const existing = categoryMap.get(category) || { count: 0, totalValue: 0 };
          categoryMap.set(category, {
            count: existing.count + 1,
            totalValue: existing.totalValue + (item.value || 0)
          });
        });

        return Array.from(categoryMap.entries())
          .map(([category, data]) => ({
            category,
            itemCount: data.count,
            totalValue: data.totalValue,
            avgValue: data.totalValue / data.count
          }))
          .sort((a, b) => b.totalValue - a.totalValue);
      })
    );
  }

  private getTypeName(typeId: number): string {
    switch (typeId) {
      case 1: return 'Firearms';
      case 2: return 'Accessories';
      case 3: return 'Ammunition';
      default: return 'Other';
    }
  }
}
