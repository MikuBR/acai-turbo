// Helper function to get IPC instance with automatic error handling
const getIPC = () => {
  if (window.electron && window.electron.ipcRenderer) {
    const raw = window.electron.ipcRenderer;
    return {
      invoke: (channel, ...args) =>
        raw.invoke(channel, ...args).catch(err => {
          console.error(`[IPC] ${channel} failed:`, err);
          return { success: false, error: err.message };
        }),
      on: raw.on.bind(raw),
      once: raw.once.bind(raw),
      removeListener: raw.removeListener.bind(raw),
    };
  }
  return null;
};

export default getIPC;
export { getIPC };