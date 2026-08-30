// The quota rules, kept free of Firebase and of the DOM so both the client and
// the Edge function can apply the same arithmetic and so they can be tested
// without a Firebase project.

// A signed-in account's lifetime allowance.
export const MINUTE_CAP = 60;
export const SECOND_CAP = MINUTE_CAP * 60;

// How much someone gets before being asked to sign in. Deliberately small: it
// exists so a first-time visitor can hear the orb talk back before meeting a
// Google consent screen, not as a usable free tier.
export const FREE_ANON_SESSIONS = 2;

export type Gate =
  | { allowed: true }
  // Anonymous allowance spent — signing in is the way forward.
  | { allowed: false; reason: 'sign-in-required' }
  // Signed in, but the account has used its minutes.
  | { allowed: false; reason: 'out-of-minutes' };

export function checkAnonymous(sessionsUsed: number): Gate {
  return sessionsUsed < FREE_ANON_SESSIONS
    ? { allowed: true }
    : { allowed: false, reason: 'sign-in-required' };
}

export function checkAccount(secondsUsed: number): Gate {
  return secondsUsed < SECOND_CAP
    ? { allowed: true }
    : { allowed: false, reason: 'out-of-minutes' };
}

export function minutesRemaining(secondsUsed: number): number {
  // Round down so "1 minute left" never means six seconds.
  return Math.max(0, Math.floor((SECOND_CAP - secondsUsed) / 60));
}
