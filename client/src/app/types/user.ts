export interface User {
  id: number;
  email: string;
  role: 'admin' | 'user';
  signInCount: number;
  lastSignInAt: string | null;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Legacy interface for backward compatibility
export interface LegacyUser {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
  verified: boolean;
}