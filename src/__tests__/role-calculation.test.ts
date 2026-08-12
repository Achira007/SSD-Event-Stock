/**
 * Phase 10 — Unit Test 1: Role Calculation Logic
 *
 * Verifies that the ADMIN_EMAILS environment variable correctly determines
 * whether a user is ADMIN or STAFF. This test exercises the pure logic
 * extracted from src/lib/auth.ts jwt callback.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// Pure function extracted from auth.ts jwt callback logic
function determineRole(email: string, adminEmailsEnv: string): 'ADMIN' | 'STAFF' {
  const adminEmails = (adminEmailsEnv || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return adminEmails.includes(email.toLowerCase()) ? 'ADMIN' : 'STAFF';
}

describe('Role Calculation (ADMIN_EMAILS)', () => {
  it('should return ADMIN when email is in ADMIN_EMAILS', () => {
    expect(determineRole('admin@example.com', 'admin@example.com')).toBe('ADMIN');
  });

  it('should return STAFF when email is NOT in ADMIN_EMAILS', () => {
    expect(determineRole('staff@example.com', 'admin@example.com')).toBe('STAFF');
  });

  it('should handle multiple admin emails (comma-separated)', () => {
    const env = 'admin1@example.com, admin2@example.com, admin3@example.com';
    expect(determineRole('admin2@example.com', env)).toBe('ADMIN');
    expect(determineRole('staff@example.com', env)).toBe('STAFF');
  });

  it('should be case-insensitive', () => {
    expect(determineRole('Admin@Example.COM', 'admin@example.com')).toBe('ADMIN');
  });

  it('should return STAFF when ADMIN_EMAILS is empty', () => {
    expect(determineRole('anyone@example.com', '')).toBe('STAFF');
  });

  it('should handle whitespace in ADMIN_EMAILS', () => {
    const env = '  admin@example.com  ,  boss@example.com  ';
    expect(determineRole('admin@example.com', env)).toBe('ADMIN');
    expect(determineRole('boss@example.com', env)).toBe('ADMIN');
  });
});
