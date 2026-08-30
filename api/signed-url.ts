import { bearerToken, verifyIdToken } from './_auth';
import { SECOND_CAP } from '../src/lib/quota';

export const config = { runtime: 'edge' };

// The Android build (Capacitor) serves the app from https://localhost, so its
// calls here are cross-origin and need explicit CORS approval.
const ALLOWED_ORIGINS = new Set([
  'https://localhost',
  'capacitor://localhost',
  'http://localhost:5173',
  'https://killmystartup.today',
  'https://www.killmystartup.today',
]);

function corsHeaders(origin: string | null): Record<string, string> {
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Vary': 'Origin',
  };
}

export default async function handler(request: Request) {
  const cors = corsHeaders(request.headers.get('origin'));

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: { ...cors, 'Access-Control-Allow-Methods': 'GET, OPTIONS' },
    });
  }

  const json = { 'Content-Type': 'application/json', ...cors };

  const agentId = process.env.ELEVENLABS_AGENT_ID;
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!agentId || !apiKey) {
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500,
      headers: json,
    });
  }

  // A signed-in caller is held to the account's minute allowance. An anonymous
  // one is not gated here at all: with no identity there is nothing to count
  // against, so the free allowance is enforced client-side and this endpoint
  // stays open to first-time visitors. Making sign-in mandatory is what would
  // actually close it.
  const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
  const token = bearerToken(request);

  if (token && firebaseProjectId) {
    const user = await verifyIdToken(token, firebaseProjectId);

    // A token was offered and did not check out. Failing closed here matters:
    // treating an invalid token as "anonymous" would let anyone past the cap by
    // corrupting their own token.
    if (!user) {
      return new Response(JSON.stringify({ error: 'Not signed in' }), {
        status: 401,
        headers: json,
      });
    }

    const secondsUsed = await readSecondsUsed(firebaseProjectId, user.uid, token);

    if (secondsUsed !== undefined && secondsUsed >= SECOND_CAP) {
      return new Response(
        JSON.stringify({ error: 'out-of-minutes', secondsUsed }),
        { status: 403, headers: json },
      );
    }
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`,
    { headers: { 'xi-api-key': apiKey } }
  );

  if (!response.ok) {
    return new Response(JSON.stringify({ error: 'Failed to get signed URL' }), {
      status: 502,
      headers: json,
    });
  }

  const { signed_url } = await response.json() as { signed_url: string };

  return new Response(JSON.stringify({ signedUrl: signed_url }), {
    headers: json,
  });
}

// Reads the caller's own usage document with the caller's own token, so the
// function needs no service-account credentials. An unreadable document returns
// undefined and the session is allowed: a Firestore outage should not take the
// whole product down with it.
async function readSecondsUsed(
  firebaseProjectId: string,
  uid: string,
  token: string,
): Promise<number | undefined> {
  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/usage/${uid}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    // No document yet means a brand new account that has not spoken.
    if (res.status === 404) return 0;
    if (!res.ok) return undefined;

    const body = await res.json() as { fields?: { secondsUsed?: { integerValue?: string } } };
    const value = Number(body.fields?.secondsUsed?.integerValue);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return undefined;
  }
}
