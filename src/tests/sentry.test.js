import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock do Sentry usando vi.hoisted (necessário porque vi.mock é hoisted)
const { mockSentry } = vi.hoisted(() => ({
  mockSentry: {
    init: vi.fn(),
    addBreadcrumb: vi.fn(),
    captureException: vi.fn(),
    withScope: vi.fn((fn) => fn({ setExtra: vi.fn(), setTag: vi.fn() })),
    setUser: vi.fn(),
    setTag: vi.fn(),
    setContext: vi.fn(),
    browserTracingIntegration: vi.fn(() => ({ name: 'browserTracing' })),
    showReportDialog: vi.fn(),
  },
}));

vi.mock('@sentry/react', () => mockSentry);

import * as Sentry from '@sentry/react';

describe('Sentry Service (renderer)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    // Default: sem DSN
    vi.stubEnv('VITE_SENTRY_DSN', '');
    vi.stubEnv('VITE_APP_VERSION', '1.0.0');
    vi.stubEnv('MODE', 'production');
    vi.stubEnv('PROD', 'true');
    vi.stubEnv('DEV', 'false');
  });

  describe('initSentry', () => {
    it('should not initialize without DSN', async () => {
      vi.stubEnv('VITE_SENTRY_DSN', '');
      vi.stubEnv('PROD', 'true');

      const { initSentry: init } = await import('../services/sentry.js');
      init();

      expect(Sentry.init).not.toHaveBeenCalled();
    });

    it('should not initialize in development', async () => {
      vi.stubEnv('VITE_SENTRY_DSN', 'https://test@sentry.io/123');
      vi.stubEnv('PROD', ''); // string vazia = falsy
      vi.stubEnv('DEV', 'true');
      vi.stubEnv('MODE', 'development');

      const { initSentry: init } = await import('../services/sentry.js');
      init();

      expect(Sentry.init).not.toHaveBeenCalled();
    });

    it('should initialize in production with DSN', async () => {
      vi.stubEnv('VITE_SENTRY_DSN', 'https://test@sentry.io/123');
      vi.stubEnv('PROD', 'true');
      vi.stubEnv('DEV', 'false');
      vi.stubEnv('MODE', 'production');
      vi.stubEnv('VITE_APP_VERSION', '1.0.0');

      const { initSentry: init } = await import('../services/sentry.js');
      init();

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: 'https://test@sentry.io/123',
          environment: 'production',
          release: '1.0.0',
        })
      );
    });

    it('should be idempotent', async () => {
      vi.stubEnv('VITE_SENTRY_DSN', 'https://test@sentry.io/123');
      vi.stubEnv('PROD', 'true');
      vi.stubEnv('DEV', 'false');
      vi.stubEnv('MODE', 'production');
      vi.stubEnv('VITE_APP_VERSION', '1.0.0');

      const { initSentry: init } = await import('../services/sentry.js');
      init();
      init();

      expect(Sentry.init).toHaveBeenCalledTimes(1);
    });
  });

  describe('addBreadcrumb', () => {
    it('should add breadcrumb when initialized', async () => {
      vi.stubEnv('VITE_SENTRY_DSN', 'https://test@sentry.io/123');
      vi.stubEnv('PROD', 'true');
      vi.stubEnv('DEV', 'false');
      vi.stubEnv('MODE', 'production');
      vi.stubEnv('VITE_APP_VERSION', '1.0.0');

      const { initSentry: init, addBreadcrumb: add } = await import('../services/sentry.js');
      init();
      add('test', 'Test message', 'info', { key: 'value' });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'test',
          message: 'Test message',
          level: 'info',
          data: { key: 'value' },
        })
      );
    });

    it('should not add breadcrumb when not initialized', async () => {
      vi.stubEnv('VITE_SENTRY_DSN', '');
      vi.stubEnv('PROD', 'true');

      const { addBreadcrumb: add } = await import('../services/sentry.js');
      add('test', 'Test message');

      expect(Sentry.addBreadcrumb).not.toHaveBeenCalled();
    });
  });

  describe('reportError', () => {
    it('should report error when initialized', async () => {
      vi.stubEnv('VITE_SENTRY_DSN', 'https://test@sentry.io/123');
      vi.stubEnv('PROD', 'true');
      vi.stubEnv('DEV', 'false');
      vi.stubEnv('MODE', 'production');
      vi.stubEnv('VITE_APP_VERSION', '1.0.0');

      const { initSentry: init, reportError: report } = await import('../services/sentry.js');
      init();
      const error = new Error('Test error');
      report(error, { tags: { type: 'test' }, context: { key: 'value' } });

      expect(Sentry.captureException).toHaveBeenCalled();
    });

    it('should convert string to Error', async () => {
      vi.stubEnv('VITE_SENTRY_DSN', 'https://test@sentry.io/123');
      vi.stubEnv('PROD', 'true');
      vi.stubEnv('DEV', 'false');
      vi.stubEnv('MODE', 'production');
      vi.stubEnv('VITE_APP_VERSION', '1.0.0');

      const { initSentry: init, reportError: report } = await import('../services/sentry.js');
      init();
      report('String error message');

      expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should not report when not initialized', async () => {
      vi.stubEnv('VITE_SENTRY_DSN', '');
      vi.stubEnv('PROD', 'true');

      const { reportError: report } = await import('../services/sentry.js');
      report(new Error('Test'));

      expect(Sentry.captureException).not.toHaveBeenCalled();
    });
  });

  describe('setUser', () => {
    it('should set user when initialized', async () => {
      vi.stubEnv('VITE_SENTRY_DSN', 'https://test@sentry.io/123');
      vi.stubEnv('PROD', 'true');
      vi.stubEnv('DEV', 'false');
      vi.stubEnv('MODE', 'production');
      vi.stubEnv('VITE_APP_VERSION', '1.0.0');

      const { initSentry: init, setUser: set } = await import('../services/sentry.js');
      init();
      set({ id: 1, username: 'testuser', email: 'test@example.com' });

      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
      });
    });

    it('should clear user when null', async () => {
      vi.stubEnv('VITE_SENTRY_DSN', 'https://test@sentry.io/123');
      vi.stubEnv('PROD', 'true');
      vi.stubEnv('DEV', 'false');
      vi.stubEnv('MODE', 'production');
      vi.stubEnv('VITE_APP_VERSION', '1.0.0');

      const { initSentry: init, setUser: set } = await import('../services/sentry.js');
      init();
      set(null);

      expect(Sentry.setUser).toHaveBeenCalledWith(null);
    });
  });

  describe('setTag', () => {
    it('should set tag when initialized', async () => {
      vi.stubEnv('VITE_SENTRY_DSN', 'https://test@sentry.io/123');
      vi.stubEnv('PROD', 'true');
      vi.stubEnv('DEV', 'false');
      vi.stubEnv('MODE', 'production');
      vi.stubEnv('VITE_APP_VERSION', '1.0.0');

      const { initSentry: init, setTag: set } = await import('../services/sentry.js');
      init();
      set('environment', 'test');

      expect(Sentry.setTag).toHaveBeenCalledWith('environment', 'test');
    });
  });

  describe('setContext', () => {
    it('should set context when initialized', async () => {
      vi.stubEnv('VITE_SENTRY_DSN', 'https://test@sentry.io/123');
      vi.stubEnv('PROD', 'true');
      vi.stubEnv('DEV', 'false');
      vi.stubEnv('MODE', 'production');
      vi.stubEnv('VITE_APP_VERSION', '1.0.0');

      const { initSentry: init, setContext: set } = await import('../services/sentry.js');
      init();
      set('app', { version: '1.0.0' });

      expect(Sentry.setContext).toHaveBeenCalledWith('app', { version: '1.0.0' });
    });
  });

  describe('isSentryInitialized', () => {
    it('should return false when not initialized', async () => {
      vi.stubEnv('VITE_SENTRY_DSN', '');
      vi.stubEnv('PROD', 'true');

      const { isSentryInitialized: isInit } = await import('../services/sentry.js');
      expect(isInit()).toBe(false);
    });

    it('should return true after initialization', async () => {
      vi.stubEnv('VITE_SENTRY_DSN', 'https://test@sentry.io/123');
      vi.stubEnv('PROD', 'true');
      vi.stubEnv('DEV', 'false');
      vi.stubEnv('MODE', 'production');
      vi.stubEnv('VITE_APP_VERSION', '1.0.0');

      const { initSentry: init, isSentryInitialized: isInit } = await import('../services/sentry.js');
      init();
      expect(isInit()).toBe(true);
    });
  });

  describe('getSentry', () => {
    it('should return Sentry instance', async () => {
      const { getSentry: getS } = await import('../services/sentry.js');
      expect(getS()).toBe(Sentry);
    });
  });
});
