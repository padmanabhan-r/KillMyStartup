import { describe, expect, it } from 'vitest';
import { getUserId, isUserId } from '../_lib/identity';

describe('identity header', () => {
  const req = (v?: string) => new Request('https://x/', { headers: v ? { 'X-KMS-User': v } : {} });
  it('accepts an Android ID and a UUID', () => {
    expect(getUserId(req('9774d56d682e549c'))).toBe('9774d56d682e549c');
    expect(getUserId(req('550e8400-e29b-41d4-a716-446655440000'))).toBe('550e8400-e29b-41d4-a716-446655440000');
  });
  it('rejects missing, short or odd values', () => {
    expect(getUserId(req())).toBeNull();
    expect(getUserId(req('abc'))).toBeNull();
    expect(getUserId(req('has space here'))).toBeNull();
    expect(isUserId('a'.repeat(65))).toBe(false);
  });
});
