const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('vkladStorage', {
  load: () => ipcRenderer.invoke('deposits:load'),
  save: (state) => ipcRenderer.invoke('deposits:save', state),
})
