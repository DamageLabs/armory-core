// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, isHashed } from '../password';

describe('password utils', () => {
  describe('hashPassword', () => {
    it('returns a bcrypt hash', async () => {
      const hash = await hashPassword('mysecret');
      expect(hash).toMatch(/^\$2[aby]\$/);
    });

    it('produces different hashes for the same input', async () => {
      const hash1 = await hashPassword('mysecret');
      const hash2 = await hashPassword('mysecret');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('returns true for correct password', async () => {
      const hash = await hashPassword('correct');
      expect(await verifyPassword('correct', hash)).toBe(true);
    });

    it('returns false for incorrect password', async () => {
      const hash = await hashPassword('correct');
      expect(await verifyPassword('wrong', hash)).toBe(false);
    });

    it('returns false for empty string', async () => {
      const hash = await hashPassword('correct');
      expect(await verifyPassword('', hash)).toBe(false);
    });
  });

  describe('isHashed', () => {
    it('returns true for bcrypt hashes', () => {
      expect(isHashed('$2b$12$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012')).toBe(true);
      expect(isHashed('$2a$10$somehashvalue')).toBe(true);
    });

    it('returns false for plain text', () => {
      expect(isHashed('changeme')).toBe(false);
      expect(isHashed('password123')).toBe(false);
    });
  });
});
