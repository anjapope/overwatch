import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, type ViteDevServer } from 'vite'

const currentDirname = path.dirname(fileURLToPath(import.meta.url))
const cesiumBasePath = 'cesium'
const cesiumBuildPath = path.resolve(
  currentDirname,
  'node_modules/cesium/Build/CesiumUnminified',
)

const contentTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ktx2': 'application/octet-stream',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8',
}

function serveCesiumAssets() {
  return {
    name: 'overwatch-cesium-dev-assets',
    configureServer(server: ViteDevServer) {
      server.middlewares.use((request, response, next) => {
        if (!request.url?.startsWith('/cesium/')) {
          next()
          return
        }

        const relativePath = decodeURIComponent(request.url.slice('/cesium/'.length))
        const assetPath = path.resolve(cesiumBuildPath, relativePath)

        if (!assetPath.startsWith(cesiumBuildPath) || !fs.existsSync(assetPath) || fs.statSync(assetPath).isDirectory()) {
          next()
          return
        }

        const contentType = contentTypes[path.extname(assetPath).toLowerCase()] ?? 'application/octet-stream'
        response.statusCode = 200
        response.setHeader('Content-Type', contentType)
        response.setHeader('Cache-Control', 'no-cache')

        const stream = fs.createReadStream(assetPath)
        stream.on('error', next)
        stream.pipe(response)
      })
    },
  }
}

function serveIntelligenceObservations() {
  return {
    name: 'overwatch-intelligence-dev-bridge',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/intelligence', async (_request, response) => {
        const baseUrl = process.env.MAYDAY_INTELLIGENCE_PROVIDER_URL
        const token = process.env.MAYDAY_INTELLIGENCE_PROVIDER_TOKEN
        if (!baseUrl || !token) {
          response.statusCode = 503
          response.end(JSON.stringify({ error: 'Mayday Intelligence provider is not configured' }))
          return
        }
        try {
          const upstream = await fetch(new URL('documents?limit=100', `${baseUrl.replace(/\/$/, '')}/`), {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
            signal: AbortSignal.timeout(10_000),
          })
          response.statusCode = upstream.status
          response.setHeader('Content-Type', 'application/json; charset=utf-8')
          response.setHeader('Cache-Control', 'no-store')
          response.end(await upstream.text())
        } catch {
          response.statusCode = 502
          response.end(JSON.stringify({ error: 'Mayday Intelligence provider is unavailable' }))
        }
      })
    },
  }
}

function copyCesiumBuildAssets() {
  return {
    name: 'overwatch-cesium-build-assets',
    closeBundle() {
      for (const directory of ['Workers', 'Assets', 'Widgets', 'ThirdParty']) {
        fs.cpSync(
          path.join(cesiumBuildPath, directory),
          path.join(currentDirname, 'dist', cesiumBasePath, directory),
          { recursive: true },
        )
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  resolve: {
    alias: [{ find: /^cesium$/, replacement: path.join(cesiumBuildPath, 'index.js') }],
  },
  define: {
    CESIUM_BASE_URL: JSON.stringify(cesiumBasePath),
  },
  plugins: [
    serveIntelligenceObservations(),
    serveCesiumAssets(),
    react(),
    copyCesiumBuildAssets(),
  ],
  optimizeDeps: {
    exclude: ['cesium'],
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
})
