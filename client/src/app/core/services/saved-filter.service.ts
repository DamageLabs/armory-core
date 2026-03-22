import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ItemFilters } from '../../types/item';

export interface SavedFilter {
  id: number;
  userId: number;
  name: string;
  filterConfig: ItemFilters;
  createdAt: string;
}

export interface CreateSavedFilterRequest {
  name: string;
  filterConfig: ItemFilters;
}

export interface UpdateSavedFilterRequest {
  name: string;
  filterConfig: ItemFilters;
}

@Injectable({
  providedIn: 'root'
})
export class SavedFilterService {
  private apiUrl = '/api/saved-filters';

  constructor(private http: HttpClient) {}

  getSavedFilters(): Observable<SavedFilter[]> {
    return this.http.get<SavedFilter[]>(this.apiUrl);
  }

  createSavedFilter(request: CreateSavedFilterRequest): Observable<SavedFilter> {
    return this.http.post<SavedFilter>(this.apiUrl, request);
  }

  updateSavedFilter(id: number, request: UpdateSavedFilterRequest): Observable<SavedFilter> {
    return this.http.put<SavedFilter>(`${this.apiUrl}/${id}`, request);
  }

  deleteSavedFilter(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}