import type { Sql } from './db';
import { adjust, getBalance } from './revenuecat';
import { envInt } from './http';

export const TRIAL_SECONDS = envInt('TRIAL_SECONDS', 600);
export const AD_REWARD_SECONDS = envInt('AD_REWARD_SECONDS', 300);
export const PACK_SECONDS = 1800;
// Longest single conversation; also the agent's max_duration_seconds.
export const MAX_SESSION_SECONDS = 1800;
// New device ids that may claim a free trial from one IP per day.
const TRIALS_PER_IP_PER_DAY = 3;

export interface SessionRow {
  id: string;
  user_id: string;
  conversation_id: string | null;
  allowance_seconds: number;
  charged_seconds: number;
}

// Creates the user on first sight and grants the trial once. The grant is
// recorded only after RevenueCat accepts it, so a failed grant is retried on
// the next call instead of being lost.
export async function ensureUser(sql: Sql, userId: string, ip: string): Promise<void> {
  await sql`INSERT INTO users (user_id, first_ip) VALUES (${userId}, ${ip}) ON CONFLICT (user_id) DO NOTHING`;
  const rows = (await sql`SELECT trial_granted_at, first_ip FROM users WHERE user_id = ${userId}`) as {
    trial_granted_at: string | null;
    first_ip: string | null;
  }[];
  if (rows[0]?.trial_granted_at) return;

  const recent = (await sql`
    SELECT count(*)::int AS n FROM users
    WHERE first_ip = ${ip} AND trial_granted_at IS NOT NULL AND created_at > now() - interval '1 day'
  `) as { n: number }[];
  if ((recent[0]?.n ?? 0) >= TRIALS_PER_IP_PER_DAY) return;

  await adjust(userId, TRIAL_SECONDS);
  await sql`UPDATE users SET trial_granted_at = now() WHERE user_id = ${userId} AND trial_granted_at IS NULL`;
}

export async function recentSessionCount(sql: Sql, userId: string): Promise<number> {
  const rows = (await sql`
    SELECT count(*)::int AS n FROM sessions
    WHERE user_id = ${userId} AND created_at > now() - interval '1 minute'
  `) as { n: number }[];
  return rows[0]?.n ?? 0;
}

export async function startSession(sql: Sql, userId: string, mode: string, allowance: number): Promise<string> {
  const rows = (await sql`
    INSERT INTO sessions (user_id, mode, allowance_seconds) VALUES (${userId}, ${mode}, ${allowance}) RETURNING id
  `) as { id: string }[];
  return rows[0].id;
}

export async function bindSession(sql: Sql, userId: string, sessionId: string, conversationId: string): Promise<boolean> {
  const rows = (await sql`
    UPDATE sessions SET conversation_id = ${conversationId}
    WHERE id = ${sessionId}::uuid AND user_id = ${userId} AND conversation_id IS NULL
    RETURNING id
  `) as { id: string }[];
  return rows.length > 0;
}

export async function findSession(
  sql: Sql,
  by: { sessionId: string; userId: string } | { conversationId: string },
): Promise<SessionRow | null> {
  const rows = ('sessionId' in by
    ? await sql`SELECT id, user_id, conversation_id, allowance_seconds, charged_seconds FROM sessions WHERE id = ${by.sessionId}::uuid AND user_id = ${by.userId}`
    : await sql`SELECT id, user_id, conversation_id, allowance_seconds, charged_seconds FROM sessions WHERE conversation_id = ${by.conversationId}`) as SessionRow[];
  return rows[0] ?? null;
}

// How much more to charge when a session that has already been charged
// `charged` seconds turns out to have lasted `total` seconds. Never negative:
// a shorter later report does not refund (the earlier figure was a floor).
export function chargeDelta(total: number, charged: number): number {
  const t = Math.max(0, Math.round(total));
  return Math.max(0, t - Math.max(0, charged));
}

// Charges a session up to `totalSeconds`, idempotently. The row is moved first
// with a compare-and-set so two reports (client + webhook) cannot both bill the
// same seconds; if RevenueCat then refuses, the row is moved back.
export async function chargeSession(sql: Sql, session: SessionRow, totalSeconds: number, source: string): Promise<number> {
  const delta = chargeDelta(totalSeconds, session.charged_seconds);
  if (delta === 0) {
    await sql`UPDATE sessions SET ended_at = coalesce(ended_at, now()) WHERE id = ${session.id}::uuid`;
    return getBalance(session.user_id);
  }
  const next = session.charged_seconds + delta;
  const moved = (await sql`
    UPDATE sessions SET charged_seconds = ${next}, charge_source = ${source}, ended_at = now()
    WHERE id = ${session.id}::uuid AND charged_seconds = ${session.charged_seconds}
    RETURNING id
  `) as { id: string }[];
  if (moved.length === 0) {
    // Someone else charged in between; re-read and let them win.
    return getBalance(session.user_id);
  }
  try {
    await adjust(session.user_id, -delta);
  } catch (err) {
    await sql`UPDATE sessions SET charged_seconds = ${session.charged_seconds} WHERE id = ${session.id}::uuid`;
    throw err;
  }
  return getBalance(session.user_id);
}

// Grants a rewarded-ad reward once per AdMob transaction id.
export async function grantAdReward(sql: Sql, userId: string, transactionId: string): Promise<'granted' | 'duplicate'> {
  const rows = (await sql`
    INSERT INTO ad_rewards (transaction_id, user_id, seconds) VALUES (${transactionId}, ${userId}, ${AD_REWARD_SECONDS})
    ON CONFLICT (transaction_id) DO NOTHING RETURNING transaction_id
  `) as { transaction_id: string }[];
  if (rows.length === 0) return 'duplicate';
  try {
    await adjust(userId, AD_REWARD_SECONDS);
  } catch (err) {
    await sql`DELETE FROM ad_rewards WHERE transaction_id = ${transactionId}`;
    throw err;
  }
  return 'granted';
}
