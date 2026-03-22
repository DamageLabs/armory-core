import { api } from './api';
import { AuditLogResponse, AuditLogFilter, AuditUser } from '../types/AuditLog';

export async function getAuditLog(filters: AuditLogFilter = {}): Promise<AuditLogResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
  if (filters.action) params.set('action', filters.action);
  if (filters.resourceType) params.set('resourceType', filters.resourceType);
  if (filters.userId) params.set('userId', String(filters.userId));
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  if (filters.search) params.set('search', filters.search);

  const qs = params.toString();
  return api.get<AuditLogResponse>(`/audit-log${qs ? `?${qs}` : ''}`);
}

export async function getAuditActions(): Promise<string[]> {
  return api.get<string[]>('/audit-log/actions');
}

export async function getAuditUsers(): Promise<AuditUser[]> {
  return api.get<AuditUser[]>('/audit-log/users');
}
