export const config = { runtime: 'edge' };

// The Android build (Capacitor) serves the app from https://localhost, so its
// calls here are cross-origin and need explicit CORS approval.
const ALLOWED_ORIGINS = new Set([
  'https://localhost',
  'capacitor://localhost',
  'http://localhost:5173',
  'https://killmystartup.today',
  'https://www.killmystartup.today',
]);

function corsHeaders(origin: string | null): Record<string, string> {
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Vary': 'Origin',
  };
}

export default async function handler(request: Request) {
  const cors = corsHeaders(request.headers.get('origin'));

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: { ...cors, 'Access-Control-Allow-Methods': 'GET, OPTIONS' },
    });
  }

  const json = { 'Content-Type': 'application/json', ...cors };

  const agentId = process.env.ELEVENLABS_AGENT_ID;
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!agentId || !apiKey) {
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500,
      headers: json,
    });
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`,
    { headers: { 'xi-api-key': apiKey } }
  );

  if (!response.ok) {
    return new Response(JSON.stringify({ error: 'Failed to get signed URL' }), {
      status: 502,
      headers: json,
    });
  }

  const { signed_url } = await response.json() as { signed_url: string };

  return new Response(JSON.stringify({ signedUrl: signed_url }), {
    headers: json,
  });
}
