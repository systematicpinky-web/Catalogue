import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { relayToGas } from './server/gasRelay.js'
import { fetchDriveImage, IMAGE_CACHE_CONTROL } from './server/driveImage.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        // Mirrors api/image.js so `npm run dev` serves images through the same proxy.
        name: 'drive-image-dev-middleware',
        configureServer(server) {
          server.middlewares.use('/api/image', async (req, res) => {
            const url = new URL(req.url, 'http://localhost')
            try {
              const { buffer, contentType } = await fetchDriveImage(
                url.searchParams.get('id'),
                url.searchParams.get('w'),
              )
              res.statusCode = 200
              res.setHeader('Content-Type', contentType)
              res.setHeader('Cache-Control', IMAGE_CACHE_CONTROL)
              res.end(buffer)
            } catch (err) {
              res.statusCode = 502
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: err.message }))
            }
          })
        },
      },
      {
        // Mirrors api/gas.js (the Vercel serverless function) so `npm run dev`
        // exercises the same POST-relay path used in production.
        name: 'gas-relay-dev-middleware',
        configureServer(server) {
          server.middlewares.use('/api/gas', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405
              res.end(JSON.stringify({ success: false, error: 'METHOD_NOT_ALLOWED', message: 'Use POST' }))
              return
            }

            const gasUrl = env.VITE_API_BASE_URL
            const url = new URL(req.url, 'http://localhost')
            const action = url.searchParams.get('action')

            let raw = ''
            req.on('data', (chunk) => { raw += chunk })
            req.on('end', async () => {
              try {
                const payload = raw ? JSON.parse(raw) : {}
                const { status, body } = await relayToGas(gasUrl, action, payload)
                res.statusCode = status === 200 ? 200 : status
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify(body))
              } catch (err) {
                res.statusCode = 502
                res.end(JSON.stringify({ success: false, error: 'BAD_GATEWAY', message: err.message }))
              }
            })
          })
        },
      },
    ],
  }
})
