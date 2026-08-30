import type { User } from 'firebase/auth';
import { projectId } from './firebase';

// Usage is one document per account. It is read and written over the Firestore
// REST API with the caller's own ID token rather than through firebase/firestore
// — a single counter does not justify the bundle weight of the whole SDK, and
// the Edge function has to speak REST anyway.

const ANON_SESSIONS_KEY = 'kms.anonSessions';

export interface Usage {
  secondsUsed: number;
}

function documentPath(uid: string): string {
  return `projects/${projectId}/databases/(default)/documents/usage/${uid}`;
}

function documentUrl(uid: string): string {
  return `https://firestore.googleapis.com/v1/${documentPath(uid)}`;
}

// Firestore returns integers as strings; anything unparseable is treated as no
// usage rather than NaN, which would silently poison every later comparison.
export function parseSeconds(doc: unknown): number {
  const raw = (doc as { fields?: { secondsUsed?: { integerValue?: string } } })
    ?.fields?.secondsUsed?.integerValue;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export async function readUsage(user: User): Promise<Usage> {
  const token = await user.getIdToken();
  const res = await fetch(documentUrl(user.uid), {
    headers: { Authorization: `Bearer ${token}` },
  });

  // A user who has never spoken has no document yet. That is the normal first
  // run, not an error.
  if (res.status === 404) return { secondsUsed: 0 };
  if (!res.ok) throw new Error(`Could not read usage (${res.status})`);

  return { secondsUsed: parseSeconds(await res.json()) };
}

export async function addUsage(user: User, seconds: number): Promise<void> {
  const rounded = Math.max(0, Math.round(seconds));
  if (rounded === 0) return;

  const token = await user.getIdToken();

  // update + updateTransforms in one commit creates the document if it is
  // missing and increments atomically, so two devices cannot clobber each
  // other's totals the way a read-then-write would.
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:commit`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        writes: [
          {
            update: {
              name: documentPath(user.uid),
              fields: {
                email: { stringValue: user.email ?? '' },
                updatedAt: { timestampValue: new Date().toISOString() },
              },
            },
            updateMask: { fieldPaths: ['email', 'updatedAt'] },
            updateTransforms: [
              { fieldPath: 'secondsUsed', increment: { integerValue: String(rounded) } },
            ],
          },
        ],
      }),
    },
  );

  if (!res.ok) throw new Error(`Could not record usage (${res.status})`);
}

// The anonymous allowance is per-device and unenforceable — clearing storage
// resets it. It exists to delay the consent screen for a first-time visitor,
// not to stop anyone determined.
export function anonSessionsUsed(): number {
  try {
    return Number(localStorage.getItem(ANON_SESSIONS_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function recordAnonSession(): void {
  try {
    localStorage.setItem(ANON_SESSIONS_KEY, String(anonSessionsUsed() + 1));
  } catch {
    // Private mode — the visitor simply keeps their allowance.
  }
}
