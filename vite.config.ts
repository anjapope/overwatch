import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, type ViteDevServer } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

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
    serveCesiumAssets(),
    react(),
    viteStaticCopy({
      targets: [
        { src: path.join(cesiumBuildPath, 'Workers'), dest: cesiumBasePath },
        { src: path.join(cesiumBuildPath, 'Assets'), dest: cesiumBasePath },
        { src: path.join(cesiumBuildPath, 'Widgets'), dest: cesiumBasePath },
        { src: path.join(cesiumBuildPath, 'ThirdParty'), dest: cesiumBasePath },
      ],
    }),
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
