export const config = { runtime: 'edge' };

import { db } from '../_lib/db';
import { getUserId } from '../_lib/identity';
import { error, json, preflight, readJson } from '../_lib/http';
import { chargeSession, findSession } from '../_lib/ledger';

// The client's own report of how long it talked. Charged immediately, capped
// at the allowance it was given; the webhook later reconciles against the
// platform's figure, which can only add.
export default async function handler(request: Request) {
  const pre = preflight(request);
  if (pre) return pre;
  if (request.method !== 'POST') return error(request, 405, 'method-not-allowed');

  const userId = getUserId(request);
  if (!userId) return error(request, 400, 'identity-required');
  const body = await readJson<{ sessionId?: string; elapsedSeconds?: number }>(request);
  if (!body?.sessionId || typeof body.elapsedSeconds !== 'number') return error(request, 400, 'bad-request');

  try {
    const sql = db();
    const session = await findSession(sql, { sessionId: body.sessionId, userId });
    if (!session) return error(request, 404, 'not-found');
    const seconds = Math.min(Math.max(0, body.elapsedSeconds), session.allowance_seconds);
    const balanceSeconds = await chargeSession(sql, session, seconds, 'client');
    return json(request, 200, { balanceSeconds });
  } catch (err) {
    console.error('session/end failed', err);
    return error(request, 502, 'upstream');
  }
}
