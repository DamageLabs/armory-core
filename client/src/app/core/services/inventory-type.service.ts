import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InventoryType, InventoryTypeFormData } from '../../types/inventory-type';

@Injectable({
  providedIn: 'root'
})
export class InventoryTypeService {
  private http = inject(HttpClient);
  private apiUrl = '/api/inventory-types';

  getInventoryTypes(): Observable<InventoryType[]> {
    return this.http.get<InventoryType[]>(this.apiUrl);
  }

  getInventoryTypeById(id: number): Observable<InventoryType> {
    return this.http.get<InventoryType>(`${this.apiUrl}/${id}`);
  }

  updateInventoryType(id: number, data: Partial<InventoryTypeFormData>): Observable<InventoryType> {
    return this.http.put<InventoryType>(`${this.apiUrl}/${id}`, data);
  }

  // For future use
  createInventoryType(data: InventoryTypeFormData): Observable<InventoryType> {
    return this.http.post<InventoryType>(this.apiUrl, data);
  }

  deleteInventoryType(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}