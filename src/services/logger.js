function createLogger(scope) {
  const withScopeMeta = (meta = {}) => (scope ? { module: scope, ...meta } : meta);

  return {
    error(message, meta = {}) {
      if (typeof window !== 'undefined' && window.electron && window.electron.ipcRenderer && typeof window.electron.ipcRenderer.invoke === 'function') {
        window.electron.ipcRenderer.invoke('logging:write', { level: 'error', message, meta: withScopeMeta(meta) }).catch(() => {});
      } else {
        console.error('[logger]', message, withScopeMeta(meta));
      }
    },

    warn(message, meta = {}) {
      if (typeof window !== 'undefined' && window.electron && window.electron.ipcRenderer && typeof window.electron.ipcRenderer.invoke === 'function') {
        window.electron.ipcRenderer.invoke('logging:write', { level: 'warn', message, meta: withScopeMeta(meta) }).catch(() => {});
      } else {
        console.warn('[logger]', message, withScopeMeta(meta));
      }
    },

    info(message, meta = {}) {
      if (typeof window !== 'undefined' && window.electron && window.electron.ipcRenderer && typeof window.electron.ipcRenderer.invoke === 'function') {
        window.electron.ipcRenderer.invoke('logging:write', { level: 'info', message, meta: withScopeMeta(meta) }).catch(() => {});
      } else {
        console.info('[logger]', message, withScopeMeta(meta));
      }
    },

    debug(message, meta = {}) {
      if (typeof window !== 'undefined' && window.electron && window.electron.ipcRenderer && typeof window.electron.ipcRenderer.invoke === 'function') {
        window.electron.ipcRenderer.invoke('logging:write', { level: 'debug', message, meta: withScopeMeta(meta) }).catch(() => {});
      } else {
        console.debug('[logger]', message, withScopeMeta(meta));
      }
    }
  };
}

const logger = {
  ...createLogger(null),
  withScope: (scope) => createLogger(scope)
};

export default logger;