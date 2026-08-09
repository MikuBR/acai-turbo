import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('renderer logger', () => {
  let logger;

  beforeEach(async () => {
    vi.resetModules();
    delete globalThis.window;
    logger = (await import('../services/logger.js')).default;
  });

  it('falls back to console when IPC is unavailable', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('boom');
    expect(warnSpy).toHaveBeenCalledWith('[logger]', 'boom', {});
    warnSpy.mockRestore();
  });

  it('forwards to IPC when window.electron is available', async () => {
    const invokeMock = vi.fn().mockResolvedValue({ success: true });
    globalThis.window = {
      electron: {
        ipcRenderer: {
          invoke: invokeMock
        }
      }
    };
    vi.resetModules();
    const { default: loggerWithIPC } = await import('../services/logger.js');
    loggerWithIPC.info('ok', {});
    expect(invokeMock).toHaveBeenCalledWith('logging:write', { level: 'info', message: 'ok', meta: {} });
    delete globalThis.window;
  });

  it('withScope returns a logger with all level methods', () => {
    const scoped = logger.withScope('orders');
    expect(typeof scoped.error).toBe('function');
    expect(typeof scoped.warn).toBe('function');
    expect(typeof scoped.info).toBe('function');
    expect(typeof scoped.debug).toBe('function');
  });

  it('withScope injects module into meta when forwarding to IPC', async () => {
    const invokeMock = vi.fn().mockResolvedValue({ success: true });
    globalThis.window = {
      electron: { ipcRenderer: { invoke: invokeMock } }
    };
    vi.resetModules();
    const { default: loggerWithIPC } = await import('../services/logger.js');
    const scoped = loggerWithIPC.withScope('orders');
    scoped.info('test action', { action: 'checkout' });
    expect(invokeMock).toHaveBeenCalledWith('logging:write', {
      level: 'info',
      message: 'test action',
      meta: { module: 'orders', action: 'checkout' }
    });
    delete globalThis.window;
  });

  it('withScope with null does not inject module', async () => {
    const invokeMock = vi.fn().mockResolvedValue({ success: true });
    globalThis.window = {
      electron: { ipcRenderer: { invoke: invokeMock } }
    };
    vi.resetModules();
    const { default: loggerWithIPC } = await import('../services/logger.js');
    const scoped = loggerWithIPC.withScope(null);
    scoped.info('test');
    expect(invokeMock).toHaveBeenCalledWith('logging:write', {
      level: 'info',
      message: 'test',
      meta: {}
    });
    delete globalThis.window;
  });

  it('withScope falls back to console when IPC unavailable', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const scoped = logger.withScope('orders');
    scoped.info('fallback test', { action: 'x' });
    expect(infoSpy).toHaveBeenCalledWith('[logger]', 'fallback test', { module: 'orders', action: 'x' });
    infoSpy.mockRestore();
  });
});