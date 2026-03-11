import { Item, ItemFormData } from '../types/Item';
import { FilterCriterion } from '../types/SavedFilter';
import { api } from './api';

export interface ItemQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  typeId?: number;
  category?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  lowStock?: boolean;
  lowStockThreshold?: number;
  filters?: FilterCriterion[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface ItemStats {
  totalQuantity: number;
  totalValue: number;
  totalItems: number;
}

function buildQueryString(params: ItemQueryParams): string {
  const parts: string[] = [];
  if (params.page) parts.push(`page=${params.page}`);
  if (params.pageSize) parts.push(`pageSize=${params.pageSize}`);
  if (params.search) parts.push(`search=${encodeURIComponent(params.search)}`);
  if (params.typeId) parts.push(`typeId=${params.typeId}`);
  if (params.category) parts.push(`category=${encodeURIComponent(params.category)}`);
  if (params.sortBy) parts.push(`sortBy=${params.sortBy}`);
  if (params.sortDir) parts.push(`sortDir=${params.sortDir}`);
  if (params.lowStock) parts.push('lowStock=true');
  if (params.lowStockThreshold) parts.push(`lowStockThreshold=${params.lowStockThreshold}`);
  if (params.filters && params.filters.length > 0) parts.push(`filters=${encodeURIComponent(JSON.stringify(params.filters))}`);
  return parts.length > 0 ? `?${parts.join('&')}` : '';
}

export async function getItems(params: ItemQueryParams = {}): Promise<PaginatedResponse<Item>> {
  return api.get<PaginatedResponse<Item>>(`/items${buildQueryString(params)}`);
}

export async function getFilteredStats(params: ItemQueryParams = {}): Promise<ItemStats> {
  return api.get<ItemStats>(`/items/stats${buildQueryString(params)}`);
}

export async function getAllItems(): Promise<Item[]> {
  const result = await api.get<PaginatedResponse<Item>>('/items?pageSize=100000');
  return result.data;
}

export async function getItemById(id: number): Promise<Item | null> {
  try {
    return await api.get<Item>(`/items/${id}`);
  } catch {
    return null;
  }
}

export async function createItem(data: ItemFormData): Promise<Item> {
  return api.post<Item>('/items', data);
}

export async function updateItem(id: number, data: Partial<ItemFormData>): Promise<Item | null> {
  try {
    return await api.put<Item>(`/items/${id}`, data);
  } catch {
    return null;
  }
}

export async function deleteItem(id: number): Promise<boolean> {
  try {
    await api.delete(`/items/${id}`);
    return true;
  } catch {
    return false;
  }
}

export async function getTotalQuantity(): Promise<number> {
  const stats = await api.get<{ totalQuantity: number; totalValue: number }>('/items/stats');
  return stats.totalQuantity;
}

export async function getTotalValue(): Promise<number> {
  const stats = await api.get<{ totalQuantity: number; totalValue: number }>('/items/stats');
  return stats.totalValue;
}

export async function getItemStats(): Promise<{ totalQuantity: number; totalValue: number }> {
  return api.get('/items/stats');
}

export async function deleteItems(ids: number[]): Promise<number> {
  await api.post('/items/bulk-delete', { ids });
  return ids.length;
}

export async function updateItemsCategory(ids: number[], category: string): Promise<number> {
  await api.put('/items/bulk-category', { ids, category });
  return ids.length;
}

export async function getLowStockItems(threshold: number): Promise<Item[]> {
  return api.get<Item[]>(`/items/low-stock?threshold=${threshold}`);
}

export async function getItemsNeedingReorder(): Promise<Item[]> {
  return api.get<Item[]>('/items/reorder');
}

export async function getItemChildren(id: number): Promise<Item[]> {
  return api.get<Item[]>(`/items/${id}/children`);
}

export async function bulkCreateItems(
  items: ItemFormData[],
): Promise<{ created: number; idMapping: Record<number, number> }> {
  return api.post('/items/bulk-create', { items });
}

export async function deleteAllItems(): Promise<{ message: string }> {
  return api.delete('/items/all');
}
