export const config = { runtime: 'edge' };

import { db } from '../_lib/db';
import { getUserId } from '../_lib/identity';
import { clientIp, error, json, preflight, readJson } from '../_lib/http';
import { MAX_SESSION_SECONDS, ensureUser, recentSessionCount, startSession } from '../_lib/ledger';
import { getBalance } from '../_lib/revenuecat';

const STARTS_PER_MINUTE = 6;

export async function fetchSignedUrl(): Promise<string> {
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!agentId || !apiKey) throw new Error('ELEVENLABS_AGENT_ID / ELEVENLABS_API_KEY are not set');
  const res = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`,
    { headers: { 'xi-api-key': apiKey } },
  );
  if (!res.ok) throw new Error(`signed url: ${res.status}`);
  const { signed_url } = (await res.json()) as { signed_url: string };
  return signed_url;
}

// Gate + ticket. A session only starts with seconds in the bank, and the
// client is told exactly how long it may run before it must hang up.
export default async function handler(request: Request) {
  const pre = preflight(request);
  if (pre) return pre;
  if (request.method !== 'POST') return error(request, 405, 'method-not-allowed');

  const userId = getUserId(request);
  if (!userId) return error(request, 400, 'identity-required');
  const body = (await readJson<{ mode?: string }>(request)) ?? {};
  const mode = body.mode === 'text' ? 'text' : 'voice';

  try {
    const sql = db();
    await ensureUser(sql, userId, clientIp(request));
    if ((await recentSessionCount(sql, userId)) >= STARTS_PER_MINUTE) {
      return error(request, 429, 'too-many-sessions', 'Slow down a little.');
    }
    const balanceSeconds = await getBalance(userId);
    if (balanceSeconds <= 0) {
      return json(request, 402, { error: 'You are out of minutes.', reason: 'out-of-minutes', balanceSeconds: 0 });
    }
    const allowanceSeconds = Math.min(balanceSeconds, MAX_SESSION_SECONDS);
    const signedUrl = await fetchSignedUrl();
    const sessionId = await startSession(sql, userId, mode, allowanceSeconds);
    return json(request, 200, { signedUrl, sessionId, allowanceSeconds, balanceSeconds });
  } catch (err) {
    console.error('session/start failed', err);
    return error(request, 502, 'upstream', 'Could not start the session');
  }
}
