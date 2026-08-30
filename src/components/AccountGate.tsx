import type { User } from 'firebase/auth';
import { MINUTE_CAP, minutesRemaining } from '../lib/quota';

interface AccountGateProps {
  user: User | null;
  available: boolean;
  blocked: 'sign-in-required' | 'out-of-minutes' | null;
  secondsUsed: number | null;
  onSignIn: () => void;
  onSignOut: () => void;
}

// The account chip and whatever the quota currently has to say. Deliberately
// quiet: the orb is the product, and an auth widget must not become the first
// thing you look at.
export function AccountGate({
  user, available, blocked, secondsUsed, onSignIn, onSignOut,
}: AccountGateProps) {
  if (!available) return null;

  if (blocked === 'sign-in-required') {
    return (
      <div className="flex flex-col items-center gap-3 animate-fade-in-up">
        <p className="text-[11px] text-muted-foreground text-center max-w-xs leading-relaxed">
          You've used your free pitches. Sign in to keep going — {MINUTE_CAP} minutes on the house.
        </p>
        <button onClick={onSignIn} className="kill-button">
          Continue with Google
        </button>
      </div>
    );
  }

  if (blocked === 'out-of-minutes') {
    return (
      <p className="text-[11px] text-muted-foreground text-center max-w-xs leading-relaxed animate-fade-in-up">
        You've used all {MINUTE_CAP} minutes on this account. That's more feedback than most
        founders survive.
      </p>
    );
  }

  if (!user) {
    return (
      <button
        onClick={onSignIn}
        className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-mono hover:text-foreground transition-colors duration-200"
      >
        Sign in with Google
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-mono">
        {secondsUsed === null ? user.email : `${minutesRemaining(secondsUsed)} min left`}
      </span>
      <span className="text-muted-foreground/30 font-mono text-[10px]">|</span>
      <button
        onClick={onSignOut}
        className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-mono hover:text-foreground transition-colors duration-200"
      >
        Sign out
      </button>
    </div>
  );
}
