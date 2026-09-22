import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('overwatch', Object.freeze({}))
