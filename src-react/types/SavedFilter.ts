export type FilterOperator = 'eq' | 'contains' | 'gt' | 'lt' | 'between';

export interface FilterCriterion {
  field: string;
  operator: FilterOperator;
  value: string;
  valueTo?: string; // For 'between' operator
  isCustomField: boolean;
  fieldType?: 'text' | 'number' | 'select' | 'date' | 'boolean';
}

export interface SavedFilter {
  id: number;
  userId: number;
  name: string;
  filterConfig: FilterConfig;
  createdAt: string;
}

export interface FilterConfig {
  search?: string;
  typeId?: number;
  category?: string;
  filters: FilterCriterion[];
}
