import { app, BrowserWindow, ipcMain, shell } from 'electron'
import path from 'node:path'

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

const providerBaseUrl = process.env.MAYDAY_INTELLIGENCE_PROVIDER_URL
const providerToken = process.env.MAYDAY_INTELLIGENCE_PROVIDER_TOKEN

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

  if (devServerUrl) {
    void mainWindow.loadURL(devServerUrl)
  } else {
    const rendererEntryPath = path.join(__dirname, '..', '..', 'dist', 'index.html')
    void mainWindow.loadFile(rendererEntryPath)
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
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})
