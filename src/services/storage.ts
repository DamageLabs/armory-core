const STORAGE_KEYS = {
  USERS: 'armory_users',
  ITEMS: 'armory_items',
  CURRENT_USER: 'armory_current_user',
  INITIALIZED: 'armory_initialized',
  STOCK_HISTORY: 'armory_stock_history',
  ITEM_TEMPLATES: 'armory_item_templates',
  COST_HISTORY: 'armory_cost_history',
  BOMS: 'armory_boms',
  VENDOR_PRICE_CACHE: 'armory_vendor_price_cache',
} as const;

export function getFromStorage<T>(key: string): T | null {
  const data = localStorage.getItem(key);
  if (!data) return null;
  try {
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

export function saveToStorage<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export function removeFromStorage(key: string): void {
  localStorage.removeItem(key);
}

export function isInitialized(): boolean {
  return getFromStorage<boolean>(STORAGE_KEYS.INITIALIZED) === true;
}

export function setInitialized(): void {
  saveToStorage(STORAGE_KEYS.INITIALIZED, true);
}

export { STORAGE_KEYS };
