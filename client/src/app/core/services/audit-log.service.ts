import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuditLogEntry, PaginatedAuditLogs, AuditLogFilters } from '../../types/audit-log';

@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  private apiUrl = '/api/audit-log';

  constructor(private http: HttpClient) {}

  getAuditLogs(filters: AuditLogFilters = {}): Observable<PaginatedAuditLogs> {
    let params = new HttpParams();
    
    if (filters.action) params = params.set('action', filters.action);
    if (filters.userId) params = params.set('userId', filters.userId.toString());
    if (filters.userEmail) params = params.set('userEmail', filters.userEmail);
    if (filters.resourceType) params = params.set('resourceType', filters.resourceType);
    if (filters.from) params = params.set('from', filters.from);
    if (filters.to) params = params.set('to', filters.to);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.pageSize) params = params.set('pageSize', filters.pageSize.toString());

    return this.http.get<PaginatedAuditLogs>(this.apiUrl, { params });
  }

  getActions(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/actions`);
  }

  getUsers(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/users`);
  }
}