import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        name: 'local-api',
        configureServer(server) {
          server.middlewares.use('/api/signed-url', async (_req, res) => {
            try {
              const response = await fetch(
                `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${env.ELEVENLABS_AGENT_ID}`,
                { headers: { 'xi-api-key': env.ELEVENLABS_API_KEY } }
              )
              const data = await response.json() as { signed_url: string }
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ signedUrl: data.signed_url }))
            } catch {
              res.statusCode = 500
              res.end(JSON.stringify({ error: 'Failed to get signed URL' }))
            }
          })
        },
      },
    ],
  }
})
