const STANDARD_FILTER_FIELDS: Record<string, string> = {
  name: 'items.name',
  location: 'items.location',
  category: 'items.category',
  quantity: 'items.quantity',
  unitValue: 'items.unit_value',
  value: 'items.value',
  barcode: 'items.barcode',
};

function buildFilterCondition(
  col: string,
  operator: string,
  value: string,
  valueTo: string | undefined,
  conditions: string[],
  values: unknown[],
): void {
  switch (operator) {
    case 'eq':
      conditions.push(`${col} = ?`);
      values.push(value);
      break;
    case 'contains':
      conditions.push(`${col} LIKE ?`);
      values.push(`%${value}%`);
      break;
    case 'gt':
      conditions.push(`${col} > ?`);
      values.push(value);
      break;
    case 'lt':
      conditions.push(`${col} < ?`);
      values.push(value);
      break;
    case 'between':
      if (valueTo !== undefined && valueTo !== '') {
        conditions.push(`${col} >= ? AND ${col} <= ?`);
        values.push(value, valueTo);
      }
      break;
  }
}

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

export interface FilterCriterion {
  field: string;
  operator: 'eq' | 'contains' | 'gt' | 'lt' | 'between';
  value: string;
  valueTo?: string;
  isCustomField: boolean;
  fieldType?: string;
}

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
  filters?: FilterCriterion[];
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

function parseThreshold(value: unknown): number {
  if (value === undefined || value === '') return 10;
  const parsed = parseInt(String(value), 10);
  return Number.isNaN(parsed) ? 10 : parsed;
}

export function parsePaginationParams(query: Record<string, unknown>): PaginationParams {
  const page = Math.max(1, parseInt(String(query.page || '1'), 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(String(query.pageSize || '25'), 10) || 25));
  const sortBy = ALLOWED_SORT_FIELDS[String(query.sortBy || 'name')] ? String(query.sortBy) : 'name';
  const sortDir = String(query.sortDir || 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc';

  let filters: FilterCriterion[] | undefined;
  if (query.filters) {
    try {
      const parsed = JSON.parse(String(query.filters));
      if (Array.isArray(parsed)) filters = parsed;
    } catch {
      // ignore invalid JSON
    }
  }

  return {
    page,
    pageSize,
    search: query.search ? String(query.search) : undefined,
    typeId: query.typeId ? parseInt(String(query.typeId), 10) || undefined : undefined,
    category: query.category ? String(query.category) : undefined,
    sortBy,
    sortDir,
    lowStock: query.lowStock === 'true',
    lowStockThreshold: parseThreshold(query.lowStockThreshold),
    filters,
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

  if (params.filters && params.filters.length > 0) {
    for (const filter of params.filters) {
      const { field, operator, value, valueTo, isCustomField } = filter;
      if (!field || value === undefined || value === '') continue;

      if (isCustomField) {
        const jsonPath = `json_extract(items.custom_fields, '$.${field}')`;
        buildFilterCondition(jsonPath, operator, value, valueTo, conditions, values);
      } else {
        const col = STANDARD_FILTER_FIELDS[field];
        if (!col) continue;
        buildFilterCondition(col, operator, value, valueTo, conditions, values);
      }
    }
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
