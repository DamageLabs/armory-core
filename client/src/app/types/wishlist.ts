export interface WishlistItem {
  id: number;
  userId: number;
  name: string;
  description: string;
  targetPrice: number;
  vendorUrl: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  inventoryTypeId: number;
  notes: string;
  purchased: boolean;
  purchasedAt: string | null;
  createdAt: string;
  updatedAt: string;
  inventoryTypeName?: string;
}

export interface CreateWishlistItem {
  name: string;
  description?: string;
  targetPrice?: number;
  vendorUrl?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  inventoryTypeId?: number;
  notes?: string;
}

export interface UpdateWishlistItem {
  name?: string;
  description?: string;
  targetPrice?: number;
  vendorUrl?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  inventoryTypeId?: number;
  notes?: string;
}

export interface WishlistFilters {
  priority?: string;
  purchased?: boolean;
  sort?: 'date' | 'priority' | 'price' | 'name';
  order?: 'asc' | 'desc';
}

export type WishlistPriority = 'low' | 'medium' | 'high' | 'urgent';