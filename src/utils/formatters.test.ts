import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, formatDateTime } from './formatters';

describe('formatCurrency', () => {
  it('formats whole numbers with two decimal places', () => {
    expect(formatCurrency(10)).toBe('$10.00');
  });

  it('formats decimal values', () => {
    expect(formatCurrency(5.99)).toBe('$5.99');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('rounds to two decimal places', () => {
    expect(formatCurrency(1.999)).toBe('$2.00');
    expect(formatCurrency(1.994)).toBe('$1.99');
  });

  it('formats large numbers with comma separators', () => {
    expect(formatCurrency(12345.67)).toBe('$12,345.67');
    expect(formatCurrency(1234567.89)).toBe('$1,234,567.89');
  });

  it('formats negative numbers', () => {
    expect(formatCurrency(-5.50)).toBe('-$5.50');
  });
});

describe('formatDate', () => {
  it('formats ISO date string', () => {
    const result = formatDate('2026-01-15T12:00:00Z');
    expect(result).toContain('Jan');
    expect(result).toContain('15');
    expect(result).toContain('2026');
  });

  it('formats different months', () => {
    const result = formatDate('2026-06-15T12:00:00Z');
    expect(result).toContain('Jun');
    expect(result).toContain('2026');
  });
});

describe('formatDateTime', () => {
  it('formats ISO date string with time', () => {
    const result = formatDateTime('2026-01-15T14:30:00Z');
    expect(result).toContain('Jan');
    expect(result).toContain('15');
    expect(result).toContain('2026');
  });

  it('includes time component', () => {
    const result = formatDateTime('2026-01-15T14:30:00Z');
    // Should contain some time representation (varies by timezone)
    expect(result.length).toBeGreaterThan(formatDate('2026-01-15T14:30:00Z').length);
  });
});
