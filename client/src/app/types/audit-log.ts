export interface AuditLogEntry {
  id: number;
  userId: number;
  userEmail: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details: string; // JSON string
  ipAddress: string;
  timestamp: string;
}

export interface AuditLogFilters {
  action?: string;
  userId?: number;
  userEmail?: string;
  resourceType?: string;
  from?: string; // ISO date
  to?: string; // ISO date
  page?: number;
  pageSize?: number;
}

export interface PaginatedAuditLogs {
  data: AuditLogEntry[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}