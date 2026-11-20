import { app, BrowserWindow, ipcMain, protocol, shell } from 'electron'
import fs from 'node:fs'
import path from 'node:path'

protocol.registerSchemesAsPrivileged([{
  scheme: 'overwatch',
  privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true },
}])

// Ensure single-instance behavior in the desktop runtime. Minimal and
// independent lifecycle protection: if another instance controls the app,
// exit immediately; otherwise listen for second-instance events to focus
// the existing window.
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  // another instance is active — quit this one
  void app.whenReady().then(() => app.quit())
}

app.on('second-instance', () => {
  // when a second instance is attempted, focus the existing main window
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

const devServerUrl = process.env.VITE_DEV_SERVER_URL

let mainWindow: BrowserWindow | null = null

const rendererRoot = path.join(__dirname, '..', '..', 'dist')
const rendererContentTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
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

function installRendererProtocol() {
  protocol.handle('overwatch', request => {
    const url = new URL(request.url)
    if (url.hostname !== 'app') return new Response('Not found', { status: 404 })
    const relativePath = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname)
    const assetPath = path.resolve(rendererRoot, `.${relativePath}`)
    if (!assetPath.startsWith(`${rendererRoot}${path.sep}`)) return new Response('Not found', { status: 404 })
    try {
      const body = fs.readFileSync(assetPath)
      return new Response(body, { headers: { 'Content-Type': rendererContentTypes[path.extname(assetPath).toLowerCase()] ?? 'application/octet-stream' } })
    } catch {
      return new Response('Not found', { status: 404 })
    }
  })
}

interface ProviderConfig { providerUrl?: string; tokenFile?: string }
function localProviderConfig(): ProviderConfig {
  const paths = [
    path.join(app.getPath('userData'), 'provider.json'),
    path.resolve(path.dirname(app.getPath('exe')), '..', '..', '..', 'Overwatch.provider.json'),
  ]
  for (const configPath of paths) {
    try {
      const parsed: unknown = JSON.parse(fs.readFileSync(configPath, 'utf8'))
      if (!parsed || typeof parsed !== 'object') continue
      const config = parsed as Record<string, unknown>
      return {
        providerUrl: typeof config.providerUrl === 'string' ? config.providerUrl : undefined,
        tokenFile: typeof config.tokenFile === 'string' ? config.tokenFile : undefined,
      }
    } catch { /* Try the next local configuration location. */ }
  }
  return {}
}
const localConfig = localProviderConfig()
const providerBaseUrl = process.env.MAYDAY_INTELLIGENCE_PROVIDER_URL
  || app.commandLine.getSwitchValue('mayday-provider-url') || localConfig.providerUrl
const providerTokenFile = app.commandLine.getSwitchValue('mayday-provider-token-file') || localConfig.tokenFile
function readProviderToken(tokenFile?: string) {
  if (!tokenFile) return ''
  try { return fs.readFileSync(tokenFile, 'utf8').trim() } catch { return '' }
}
const providerToken = process.env.MAYDAY_INTELLIGENCE_PROVIDER_TOKEN
  || readProviderToken(providerTokenFile)

function configuredProviderUrl() {
  if (!providerBaseUrl || !providerToken) throw new Error('Mayday Intelligence provider is not configured')
  const url = new URL(providerBaseUrl)
  if (url.protocol !== 'https:' && !['127.0.0.1', 'localhost', '::1'].includes(url.hostname)) {
    throw new Error('Mayday Intelligence provider must use HTTPS or a loopback tunnel')
  }
  return new URL('documents?limit=100', `${url.toString().replace(/\/$/, '')}/`)
}

ipcMain.handle('intelligence:list-observations', async () => {
  const response = await fetch(configuredProviderUrl(), {
    headers: { Authorization: `Bearer ${providerToken}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error(`Mayday Intelligence returned HTTP ${response.status}`)
  const payload: unknown = await response.json()
  if (!payload || typeof payload !== 'object' || !Array.isArray((payload as { items?: unknown }).items)) {
    throw new Error('Mayday Intelligence returned an invalid document page')
  }
  const items = (payload as { items: unknown[] }).items
  if (items.some(item => !item || typeof item !== 'object' || (item as { protocol_version?: unknown }).protocol_version !== 'mayday.intelligence.document/1')) {
    throw new Error('Mayday Intelligence returned an unsupported document contract')
  }
  return payload
})

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 960,
    minWidth: 1200,
    minHeight: 720,
    backgroundColor: '#05070b',
    title: 'Overwatch',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const parsed = new URL(url)
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') void shell.openExternal(url)

    return { action: 'deny' }
  })

  const diagnosticLog = path.join(app.getPath('userData'), 'diagnostics.log')
  const appendDiagnostic = (message: string) => {
    fs.appendFileSync(diagnosticLog, `${new Date().toISOString()} ${message}\n`, { mode: 0o600 })
  }
  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    appendDiagnostic(`renderer:${level} ${message} (${sourceId}:${line})`)
  })
  mainWindow.webContents.on('did-fail-load', (_event, code, description, validatedURL) => {
    appendDiagnostic(`load-failed:${code} ${description} ${validatedURL}`)
  })
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    appendDiagnostic(`renderer-gone:${details.reason} exit=${details.exitCode}`)
  })
  mainWindow.webContents.on('did-finish-load', () => {
    void mainWindow?.webContents.executeJavaScript(`(() => {
      const container = document.querySelector('.globe-container');
      const canvas = container?.querySelector('canvas');
      const rect = container?.getBoundingClientRect();
      return { href: location.href, container: rect ? { width: rect.width, height: rect.height, children: container?.childElementCount } : null, canvas: canvas ? { width: canvas.width, height: canvas.height } : null, webgl2: !!document.createElement('canvas').getContext('webgl2') };
    })()`).then(result => appendDiagnostic(`renderer-ready ${JSON.stringify(result)}`), reason => appendDiagnostic(`diagnostic-failed ${String(reason)}`))
  })

  if (devServerUrl) {
    void mainWindow.loadURL(devServerUrl)
  } else {
    void mainWindow.loadURL('overwatch://app/')
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

void app.whenReady().then(() => {
  installRendererProtocol()
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})
