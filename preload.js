const { contextBridge, ipcRenderer } = require('electron');

// Expose safe API to renderer
contextBridge.exposeInMainWorld('prompti', {
  // Clipboard
  getClipboard: () => ipcRenderer.invoke('get-clipboard'),
  setClipboard: (text) => ipcRenderer.invoke('set-clipboard', text),

  // Window control
  hideWindow: () => ipcRenderer.invoke('hide-window'),

  // Storage (secure credential storage)
  storage: {
    get: (key) => ipcRenderer.invoke('storage-get', key),
    set: (key, value) => ipcRenderer.invoke('storage-set', key, value),
    delete: (key) => ipcRenderer.invoke('storage-delete', key)
  },

  // AI Providers
  enhancePrompt: (options) => ipcRenderer.invoke('enhance-prompt', options),
  validateApiKey: (options) => ipcRenderer.invoke('validate-api-key', options),
  getOllamaModels: () => ipcRenderer.invoke('get-ollama-models'),

  // Listen for clipboard content on window show
  onClipboardContent: (callback) => {
    ipcRenderer.on('clipboard-content', (event, text) => callback(text));
  }
});
