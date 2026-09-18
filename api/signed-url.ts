export const config = { runtime: 'edge' };

import { db } from './_lib/db';
import { getUserId } from './_lib/identity';
import { clientIp, error, json, preflight } from './_lib/http';
import { ensureUser } from './_lib/ledger';
import { getBalance } from './_lib/revenuecat';
import { fetchSignedUrl } from './session/start';

// Legacy route kept for the website while it moves to /api/session/start.
// Same identity and balance gate; no session ticket, so nothing is charged.
// Remove once the site is on the session routes.
//
// Android 1.x builds call this with no identity header and meter time on the
// device. Until 2.0 has replaced them, such a request is served the old way.
// Set LEGACY_UNMETERED=false in Vercel to close that path.
const LEGACY_UNMETERED = process.env.LEGACY_UNMETERED !== 'false';

export default async function handler(request: Request) {
  const pre = preflight(request);
  if (pre) return pre;
  if (request.method !== 'GET') return error(request, 405, 'method-not-allowed');

  const userId = getUserId(request);
  if (!userId) {
    // A header that is present but malformed is never a 1.x build.
    if (!LEGACY_UNMETERED || request.headers.has('x-kms-user')) {
      return error(request, 400, 'identity-required');
    }
    try {
      return json(request, 200, { signedUrl: await fetchSignedUrl() });
    } catch (err) {
      console.error('signed-url (legacy) failed', err);
      return error(request, 502, 'upstream', 'Failed to get signed URL');
    }
  }

  try {
    const sql = db();
    await ensureUser(sql, userId, clientIp(request));
    if ((await getBalance(userId)) <= 0) {
      return json(request, 402, { error: 'You are out of minutes.', reason: 'out-of-minutes', balanceSeconds: 0 });
    }
    return json(request, 200, { signedUrl: await fetchSignedUrl() });
  } catch (err) {
    console.error('signed-url failed', err);
    return error(request, 502, 'upstream', 'Failed to get signed URL');
  }
}
