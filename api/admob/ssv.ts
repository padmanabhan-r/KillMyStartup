export const config = { runtime: 'edge' };

import { db } from '../_lib/db';
import { isUserId } from '../_lib/identity';
import { grantAdReward } from '../_lib/ledger';
import { admobKeys, verifyAdmobSignature } from '../_lib/verify';

// AdMob calls this after a rewarded ad completes. The signature proves it was
// AdMob; the transaction id makes retries harmless.
export default async function handler(request: Request) {
  if (request.method !== 'GET') return new Response('method not allowed', { status: 405 });
  const url = new URL(request.url);

  let valid = false;
  try {
    valid = await verifyAdmobSignature(url, await admobKeys());
  } catch (err) {
    console.error('ssv: key fetch failed', err);
    return new Response('error', { status: 500 });
  }
  if (!valid) return new Response('invalid signature', { status: 403 });

  const userId = url.searchParams.get('user_id');
  const transactionId = url.searchParams.get('transaction_id');
  if (!isUserId(userId) || !transactionId) return new Response('bad request', { status: 400 });

  try {
    const result = await grantAdReward(db(), userId, transactionId);
    return new Response(result, { status: 200 });
  } catch (err) {
    console.error('ssv: grant failed', err);
    return new Response('error', { status: 500 });
  }
}
