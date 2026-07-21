const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
    on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
    once: (channel, func) => ipcRenderer.once(channel, (event, ...args) => func(...args)),
    removeListener: (channel, func) => ipcRenderer.removeListener(channel, func),
  },
  require: (module) => {
    if (module === 'electron') {
      return { ipcRenderer: {
        invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
      } };
    }
    throw new Error(`Module '${module}' is not allowed in renderer process`);
  }
});
