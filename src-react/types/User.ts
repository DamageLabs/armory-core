export type UserRole = 'user' | 'admin';

export interface User {
  id: number;
  email: string;
  password: string;
  role: UserRole;
  signInCount: number;
  lastSignInAt: string | null;
  lastSignInIp: string | null;
  emailVerified: boolean;
  emailVerificationToken: string | null;
  emailVerificationTokenExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithoutPassword extends Omit<User, 'password'> {}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  passwordConfirmation: string;
}
