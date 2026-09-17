// Signature checks for the two inbound callbacks. Both are pure functions of
// their inputs so they can be unit-tested without a network.

const enc = new TextEncoder();

function hex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ElevenLabs post-call webhook: header "elevenlabs-signature: t=<unix>,v0=<hex>"
// where v0 = HMAC-SHA256(secret, `${t}.${rawBody}`). Same recipe as the
// official SDK's constructEvent, including the 30-minute tolerance.
export async function verifyElevenLabsSignature(
  rawBody: string,
  header: string | null,
  secret: string,
  now: number = Date.now(),
): Promise<boolean> {
  if (!header || !secret) return false;
  const parts = header.split(',');
  const t = parts.find((p) => p.startsWith('t='))?.slice(2);
  const v0 = parts.find((p) => p.startsWith('v0='))?.slice(3);
  if (!t || !v0) return false;
  const ts = Number(t) * 1000;
  if (!Number.isFinite(ts) || ts < now - 30 * 60 * 1000) return false;

  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${t}.${rawBody}`));
  return constantTimeEqual(hex(sig), v0);
}

// --- AdMob rewarded-ad server-side verification -----------------------------

export interface AdmobKey {
  keyId: number | string;
  base64: string; // SPKI DER, base64
}

// Typed as Uint8Array<ArrayBuffer> so WebCrypto accepts it as a BufferSource.
function fromBase64(s: string): Uint8Array<ArrayBuffer> {
  const normalised = s.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalised + '='.repeat((4 - (normalised.length % 4)) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// WebCrypto wants r||s (64 bytes for P-256); AdMob sends an ASN.1 DER SEQUENCE.
export function derToRaw(der: Uint8Array, size = 32): Uint8Array<ArrayBuffer> {
  if (der[0] !== 0x30) throw new Error('not a DER sequence');
  let i = 2;
  if (der[1] & 0x80) i += der[1] & 0x7f;
  const out = new Uint8Array(new ArrayBuffer(size * 2));
  for (let part = 0; part < 2; part++) {
    if (der[i++] !== 0x02) throw new Error('expected DER integer');
    let len = der[i++];
    if (len & 0x80) {
      const n = len & 0x7f;
      len = 0;
      for (let k = 0; k < n; k++) len = (len << 8) | der[i++];
    }
    let start = i;
    // Strip leading zeros used for sign, then right-align into the slot.
    while (len > size && der[start] === 0) { start++; len--; }
    out.set(der.subarray(start, start + len), part * size + (size - len));
    i = start + len;
  }
  return out;
}

// The signed content is the query string up to (not including) "&signature=".
// AdMob always puts signature and key_id last, in that order.
export function admobSignedContent(url: URL): string | null {
  const q = url.search.startsWith('?') ? url.search.slice(1) : url.search;
  const idx = q.indexOf('&signature=');
  if (idx <= 0) return null;
  return q.slice(0, idx);
}

export async function verifyAdmobSignature(url: URL, keys: AdmobKey[]): Promise<boolean> {
  const content = admobSignedContent(url);
  const signature = url.searchParams.get('signature');
  const keyId = url.searchParams.get('key_id');
  if (!content || !signature || !keyId) return false;
  const key = keys.find((k) => String(k.keyId) === keyId);
  if (!key) return false;
  try {
    const pub = await crypto.subtle.importKey('spki', fromBase64(key.base64), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    const raw = derToRaw(fromBase64(signature));
    return await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, pub, raw, enc.encode(content));
  } catch {
    return false;
  }
}

// Keys rotate; Google asks that they are cached no longer than 24 hours.
let keyCache: { at: number; keys: AdmobKey[] } | null = null;
export async function admobKeys(): Promise<AdmobKey[]> {
  if (keyCache && Date.now() - keyCache.at < 12 * 60 * 60 * 1000) return keyCache.keys;
  const res = await fetch('https://www.gstatic.com/admob/reward/verifier-keys.json');
  if (!res.ok) throw new Error(`verifier keys: ${res.status}`);
  const body = (await res.json()) as { keys: AdmobKey[] };
  keyCache = { at: Date.now(), keys: body.keys };
  return body.keys;
}
