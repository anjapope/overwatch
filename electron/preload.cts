import { contextBridge, ipcRenderer } from 'electron'
contextBridge.exposeInMainWorld('overwatch', Object.freeze({
  listObservations: () => ipcRenderer.invoke('intelligence:list-observations'),
  onObservationProgress: (callback: (page: unknown) => void) => {
    if (typeof callback !== 'function') throw new TypeError('Expected a callback')
    const listener = (_event: unknown, page: unknown) => callback(page)
    ipcRenderer.on('intelligence:observations-progress', listener)
    return () => ipcRenderer.removeListener('intelligence:observations-progress', listener)
  },
}))
