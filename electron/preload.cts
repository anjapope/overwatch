import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('overwatch', Object.freeze({
  listObservations: () => ipcRenderer.invoke('intelligence:list-observations'),
}))
