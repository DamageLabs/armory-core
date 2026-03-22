export interface AuditEntry {
  id: number;
  userId: number | null;
  userEmail: string | null;
  action: string;
  resourceType: string;
  resourceId: number | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  timestamp: string;
}

export interface AuditLogFilter {
  page?: number;
  pageSize?: number;
  action?: string;
  resourceType?: string;
  userId?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface AuditLogResponse {
  data: AuditEntry[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface AuditUser {
  userId: number;
  userEmail: string;
}
