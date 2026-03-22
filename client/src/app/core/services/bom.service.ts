import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface BomItem {
  itemId: number;
  quantity: number;
  // Additional fields populated when fetching BOMs
  itemName?: string;
  unitValue?: number;
  totalValue?: number;
}

export interface Bom {
  id: number;
  name: string;
  description: string;
  items: BomItem[];
  createdAt: string;
  updatedAt: string;
  // Additional calculated fields
  totalCost?: number;
  itemCount?: number;
}

export interface CreateBomRequest {
  name: string;
  description: string;
  items: BomItem[];
}

export interface UpdateBomRequest {
  name: string;
  description: string;
  items: BomItem[];
}

export interface BomCostResponse {
  totalCost: number;
  itemCosts: Array<{
    itemId: number;
    itemName: string;
    quantity: number;
    unitValue: number;
    totalValue: number;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class BomService {
  private apiUrl = '/api/boms';

  constructor(private http: HttpClient) {}

  getBoms(): Observable<Bom[]> {
    return this.http.get<Bom[]>(this.apiUrl);
  }

  getBom(id: number): Observable<Bom> {
    return this.http.get<Bom>(`${this.apiUrl}/${id}`);
  }

  createBom(request: CreateBomRequest): Observable<Bom> {
    return this.http.post<Bom>(this.apiUrl, request);
  }

  updateBom(id: number, request: UpdateBomRequest): Observable<Bom> {
    return this.http.put<Bom>(`${this.apiUrl}/${id}`, request);
  }

  deleteBom(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getBomCost(id: number): Observable<BomCostResponse> {
    return this.http.get<BomCostResponse>(`${this.apiUrl}/${id}/cost`);
  }

  duplicateBom(id: number): Observable<Bom> {
    return this.http.post<Bom>(`${this.apiUrl}/${id}/duplicate`, {});
  }
}