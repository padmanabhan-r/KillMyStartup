import { describe, expect, it } from 'vitest';
import { admobSignedContent, derToRaw, verifyAdmobSignature, verifyElevenLabsSignature } from '../_lib/verify';

const enc = new TextEncoder();
const hex = (b: ArrayBuffer) => Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, '0')).join('');
const b64 = (b: Uint8Array | ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(b)));

async function sign(secret: string, t: number, body: string) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return `t=${t},v0=${hex(await crypto.subtle.sign('HMAC', key, enc.encode(`${t}.${body}`)))}`;
}

describe('ElevenLabs webhook signature', () => {
  const body = '{"type":"post_call_transcription","data":{"conversation_id":"c1"}}';
  const now = 1_800_000_000_000;
  const t = Math.floor(now / 1000) - 5;

  it('accepts a fresh, correctly signed body', async () => {
    expect(await verifyElevenLabsSignature(body, await sign('s3cret', t, body), 's3cret', now)).toBe(true);
  });
  it('rejects a tampered body', async () => {
    expect(await verifyElevenLabsSignature(body + ' ', await sign('s3cret', t, body), 's3cret', now)).toBe(false);
  });
  it('rejects the wrong secret', async () => {
    expect(await verifyElevenLabsSignature(body, await sign('other', t, body), 's3cret', now)).toBe(false);
  });
  it('rejects a stale timestamp', async () => {
    const old = Math.floor(now / 1000) - 31 * 60;
    expect(await verifyElevenLabsSignature(body, await sign('s3cret', old, body), 's3cret', now)).toBe(false);
  });
  it('rejects a missing header or secret', async () => {
    expect(await verifyElevenLabsSignature(body, null, 's3cret', now)).toBe(false);
    expect(await verifyElevenLabsSignature(body, await sign('s3cret', t, body), '', now)).toBe(false);
  });
});

// Encodes a raw r||s ECDSA signature as DER, the way AdMob sends it.
function rawToDer(raw: Uint8Array): Uint8Array {
  const int = (bytes: Uint8Array) => {
    let i = 0;
    while (i < bytes.length - 1 && bytes[i] === 0) i++;
    let v = bytes.subarray(i);
    if (v[0] & 0x80) v = new Uint8Array([0, ...v]);
    return new Uint8Array([0x02, v.length, ...v]);
  };
  const r = int(raw.subarray(0, 32));
  const s = int(raw.subarray(32));
  return new Uint8Array([0x30, r.length + s.length, ...r, ...s]);
}

describe('AdMob SSV signature', () => {
  const content = 'ad_network=5450213213286189855&ad_unit=1234&reward_amount=1&reward_item=minutes&timestamp=1507778230&transaction_id=abc123&user_id=deadbeefcafef00d';

  async function makeCallback() {
    const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    const spki = await crypto.subtle.exportKey('spki', pair.publicKey);
    const raw = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, pair.privateKey, enc.encode(content)));
    const sig = encodeURIComponent(b64(rawToDer(raw)));
    const url = new URL(`https://www.killmystartup.today/api/admob/ssv?${content}&signature=${sig}&key_id=42`);
    return { url, keys: [{ keyId: 42, base64: b64(spki) }] };
  }

  it('extracts the signed content', async () => {
    const { url } = await makeCallback();
    expect(admobSignedContent(url)).toBe(content);
  });
  it('round-trips DER to raw', () => {
    const raw = new Uint8Array(64).map((_, i) => (i * 37 + 1) & 0xff);
    expect(Array.from(derToRaw(rawToDer(raw)))).toEqual(Array.from(raw));
  });
  it('accepts a valid signature', async () => {
    const { url, keys } = await makeCallback();
    expect(await verifyAdmobSignature(url, keys)).toBe(true);
  });
  it('rejects a tampered parameter', async () => {
    const { url, keys } = await makeCallback();
    const bad = new URL(url.toString().replace('user_id=deadbeefcafef00d', 'user_id=someoneelse00'));
    expect(await verifyAdmobSignature(bad, keys)).toBe(false);
  });
  it('rejects an unknown key id', async () => {
    const { url, keys } = await makeCallback();
    expect(await verifyAdmobSignature(url, [{ ...keys[0], keyId: 43 }])).toBe(false);
  });
});
