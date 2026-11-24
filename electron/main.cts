import { app, BrowserWindow, ipcMain, protocol, shell } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { collectBalancedProvider } from './balanced-provider.cjs'
import { readObservationCache, writeObservationCache } from './observation-store.cjs'
import os from 'node:os'
import { createPlanetaryProxy } from './planetary-proxy.cjs'

const softwareRendering = process.env.OVERWATCH_SWIFTSHADER === '1'
if (softwareRendering) {
  app.commandLine.appendSwitch('use-gl', 'angle')
  app.commandLine.appendSwitch('use-angle', 'swiftshader')
  app.commandLine.appendSwitch('enable-unsafe-swiftshader')
}

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
  const catalog = JSON.parse(fs.readFileSync(path.join(rendererRoot, 'planetary-layers.json'), 'utf8'))
  const planetary = createPlanetaryProxy(catalog.layers)
  protocol.handle('overwatch', request => {
    const url = new URL(request.url)
    if (url.hostname !== 'app') return new Response('Not found', { status: 404 })
    if (url.pathname.startsWith('/planetary/')) return planetary(url.pathname)
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
function configuredProvider() {
  // Resolve local configuration at request time. A restart can bring the app
  // up before a mounted token file or provider configuration is available.
  const localConfig = localProviderConfig()
  const providerBaseUrl = process.env.MAYDAY_INTELLIGENCE_PROVIDER_URL
    || app.commandLine.getSwitchValue('mayday-provider-url') || localConfig.providerUrl
  const providerTokenFile = app.commandLine.getSwitchValue('mayday-provider-token-file') || localConfig.tokenFile
  const providerToken = process.env.MAYDAY_INTELLIGENCE_PROVIDER_TOKEN || (() => {
    if (!providerTokenFile) return ''
    try { return fs.readFileSync(providerTokenFile, 'utf8').trim() } catch { return '' }
  })()
  if (!providerBaseUrl || !providerToken) throw new Error('Mayday Intelligence provider is not configured')
  const url = new URL(providerBaseUrl)
  if (url.protocol !== 'https:' && !['127.0.0.1', 'localhost', '::1'].includes(url.hostname)) {
    throw new Error('Mayday Intelligence provider must use HTTPS or a loopback tunnel')
  }
  return { url: new URL('documents?limit=100', `${url.toString().replace(/\/$/, '')}/`), token: providerToken }
}

let providerRequest = 0
let providerController: AbortController | undefined
ipcMain.handle('intelligence:list-observations', async event => {
  providerController?.abort()
  providerController = new AbortController()
  const controller = providerController
  const request = ++providerRequest
  return new Promise((resolve, reject) => {
    let initial = false
    let last: unknown
    let provider: ReturnType<typeof configuredProvider>
    try { provider = configuredProvider() } catch (reason) { reject(reason); return }
    const cacheFile=path.join(app.getPath('userData'),'observation-cache.json')
    const retained=readObservationCache(cacheFile)
    let lastCacheWrite=0
    void collectBalancedProvider(provider.url, async url => {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${provider.token}`, Accept: 'application/json' },
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]),
      })
      if (!response.ok) throw new Error(`Mayday Intelligence returned HTTP ${response.status}`)
      return response.json()
    }, retained, page => {
      if (request !== providerRequest) return
      last = page
      if(!page.loadingMore || Date.now()-lastCacheWrite>15_000) { try { writeObservationCache(cacheFile,page.items);lastCacheWrite=Date.now() } catch { page.collections.warnings.push('Could not save the local observation cache') } }
      if (!initial) { initial = true; resolve(page) }
      else if (!event.sender.isDestroyed()) event.sender.send('intelligence:observations-progress', page)
    }).catch(reason => {
      if (request !== providerRequest) return
      const error = reason instanceof Error ? reason.message : 'Archive loading failed'
      if (!initial) reject(reason)
      else if (!event.sender.isDestroyed()) event.sender.send('intelligence:observations-progress', { ...last as object, loadingMore:false, error })
    })
  })
})

let lastResourceSample=0
ipcMain.handle('intelligence:resource-usage',()=>{
  const processes=app.getAppMetrics().map(metric=>({type:metric.type,pid:metric.pid,rssMiB:metric.memory.workingSetSize/1024,cpuPercent:metric.cpu.percentCPUUsage}))
  let available=os.freemem(),swapUsedMiB:number|undefined
  try{
    const memory=fs.readFileSync('/proc/meminfo','utf8')
    const kb=(key:string)=>Number(new RegExp('^'+key+':\\s+(\\d+)','m').exec(memory)?.[1] ?? 0)
    available=kb('MemAvailable')*1024;swapUsedMiB=(kb('SwapTotal')-kb('SwapFree'))/1024
  }catch{ /* Non-Linux systems use the portable free-memory measurement. */ }
  const now=Date.now(),sampleSeconds=lastResourceSample?(now-lastResourceSample)/1000:0;lastResourceSample=now
  return {sampleSeconds,processes,rssMiB:processes.reduce((sum,p)=>sum+p.rssMiB,0),cpuPercent:processes.reduce((sum,p)=>sum+p.cpuPercent,0),systemTotalMiB:os.totalmem()/1024/1024,systemAvailableMiB:available/1024/1024,swapUsedMiB,logicalCpus:os.cpus().length,gpu:app.getGPUFeatureStatus().webgl2 ?? 'unknown'}
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
    try {
      fs.appendFileSync(diagnosticLog, `${new Date().toISOString()} ${message}\n`, { mode: 0o600 })
    } catch (error) {
      console.warn('Could not write Overwatch diagnostics', error)
    }
  }
  mainWindow.webContents.on('console-message', ({ level, message, lineNumber, sourceId }) => {
    appendDiagnostic(`renderer:${level} ${message} (${sourceId}:${lineNumber})`)
  })
  mainWindow.webContents.on('did-fail-load', (_event, code, description, validatedURL) => {
    appendDiagnostic(`load-failed:${code} ${description} ${validatedURL}`)
  })
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    appendDiagnostic(`renderer-gone:${details.reason} exit=${details.exitCode}`)
  })
  const contents = mainWindow.webContents
  contents.on('did-finish-load', () => {
    void contents.executeJavaScript(`(() => {
      const container = document.querySelector('.globe-container');
      const canvas = container?.querySelector('canvas');
      const rect = container?.getBoundingClientRect();
      const gl = document.createElement('canvas').getContext('webgl2');
      const debug = gl?.getExtension('WEBGL_debug_renderer_info');
      const result = { href: location.href, container: rect ? { width: rect.width, height: rect.height, children: container?.childElementCount } : null, canvas: canvas ? { width: canvas.width, height: canvas.height } : null, webgl2: Boolean(gl), webglVendor: debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : null, webglRenderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : null };
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
      return result;
    })()`).then(
      result => appendDiagnostic(`renderer-ready ${JSON.stringify(result)}`),
      error => appendDiagnostic(`diagnostic-failed ${String(error)}`),
    ).then(async () => {
      appendDiagnostic(`gpu-mode ${softwareRendering ? 'swiftshader' : 'chromium-default'}`)
      try {
        const info = await app.getGPUInfo('complete')
        appendDiagnostic(`gpu-info ${JSON.stringify(info)}`)
      } catch (error) {
        appendDiagnostic(`gpu-diagnostic-error ${String(error)}`)
      }
      appendDiagnostic(`gpu-features ${JSON.stringify(app.getGPUFeatureStatus())}`)
    })
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

