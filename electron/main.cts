import { app, BrowserWindow, shell } from 'electron'
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
    void shell.openExternal(url)

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
