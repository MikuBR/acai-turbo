// ============================================================
// analytics.test.ts — Testes unitários do módulo de analytics
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock do web-vitals antes de importar o analytics
const mockOnCLS = vi.fn();
const mockOnINP = vi.fn();
const mockOnLCP = vi.fn();
const mockOnFCP = vi.fn();
const mockOnTTFB = vi.fn();

vi.mock('web-vitals', () => ({
  onCLS: mockOnCLS,
  onINP: mockOnINP,
  onLCP: mockOnLCP,
  onFCP: mockOnFCP,
  onTTFB: mockOnTTFB,
}));

// Mock do fetch global
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// Importa o módulo após os mocks
const {
  initAnalytics,
  trackCustomMetric,
  flushAnalytics,
  getAnalyticsStats,
  getAnalyticsConfig,
  resetAnalytics,
} = await import('../services/analytics');

describe('analytics', () => {
  beforeEach(() => {
    resetAnalytics();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initAnalytics', () => {
    it('should initialize with override config', () => {
      initAnalytics({
        endpoint: 'https://custom.example.com',
        sampleRate: 1,
        batchSize: 20,
        debug: false,
      });

      const config = getAnalyticsConfig();
      expect(config).not.toBeNull();
      expect(config?.endpoint).toBe('https://custom.example.com');
      expect(config?.sampleRate).toBe(1);
      expect(config?.batchSize).toBe(20);
      expect(config?.debug).toBe(false);
      expect(config?.backend).toBe('custom');
    });

    it('should not initialize without endpoint for custom backend', () => {
      initAnalytics({ endpoint: '', sampleRate: 1 });

      const stats = getAnalyticsStats();
      expect(stats.isInitialized).toBe(false);
    });

    it('should not initialize with sample rate 0', () => {
      initAnalytics({ sampleRate: 0, endpoint: 'https://test.com' });

      const stats = getAnalyticsStats();
      expect(stats.isInitialized).toBe(false);
    });

    it('should be idempotent', () => {
      initAnalytics({ endpoint: 'https://test.com', sampleRate: 1 });
      const stats1 = getAnalyticsStats();

      initAnalytics({ endpoint: 'https://test.com', sampleRate: 1 });
      const stats2 = getAnalyticsStats();

      expect(stats1.sessionId).toBe(stats2.sessionId);
    });

    it('should register web-vitals handlers', () => {
      initAnalytics({ endpoint: 'https://test.com', sampleRate: 1 });

      expect(mockOnCLS).toHaveBeenCalled();
      expect(mockOnINP).toHaveBeenCalled();
      expect(mockOnLCP).toHaveBeenCalled();
      expect(mockOnFCP).toHaveBeenCalled();
      expect(mockOnTTFB).toHaveBeenCalled();
    });
  });

  describe('trackCustomMetric', () => {
    it('should queue custom metric', () => {
      initAnalytics({ endpoint: 'https://test.com', sampleRate: 1 });

      trackCustomMetric('button_click', 123);

      const stats = getAnalyticsStats();
      expect(stats.queueSize).toBe(1);
    });

    it('should not queue when not initialized', () => {
      trackCustomMetric('button_click', 123);

      const stats = getAnalyticsStats();
      expect(stats.queueSize).toBe(0);
    });

    it('should respect sample rate 0', () => {
      initAnalytics({ endpoint: 'https://test.com', sampleRate: 0 });

      trackCustomMetric('button_click', 123);

      const stats = getAnalyticsStats();
      expect(stats.queueSize).toBe(0);
    });
  });

  describe('flushAnalytics', () => {
    it('should send queued events to custom endpoint', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      initAnalytics({ endpoint: 'https://test.com', sampleRate: 1, batchSize: 10 });

      trackCustomMetric('test_metric', 42);
      await flushAnalytics();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.com',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('test_metric'),
        })
      );
    });

    it('should handle fetch failure gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      initAnalytics({ endpoint: 'https://test.com', sampleRate: 1 });

      trackCustomMetric('test_metric', 42);
      await flushAnalytics();

      // Não deve lançar erro
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should include session ID in payload', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      initAnalytics({ endpoint: 'https://test.com', sampleRate: 1 });

      trackCustomMetric('test_metric', 42);
      await flushAnalytics();

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.sessionId).toBeDefined();
      expect(body.sessionId).toMatch(/^sess_/);
    });

    it('should include timestamp in payload', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      initAnalytics({ endpoint: 'https://test.com', sampleRate: 1 });

      trackCustomMetric('test_metric', 42);
      await flushAnalytics();

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.sentAt).toBeDefined();
      expect(typeof body.sentAt).toBe('number');
    });
  });

  describe('getAnalyticsStats', () => {
    it('should return correct stats after sending', async () => {
      mockFetch.mockResolvedValue({ ok: true });

      initAnalytics({ endpoint: 'https://test.com', sampleRate: 1 });

      trackCustomMetric('metric1', 10);
      trackCustomMetric('metric2', 20);
      await flushAnalytics();

      const stats = getAnalyticsStats();
      expect(stats.metricsReported).toBe(2);
      expect(stats.queueSize).toBe(0);
      expect(stats.isInitialized).toBe(true);
    });

    it('should track dropped metrics on failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      initAnalytics({ endpoint: 'https://test.com', sampleRate: 1 });

      trackCustomMetric('metric1', 10);
      await flushAnalytics();

      const stats = getAnalyticsStats();
      expect(stats.metricsDropped).toBe(1);
    });
  });

  describe('batch timer', () => {
    it('should auto-flush after interval', async () => {
      mockFetch.mockResolvedValue({ ok: true });

      initAnalytics({ endpoint: 'https://test.com', sampleRate: 1, batchIntervalMs: 1000 });

      trackCustomMetric('metric1', 10);

      // Antes do intervalo
      expect(mockFetch).not.toHaveBeenCalled();

      // Avança o tempo
      vi.advanceTimersByTime(1000);

      // Depois do intervalo
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('GA4 backend', () => {
    it('should send to GA4 when configured', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      initAnalytics({
        backend: 'ga4',
        ga4MeasurementId: 'G-TEST123',
        ga4ApiSecret: 'secret123',
        sampleRate: 1,
      });

      trackCustomMetric('test_metric', 42);
      await flushAnalytics();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('google-analytics.com'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('Segment backend', () => {
    it('should send to Segment when configured', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      initAnalytics({
        backend: 'segment',
        segmentWriteKey: 'test_key_123',
        sampleRate: 1,
      });

      trackCustomMetric('test_metric', 42);
      await flushAnalytics();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.segment.io/v1/batch',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Basic'),
          }),
        })
      );
    });
  });
});
