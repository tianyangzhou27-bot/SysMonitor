const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('processManager',{action:(name,input)=>ipcRenderer.invoke('process:action',name,input)});
