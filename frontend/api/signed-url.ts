export const config = { runtime: 'edge' };

export default async function handler() {
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!agentId || !apiKey) {
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`,
    { headers: { 'xi-api-key': apiKey } }
  );

  if (!response.ok) {
    return new Response(JSON.stringify({ error: 'Failed to get signed URL' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { signed_url } = await response.json() as { signed_url: string };

  return new Response(JSON.stringify({ signedUrl: signed_url }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
