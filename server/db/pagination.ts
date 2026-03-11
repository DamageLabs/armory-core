const ALLOWED_SORT_FIELDS: Record<string, string> = {
  name: 'items.name',
  quantity: 'items.quantity',
  unitValue: 'items.unit_value',
  value: 'items.value',
  location: 'items.location',
  category: 'items.category',
  createdAt: 'items.created_at',
  updatedAt: 'items.updated_at',
};

export interface PaginationParams {
  page: number;
  pageSize: number;
  search?: string;
  typeId?: number;
  category?: string;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  lowStock?: boolean;
  lowStockThreshold?: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export function parsePaginationParams(query: Record<string, unknown>): PaginationParams {
  const page = Math.max(1, parseInt(String(query.page || '1'), 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(String(query.pageSize || '25'), 10) || 25));
  const sortBy = ALLOWED_SORT_FIELDS[String(query.sortBy || 'name')] ? String(query.sortBy) : 'name';
  const sortDir = String(query.sortDir || 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc';

  return {
    page,
    pageSize,
    search: query.search ? String(query.search) : undefined,
    typeId: query.typeId ? parseInt(String(query.typeId), 10) || undefined : undefined,
    category: query.category ? String(query.category) : undefined,
    sortBy,
    sortDir,
    lowStock: query.lowStock === 'true',
    lowStockThreshold: query.lowStockThreshold ? parseInt(String(query.lowStockThreshold), 10) || 10 : 10,
  };
}

export function buildItemWhereClause(params: PaginationParams): { where: string; values: unknown[] } {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (params.search) {
    conditions.push('(items.name LIKE ? OR items.description LIKE ? OR items.location LIKE ? OR items.custom_fields LIKE ?)');
    const term = `%${params.search}%`;
    values.push(term, term, term, term);
  }

  if (params.typeId) {
    conditions.push('items.inventory_type_id = ?');
    values.push(params.typeId);
  }

  if (params.category) {
    conditions.push('items.category = ?');
    values.push(params.category);
  }

  if (params.lowStock) {
    conditions.push(
      `items.inventory_type_id IN (SELECT id FROM inventory_types WHERE name IN ('Ammunition')) AND items.quantity <= ?`
    );
    values.push(params.lowStockThreshold!);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { where, values };
}

export function getSortColumn(sortBy: string): string {
  return ALLOWED_SORT_FIELDS[sortBy] || 'items.name';
}

export function buildPaginationMeta(totalItems: number, page: number, pageSize: number): PaginationMeta {
  return {
    page,
    pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize) || 1,
  };
}
