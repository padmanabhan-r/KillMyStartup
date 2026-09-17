import { describe, expect, it } from 'vitest';
import { chargeDelta } from '../_lib/ledger';

describe('chargeDelta', () => {
  it('charges the full amount the first time', () => expect(chargeDelta(61.4, 0)).toBe(61));
  it('charges only the difference on a later, longer report', () => expect(chargeDelta(70, 61)).toBe(9));
  it('never refunds when a later report is shorter', () => expect(chargeDelta(50, 61)).toBe(0));
  it('is a no-op when replayed', () => expect(chargeDelta(61, 61)).toBe(0));
  it('ignores negative or NaN-ish input', () => {
    expect(chargeDelta(-5, 0)).toBe(0);
    expect(chargeDelta(10, -3)).toBe(10);
  });
});
