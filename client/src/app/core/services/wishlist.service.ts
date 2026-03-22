import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  WishlistItem, 
  CreateWishlistItem, 
  UpdateWishlistItem, 
  WishlistFilters 
} from '../../types/wishlist';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private apiUrl = '/api/wishlist';

  constructor(private http: HttpClient) {}

  getWishlistItems(filters: WishlistFilters = {}): Observable<WishlistItem[]> {
    let params = new HttpParams();
    
    if (filters.priority && filters.priority !== 'all') {
      params = params.set('priority', filters.priority);
    }
    if (filters.purchased !== undefined) {
      params = params.set('purchased', filters.purchased.toString());
    }
    if (filters.sort) {
      params = params.set('sort', filters.sort);
    }
    if (filters.order) {
      params = params.set('order', filters.order);
    }

    return this.http.get<WishlistItem[]>(this.apiUrl, { params });
  }

  getItem(id: number): Observable<WishlistItem> {
    return this.http.get<WishlistItem>(`${this.apiUrl}/${id}`);
  }

  createItem(item: CreateWishlistItem): Observable<WishlistItem> {
    return this.http.post<WishlistItem>(this.apiUrl, item);
  }

  updateItem(id: number, item: UpdateWishlistItem): Observable<WishlistItem> {
    return this.http.put<WishlistItem>(`${this.apiUrl}/${id}`, item);
  }

  deleteItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  purchaseItem(id: number): Observable<{ inventoryItemId: number }> {
    return this.http.post<{ inventoryItemId: number }>(`${this.apiUrl}/${id}/purchase`, {});
  }
}