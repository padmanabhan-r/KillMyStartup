export const config = { runtime: 'edge' };

import { db } from './_lib/db';
import { getUserId } from './_lib/identity';
import { clientIp, error, json, preflight } from './_lib/http';
import { AD_REWARD_SECONDS, PACK_SECONDS, TRIAL_SECONDS, ensureUser } from './_lib/ledger';
import { getBalance } from './_lib/revenuecat';

// Everything the app needs to draw its meter and paywall. Also where a new
// device gets its free trial.
export default async function handler(request: Request) {
  const pre = preflight(request);
  if (pre) return pre;
  if (request.method !== 'GET') return error(request, 405, 'method-not-allowed');

  const userId = getUserId(request);
  if (!userId) return error(request, 400, 'identity-required');

  try {
    const sql = db();
    await ensureUser(sql, userId, clientIp(request));
    const balanceSeconds = await getBalance(userId);
    return json(request, 200, {
      userId,
      balanceSeconds,
      trialSeconds: TRIAL_SECONDS,
      pack: { seconds: PACK_SECONDS },
      ads: {
        enabled: process.env.ADS_ENABLED === 'true' && !!process.env.ADMOB_REWARDED_UNIT_ID,
        adUnitId: process.env.ADMOB_REWARDED_UNIT_ID ?? null,
        rewardSeconds: AD_REWARD_SECONDS,
      },
    });
  } catch (err) {
    console.error('me failed', err);
    return error(request, 502, 'upstream', 'Could not load your account');
  }
}
