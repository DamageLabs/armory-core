import { describe, it, expect } from 'vitest';
import type { Vendor, VendorPriceResult, VendorPriceCache } from './Vendor';
import { SUPPORTED_VENDORS } from './Vendor';

describe('Vendor types', () => {
  describe('Vendor interface', () => {
    it('accepts valid vendor', () => {
      const vendor: Vendor = {
        id: 'test',
        name: 'TestVendor',
        displayName: 'Test Vendor Inc.',
        baseUrl: 'https://test.com',
      };
      expect(vendor.id).toBe('test');
    });
  });

  describe('VendorPriceResult interface', () => {
    it('accepts result with stock', () => {
      const result: VendorPriceResult = {
        vendor: 'Adafruit',
        partNumber: '50',
        price: 24.95,
        inStock: true,
        stockQuantity: 150,
        vendorUrl: 'https://adafruit.com/product/50',
        lastChecked: '2026-01-01T00:00:00Z',
      };
      expect(result.inStock).toBe(true);
      expect(result.stockQuantity).toBe(150);
    });

    it('accepts result without optional fields', () => {
      const result: VendorPriceResult = {
        vendor: 'DigiKey',
        partNumber: '123',
        price: 10.00,
        inStock: false,
        lastChecked: '2026-01-01T00:00:00Z',
      };
      expect(result.stockQuantity).toBeUndefined();
      expect(result.vendorUrl).toBeUndefined();
    });
  });

  describe('VendorPriceCache interface', () => {
    it('accepts cache with string keys', () => {
      const cache: VendorPriceCache = {
        'adafruit-50': {
          vendor: 'Adafruit', partNumber: '50', price: 24.95,
          inStock: true, lastChecked: '2026-01-01T00:00:00Z',
        },
      };
      expect(cache['adafruit-50'].price).toBe(24.95);
    });
  });

  describe('SUPPORTED_VENDORS constant', () => {
    it('has expected number of vendors', () => {
      expect(SUPPORTED_VENDORS).toHaveLength(5);
    });

    it('includes Adafruit', () => {
      const adafruit = SUPPORTED_VENDORS.find(v => v.id === 'adafruit');
      expect(adafruit).toBeDefined();
      expect(adafruit!.name).toBe('Adafruit');
    });

    it('all vendors have required fields', () => {
      for (const vendor of SUPPORTED_VENDORS) {
        expect(vendor.id).toBeTruthy();
        expect(vendor.name).toBeTruthy();
        expect(vendor.displayName).toBeTruthy();
        expect(vendor.baseUrl).toMatch(/^https:\/\//);
      }
    });

    it('vendor IDs are unique', () => {
      const ids = SUPPORTED_VENDORS.map(v => v.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});
