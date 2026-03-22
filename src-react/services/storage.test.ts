import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getFromStorage, saveToStorage, removeFromStorage, STORAGE_KEYS } from './storage';

describe('storage service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getFromStorage', () => {
    it('returns parsed JSON from localStorage', () => {
      const mockData = { id: 1, name: 'Test' };
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(mockData));

      const result = getFromStorage<typeof mockData>('test-key');

      expect(localStorage.getItem).toHaveBeenCalledWith('test-key');
      expect(result).toEqual(mockData);
    });

    it('returns null when key does not exist', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);

      const result = getFromStorage('nonexistent');

      expect(result).toBeNull();
    });

    it('returns null on JSON parse error', () => {
      vi.mocked(localStorage.getItem).mockReturnValue('invalid-json');

      const result = getFromStorage('bad-data');

      expect(result).toBeNull();
    });
  });

  describe('saveToStorage', () => {
    it('saves stringified JSON to localStorage', () => {
      const data = { id: 1, name: 'Test' };

      saveToStorage('test-key', data);

      expect(localStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify(data));
    });
  });

  describe('removeFromStorage', () => {
    it('removes item from localStorage', () => {
      removeFromStorage('test-key');

      expect(localStorage.removeItem).toHaveBeenCalledWith('test-key');
    });
  });

  describe('STORAGE_KEYS', () => {
    it('has all required keys defined', () => {
      expect(STORAGE_KEYS.USERS).toBeDefined();
      expect(STORAGE_KEYS.ITEMS).toBeDefined();
      expect(STORAGE_KEYS.CURRENT_USER).toBeDefined();
      expect(STORAGE_KEYS.INITIALIZED).toBeDefined();
    });
  });
});
