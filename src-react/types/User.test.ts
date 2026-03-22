import { describe, it, expect } from 'vitest';
import type { User, UserWithoutPassword, UserRole, LoginCredentials, RegisterData } from './User';

describe('User types', () => {
  describe('User interface', () => {
    it('accepts valid user object', () => {
      const user: User = {
        id: 1,
        email: 'test@example.com',
        password: 'password123',
        role: 'user',
        signInCount: 0,
        lastSignInAt: null,
        lastSignInIp: null,
        emailVerified: false,
        emailVerificationToken: null,
        emailVerificationTokenExpiresAt: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      expect(user.id).toBe(1);
      expect(user.email).toBe('test@example.com');
      expect(user.role).toBe('user');
    });

    it('accepts all valid roles', () => {
      const roles: UserRole[] = ['user', 'vip', 'admin'];

      roles.forEach((role) => {
        const user: User = {
          id: 1,
          email: 'test@example.com',
          password: 'password123',
          role,
          signInCount: 0,
          lastSignInAt: null,
          lastSignInIp: null,
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationTokenExpiresAt: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        };

        expect(user.role).toBe(role);
      });
    });
  });

  describe('UserWithoutPassword', () => {
    it('omits password field', () => {
      const user: UserWithoutPassword = {
        id: 1,
        email: 'test@example.com',
        role: 'admin',
        signInCount: 5,
        lastSignInAt: '2024-01-01T00:00:00Z',
        lastSignInIp: '127.0.0.1',
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpiresAt: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      expect(user).not.toHaveProperty('password');
      expect(user.email).toBe('test@example.com');
    });
  });

  describe('LoginCredentials', () => {
    it('accepts valid credentials', () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      expect(credentials.email).toBe('test@example.com');
      expect(credentials.password).toBe('password123');
    });
  });

  describe('RegisterData', () => {
    it('accepts valid registration data', () => {
      const data: RegisterData = {
        email: 'test@example.com',
        password: 'password123',
        passwordConfirmation: 'password123',
      };

      expect(data.email).toBe('test@example.com');
      expect(data.password).toBe(data.passwordConfirmation);
    });
  });
});
