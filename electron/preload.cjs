const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    openPath: (path) => ipcRenderer.invoke('shell:open', path),
    selectDirectory: () => ipcRenderer.invoke('dialog:select-directory'),
    downloadVideo: (url, savePath, filename) => ipcRenderer.invoke('video:download', { url, savePath, filename }),
    updateTitleBarOverlay: (config) => ipcRenderer.invoke('window:update-title-bar', config),
    windowControls: {
        minimize: () => ipcRenderer.invoke('window:minimize'),
        maximize: () => ipcRenderer.invoke('window:maximize'),
        close: () => ipcRenderer.invoke('window:close')
    }
});
