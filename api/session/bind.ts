export const config = { runtime: 'edge' };

import { db } from '../_lib/db';
import { getUserId } from '../_lib/identity';
import { error, json, preflight, readJson } from '../_lib/http';
import { bindSession } from '../_lib/ledger';

// Ties the ticket to the conversation the agent platform opened, so the
// post-call webhook can find whose seconds to charge.
export default async function handler(request: Request) {
  const pre = preflight(request);
  if (pre) return pre;
  if (request.method !== 'POST') return error(request, 405, 'method-not-allowed');

  const userId = getUserId(request);
  if (!userId) return error(request, 400, 'identity-required');
  const body = await readJson<{ sessionId?: string; conversationId?: string }>(request);
  if (!body?.sessionId || !body.conversationId) return error(request, 400, 'bad-request');

  try {
    const ok = await bindSession(db(), userId, body.sessionId, body.conversationId);
    return json(request, ok ? 200 : 404, { ok });
  } catch (err) {
    console.error('session/bind failed', err);
    return error(request, 502, 'upstream');
  }
}
