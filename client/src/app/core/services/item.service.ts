import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Item, PaginatedItems, ItemFilters } from '../../types/item';
import { InventoryTypeService } from './inventory-type.service';

@Injectable({
  providedIn: 'root'
})
export class ItemService {
  private apiUrl = '/api/items';
  private inventoryTypeService = inject(InventoryTypeService);

  constructor(private http: HttpClient) {}

  getItems(filters: ItemFilters = {}): Observable<PaginatedItems> {
    let params = new HttpParams();
    
    if (filters.search) params = params.set('search', filters.search);
    if (filters.category) params = params.set('category', filters.category);
    if (filters.typeId) params = params.set('typeId', filters.typeId.toString());
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.pageSize) params = params.set('pageSize', filters.pageSize.toString());
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortDir) params = params.set('sortDir', filters.sortDir);

    return this.http.get<PaginatedItems>(this.apiUrl, { params });
  }

  getItem(id: number): Observable<Item> {
    return this.http.get<Item>(`${this.apiUrl}/${id}`);
  }

  createItem(item: Partial<Item>): Observable<Item> {
    return this.http.post<Item>(this.apiUrl, item);
  }

  updateItem(id: number, item: Partial<Item>): Observable<Item> {
    return this.http.put<Item>(`${this.apiUrl}/${id}`, item);
  }

  deleteItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getChildren(id: number): Observable<Item[]> {
    return this.http.get<Item[]>(`${this.apiUrl}/${id}/children`);
  }

  getFirearms(): Observable<Item[]> {
    // Get firearms (inventoryTypeId = 1) for parent selection
    const params = new HttpParams()
      .set('typeId', '1')
      .set('pageSize', '1000'); // Get all firearms for selection

    return this.http.get<PaginatedItems>(this.apiUrl, { params })
      .pipe(
        map(response => response.data)
      );
  }

  getStats(): Observable<{ totalItems: number; totalValue: number; totalQuantity: number }> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }

  getExpiringItems(days?: number): Observable<Item[]> {
    let params = new HttpParams();
    if (days) params = params.set('days', days.toString());
    
    return this.http.get<Item[]>(`${this.apiUrl}/expiring`, { params });
  }
}
