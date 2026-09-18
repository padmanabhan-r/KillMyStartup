import { describe, expect, it } from 'vitest';
import { pickBalance } from '../_lib/revenuecat';

describe('pickBalance', () => {
  it('reads the SECS balance from a RevenueCat v2 reply', () => {
    // Shape copied from a real GET .../virtual_currencies response.
    const items = [
      { balance: 600, currency_code: 'SECS', description: 'Conversation time, in seconds', name: 'Seconds', object: 'virtual_currency_balance' },
    ];
    expect(pickBalance(items)).toBe(600);
  });

  it('is zero when the currency is missing or the list is empty', () => {
    expect(pickBalance([])).toBe(0);
    expect(pickBalance(undefined)).toBe(0);
    expect(pickBalance([{ balance: 50, currency_code: 'GEMS' }])).toBe(0);
  });

  it('never goes negative', () => {
    expect(pickBalance([{ balance: -5, currency_code: 'SECS' }])).toBe(0);
  });
});
