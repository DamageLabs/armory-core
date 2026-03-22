export interface Vendor {
  id: string;
  name: string;
  displayName: string;
  baseUrl: string;
}

export interface VendorPriceResult {
  vendor: string;
  partNumber: string;
  price: number;
  inStock: boolean;
  stockQuantity?: number;
  vendorUrl?: string;
  lastChecked: string;
}

export interface VendorPriceCache {
  [key: string]: VendorPriceResult;
}

export const SUPPORTED_VENDORS: Vendor[] = [
  {
    id: 'brownells',
    name: 'Brownells',
    displayName: 'Brownells Inc.',
    baseUrl: 'https://www.brownells.com',
  },
  {
    id: 'midwayusa',
    name: 'MidwayUSA',
    displayName: 'MidwayUSA',
    baseUrl: 'https://www.midwayusa.com',
  },
  {
    id: 'primaryarms',
    name: 'PrimaryArms',
    displayName: 'Primary Arms',
    baseUrl: 'https://www.primaryarms.com',
  },
  {
    id: 'palmettostatearmory',
    name: 'PSA',
    displayName: 'Palmetto State Armory',
    baseUrl: 'https://palmettostatearmory.com',
  },
  {
    id: 'opticsplanet',
    name: 'OpticsPlanet',
    displayName: 'OpticsPlanet',
    baseUrl: 'https://www.opticsplanet.com',
  },
];
