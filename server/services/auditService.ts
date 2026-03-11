import { run } from '../db/index';

export interface AuditLogParams {
  userId?: number | null;
  userEmail?: string | null;
  action: string;
  resourceType: string;
  resourceId?: number | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

export function logAudit(params: AuditLogParams): void {
  try {
    const now = new Date().toISOString();
    run(
      'INSERT INTO audit_log (user_id, user_email, action, resource_type, resource_id, details, ip_address, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        params.userId ?? null,
        params.userEmail ?? null,
        params.action,
        params.resourceType,
        params.resourceId ?? null,
        params.details ? JSON.stringify(params.details) : null,
        params.ipAddress ?? null,
        now,
      ]
    );
  } catch (error) {
    console.error('Audit log error (non-fatal):', error);
  }
}
