export const config = { runtime: 'edge' };

import { db } from '../_lib/db';
import { chargeSession, findSession } from '../_lib/ledger';
import { verifyElevenLabsSignature } from '../_lib/verify';

interface PostCallEvent {
  type?: string;
  data?: {
    conversation_id?: string;
    metadata?: { call_duration_secs?: number };
  };
}

// The platform's own account of the call. Authoritative for duration; the
// client's earlier report is treated as a floor.
export default async function handler(request: Request) {
  if (request.method !== 'POST') return new Response('method not allowed', { status: 405 });
  const secret = process.env.ELEVENLABS_WEBHOOK_SECRET ?? '';
  const raw = await request.text();
  const ok = await verifyElevenLabsSignature(raw, request.headers.get('elevenlabs-signature'), secret);
  if (!ok) return new Response('invalid signature', { status: 401 });

  let event: PostCallEvent;
  try {
    event = JSON.parse(raw) as PostCallEvent;
  } catch {
    return new Response('bad json', { status: 400 });
  }
  if (event.type !== 'post_call_transcription') return new Response('ignored', { status: 200 });

  const conversationId = event.data?.conversation_id;
  const duration = event.data?.metadata?.call_duration_secs;
  if (!conversationId || typeof duration !== 'number') return new Response('ignored', { status: 200 });

  try {
    const sql = db();
    const session = await findSession(sql, { conversationId });
    if (!session) {
      console.warn('webhook: unknown conversation', conversationId);
      return new Response('unknown conversation', { status: 200 });
    }
    await chargeSession(sql, session, duration, 'webhook');
    return new Response('ok', { status: 200 });
  } catch (err) {
    console.error('webhook failed', err);
    // 5xx makes the platform retry, which is what we want for a transient failure.
    return new Response('error', { status: 500 });
  }
}
