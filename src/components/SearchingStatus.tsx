import { useEffect, useState } from 'react';

// While Firecrawl runs, the orb just sits there glowing amber with nothing else
// on screen — on a phone that reads as "stuck", and a tester who thinks the app
// hung closes it and never opens it again. These lines narrate the wait. They
// stay in the critic's voice on purpose: a friendly progress bar would break the
// character the whole product is built on.
const MESSAGES = [
  'Thinking',
  'Searching the live web',
  'Looking for competitors',
  'Checking who built this first',
  'Digging up the ones that died',
  'Reading the funding rounds',
  'Finding ways to kill your startup',
  'Building the case against you',
];

// Once the list runs out we cycle only the tail. Looping back to "Thinking"
// after twenty seconds would undo the point and read as a stuck spinner again.
const TAIL_START = 5;
const INTERVAL_MS = 2200;

// Mounted only while the search is running, so every search opens on "Thinking"
// without the component having to rewind itself.
export function SearchingStatus() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => {
        const next = i + 1;
        if (next < MESSAGES.length) return next;
        return TAIL_START + ((next - TAIL_START) % (MESSAGES.length - TAIL_START));
      });
    }, INTERVAL_MS);

    return () => clearInterval(id);
  }, []);

  return (
    // Anchored under the orb with absolute positioning so appearing and
    // disappearing never nudges the orb or the button.
    <div
      role="status"
      className="absolute top-full left-1/2 -translate-x-1/2 mt-7 w-[320px] max-w-[80vw] flex flex-col items-center gap-2.5"
    >
      <span className="sr-only">Searching the web</span>

      {/* Keyed so React remounts on each message and replays the fade. The line
          lands inside the orb's own amber halo, so it is pitched much lighter
          than kill-amber and carries a dark shadow — plain amber-on-amber is
          invisible at exactly the moment it needs to be read. */}
      <p
        key={index}
        aria-hidden="true"
        className="animate-fade-in-up text-[10px] uppercase tracking-[0.2em] font-mono text-center leading-relaxed"
        style={{
          color: 'hsl(40, 90%, 88%)',
          textShadow: '0 0 14px hsla(0, 0%, 0%, 0.95), 0 0 4px hsla(0, 0%, 0%, 0.9)',
        }}
      >
        {MESSAGES[index]}
      </p>

      <span aria-hidden="true" className="flex gap-1.5">
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            className="w-1 h-1 rounded-full animate-pulse"
            style={{
              backgroundColor: 'hsl(40, 90%, 88%)',
              boxShadow: '0 0 8px hsla(0, 0%, 0%, 0.9)',
              animationDelay: `${dot * 200}ms`,
            }}
          />
        ))}
      </span>
    </div>
  );
}
