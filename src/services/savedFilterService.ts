import { SavedFilter, FilterConfig } from '../types/SavedFilter';
import { api } from './api';

export async function getSavedFilters(): Promise<SavedFilter[]> {
  return api.get<SavedFilter[]>('/saved-filters');
}

export async function createSavedFilter(name: string, filterConfig: FilterConfig): Promise<SavedFilter> {
  return api.post<SavedFilter>('/saved-filters', { name, filterConfig });
}

export async function updateSavedFilter(id: number, name: string, filterConfig: FilterConfig): Promise<SavedFilter> {
  return api.put<SavedFilter>(`/saved-filters/${id}`, { name, filterConfig });
}

export async function deleteSavedFilter(id: number): Promise<void> {
  await api.delete(`/saved-filters/${id}`);
}
