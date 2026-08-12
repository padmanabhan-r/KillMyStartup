import { useState } from 'react';

// Announcement for the Android closed test. Dismissal is remembered so the card
// does not nag anyone who has already read it — the site's whole point is the orb,
// and this must never become the first thing you have to close twice.
const STORAGE_KEY = 'kms.androidBanner.dismissed';

const GROUP_URL = 'https://groups.google.com/g/killmystartup-testers';
const OPT_IN_URL = 'https://play.google.com/apps/testing/today.killmystartup.app';
const INSTALL_URL = 'https://play.google.com/store/apps/details?id=today.killmystartup.app';

function wasDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function AndroidBanner() {
  const [open, setOpen] = useState(() => !wasDismissed());

  const dismiss = () => {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // Private mode — the card simply reappears next visit.
    }
  };

  if (!open) return null;

  const steps: Array<[string, string]> = [
    ['Join the tester group', GROUP_URL],
    ['Become a tester', OPT_IN_URL],
    ['Install from Play', INSTALL_URL],
  ];

  return (
    // This page predates the mobile layout and overflows horizontally on phones,
    // which makes a right-anchored card drift off screen. A full-width fixed
    // wrapper pinned with inset-x-0 gives a reliable box to lay the card out in,
    // and pointer-events-none keeps the empty area click-through.
    <div className="fixed z-30 inset-x-0 bottom-0 flex justify-end p-4 sm:p-6 pointer-events-none">
    <div className="pointer-events-auto w-full max-w-xs max-h-[70dvh] overflow-y-auto border border-border bg-[hsl(0,0%,4%)] p-5 animate-fade-in-up relative">
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center text-muted-foreground/50 hover:text-foreground font-mono text-sm transition-colors duration-200"
      >
        ×
      </button>

      <div className="flex items-center gap-2 mb-3">
        <span className="w-1.5 h-1.5 bg-[hsl(0,72%,45%)] rounded-full" />
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono">
          Now on Android
        </p>
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed mb-4">
        KillMyStartup is in <span className="text-foreground">closed testing</span> on
        Google Play. Get it on your phone — and help it reach production.
      </p>

      <ol className="space-y-2 mb-4">
        {steps.map(([label, href], i) => (
          <li key={href} className="flex gap-3">
            <span className="text-[10px] font-mono text-muted-foreground/40 mt-0.5 shrink-0">
              {i + 1}.
            </span>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2 decoration-muted-foreground/30 hover:decoration-foreground transition-colors duration-200"
            >
              {label}
            </a>
          </li>
        ))}
      </ol>

      <div className="h-px bg-border mb-3" />

      <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
        Steps must be done in order. Please keep the app installed for 14 days —
        that's what unlocks the public release.
      </p>
    </div>
    </div>
  );
}
