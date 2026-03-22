import { ItemFilters } from './item';

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