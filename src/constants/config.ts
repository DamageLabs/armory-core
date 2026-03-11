// Application configuration constants

export const APP_NAME = 'Armory Core';
export const APP_DESCRIPTION = 'Firearms Inventory Management System';

// Pagination
export const ITEMS_PER_PAGE = 25;

// Low stock threshold
export const LOW_STOCK_THRESHOLD = 5;

// Inventory types where low stock / reorder alerts apply
export const LOW_STOCK_TYPE_NAMES = ['Ammunition'];

// Inventory type name for firearms (serial number cleared on clone)
export const FIREARMS_TYPE_NAME = 'Firearms';

// Ammunition type name (for box count / total rounds display)
export const AMMUNITION_TYPE_NAME = 'Ammunition';

// Theme
export const THEME_STORAGE_KEY = 'armory-theme';
export type Theme = 'light' | 'dark';
export const DEFAULT_THEME: Theme = 'light';
