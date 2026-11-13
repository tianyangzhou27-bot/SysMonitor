const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('telegram', { action: (name, input) => ipcRenderer.invoke('telegram:action', name, input) });
