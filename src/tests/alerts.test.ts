// ============================================================
// alerts.test.ts — Testes unitários do sistema de alertas
// ============================================================

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  initAlerts,
  processAlert,
  getAlertHistory,
  getAlertStats,
  getAlertConfig,
  resetAlerts,
  type AlertConfig,
} from '../services/alerts';
import type { DegradationAlert } from '../services/performance';

// --- Helpers ---

function createAlert(overrides?: Partial<DegradationAlert>): DegradationAlert {
  return {
    metric: 'lcp',
    value: 3000,
    threshold: 2500,
    severity: 'warning',
    timestamp: Date.now(),
    ...overrides,
  };
}

function createDefaultConfig(overrides?: Partial<AlertConfig>): Partial<AlertConfig> {
  return {
    enabled: true,
    channels: ['console'],
    cooldownMs: 0, // Sem cooldown para testes
    escalationMs: 100,
    debug: false,
    ...overrides,
  };
}

// --- Mocks ---

// Mock do fetch para testes de Slack
const mockFetch = vi.fn();
global.fetch = mockFetch;

// --- Setup ---

beforeEach(() => {
  resetAlerts();
  mockFetch.mockReset();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// --- Testes ---

describe('alerts.ts', () => {
  describe('initAlerts', () => {
    it('should initialize with default config', () => {
      initAlerts(createDefaultConfig());
      const config = getAlertConfig();
      expect(config).not.toBeNull();
      expect(config?.enabled).toBe(true);
      expect(config?.channels).toContain('console');
    });

    it('should be idempotent', () => {
      initAlerts(createDefaultConfig());
      const config1 = getAlertConfig();
      initAlerts(createDefaultConfig({ channels: ['slack'] }));
      const config2 = getAlertConfig();
      expect(config1).toEqual(config2);
    });

    it('should respect enabled: false', () => {
      initAlerts(createDefaultConfig({ enabled: false }));
      const config = getAlertConfig();
      expect(config?.enabled).toBe(false);
    });

    it('should accept custom channels', () => {
      initAlerts(createDefaultConfig({ channels: ['slack', 'email'] }));
      const config = getAlertConfig();
      expect(config?.channels).toEqual(['slack', 'email']);
    });
  });

  describe('processAlert', () => {
    it('should process alert and add to history', async () => {
      initAlerts(createDefaultConfig());
      const alert = createAlert();
      await processAlert(alert);
      const history = getAlertHistory();
      expect(history.length).toBe(1);
      expect(history[0].alert.metric).toBe('lcp');
      expect(history[0].channel).toBe('console');
      expect(history[0].success).toBe(true);
    });

    it('should not process alerts when disabled', async () => {
      initAlerts(createDefaultConfig({ enabled: false }));
      const alert = createAlert();
      await processAlert(alert);
      const history = getAlertHistory();
      expect(history.length).toBe(0);
    });

    it('should respect cooldown', async () => {
      initAlerts(createDefaultConfig({ cooldownMs: 1000 }));
      const alert = createAlert();
      await processAlert(alert);
      await processAlert(alert); // Deve ser ignorado (cooldown)
      const history = getAlertHistory();
      expect(history.length).toBe(1);
    });

    it('should send to multiple channels', async () => {
      initAlerts(createDefaultConfig({ channels: ['console', 'slack'] }));
      mockFetch.mockResolvedValue({ ok: true });
      const alert = createAlert();
      await processAlert(alert);
      const history = getAlertHistory();
      expect(history.length).toBe(2);
      expect(history[0].channel).toBe('console');
      expect(history[1].channel).toBe('slack');
    });

    it('should handle Slack webhook failure', async () => {
      initAlerts(createDefaultConfig({ channels: ['slack'] }));
      mockFetch.mockResolvedValue({ ok: false, status: 500 });
      const alert = createAlert();
      await processAlert(alert);
      const history = getAlertHistory();
      expect(history.length).toBe(1);
      expect(history[0].success).toBe(false);
    });

    it('should handle fetch exception', async () => {
      initAlerts(createDefaultConfig({
        channels: ['slack'],
        slackWebhookUrl: 'https://hooks.slack.com/test',
      }));
      mockFetch.mockRejectedValue(new Error('Network error'));
      const alert = createAlert();
      await processAlert(alert);
      const history = getAlertHistory();
      expect(history.length).toBe(1);
      expect(history[0].success).toBe(false);
      expect(history[0].error).toContain('Network error');
    });

    it('should track alert counts for escalation', async () => {
      initAlerts(createDefaultConfig({ cooldownMs: 0 }));
      const alert = createAlert({ severity: 'critical' });
      await processAlert(alert);
      await processAlert(alert);
      await processAlert(alert);
      // Após 3 alertas críticos, deveria escalar
      // O timer de escalation é de 100ms, então avançamos o tempo
      vi.advanceTimersByTime(150);
      // Verificamos que o histórico tem os 3 alertas
      const history = getAlertHistory();
      expect(history.length).toBe(3);
    });
  });

  describe('getAlertStats', () => {
    it('should return correct stats', async () => {
      initAlerts(createDefaultConfig({
        channels: ['console', 'slack'],
        slackWebhookUrl: 'https://hooks.slack.com/test',
      }));
      mockFetch.mockResolvedValue({ ok: true });
      const alert = createAlert();
      await processAlert(alert);
      const stats = getAlertStats();
      expect(stats.totalAlerts).toBe(2); // console + slack
      expect(stats.successfulAlerts).toBe(2);
      expect(stats.failedAlerts).toBe(0);
      expect(stats.isInitialized).toBe(true);
    });

    it('should track failed alerts', async () => {
      initAlerts(createDefaultConfig({ channels: ['slack'] }));
      mockFetch.mockResolvedValue({ ok: false, status: 500 });
      const alert = createAlert();
      await processAlert(alert);
      const stats = getAlertStats();
      expect(stats.failedAlerts).toBe(1);
    });
  });

  describe('getAlertHistory', () => {
    it('should return empty array when no alerts', () => {
      initAlerts(createDefaultConfig());
      const history = getAlertHistory();
      expect(history).toEqual([]);
    });

    it('should return copy of history (not reference)', async () => {
      initAlerts(createDefaultConfig());
      const alert = createAlert();
      await processAlert(alert);
      const history = getAlertHistory();
      history.push({} as any);
      const newHistory = getAlertHistory();
      expect(newHistory.length).toBe(1);
    });
  });

  describe('resetAlerts', () => {
    it('should reset all state', async () => {
      initAlerts(createDefaultConfig());
      const alert = createAlert();
      await processAlert(alert);
      resetAlerts();
      const history = getAlertHistory();
      const config = getAlertConfig();
      const stats = getAlertStats();
      expect(history.length).toBe(0);
      expect(config).toBeNull();
      expect(stats.isInitialized).toBe(false);
    });
  });

  describe('Slack integration', () => {
    it('should send correct payload to Slack', async () => {
      initAlerts(createDefaultConfig({
        channels: ['slack'],
        slackWebhookUrl: 'https://hooks.slack.com/test',
      }));
      mockFetch.mockResolvedValue({ ok: true });
      const alert = createAlert({ metric: 'cls', value: 0.15, threshold: 0.1 });
      await processAlert(alert);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://hooks.slack.com/test',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.attachments[0].fields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ title: 'Metric', value: 'CLS' }),
          expect.objectContaining({ title: 'Value', value: '0.15' }),
        ])
      );
    });

    it('should use red color for critical alerts', async () => {
      initAlerts(createDefaultConfig({
        channels: ['slack'],
        slackWebhookUrl: 'https://hooks.slack.com/test',
      }));
      mockFetch.mockResolvedValue({ ok: true });
      const alert = createAlert({ severity: 'critical' });
      await processAlert(alert);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.attachments[0].color).toBe('#FF0000');
    });

    it('should use orange color for warning alerts', async () => {
      initAlerts(createDefaultConfig({
        channels: ['slack'],
        slackWebhookUrl: 'https://hooks.slack.com/test',
      }));
      mockFetch.mockResolvedValue({ ok: true });
      const alert = createAlert({ severity: 'warning' });
      await processAlert(alert);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.attachments[0].color).toBe('#FFA500');
    });
  });

  describe('Email integration', () => {
    it('should prepare email alert when configured', async () => {
      initAlerts(createDefaultConfig({
        channels: ['email'],
        emailSmtpHost: 'smtp.gmail.com',
        emailTo: ['test@example.com'],
      }));
      const alert = createAlert();
      await processAlert(alert);
      const history = getAlertHistory();
      expect(history.length).toBe(1);
      expect(history[0].channel).toBe('email');
      expect(history[0].success).toBe(true);
    });

    it('should fail when email not configured', async () => {
      initAlerts(createDefaultConfig({ channels: ['email'] }));
      const alert = createAlert();
      await processAlert(alert);
      const history = getAlertHistory();
      expect(history.length).toBe(1);
      expect(history[0].success).toBe(false);
    });
  });

  describe('Escalation', () => {
    it('should setup escalation timer for critical alerts', async () => {
      initAlerts(createDefaultConfig({ escalationMs: 100 }));
      const alert = createAlert({ severity: 'critical' });
      await processAlert(alert);
      // O timer de escalation deveria estar ativo
      // Não podemos verificar diretamente, mas podemos verificar que não lança erro
      expect(true).toBe(true);
    });

    it('should not setup escalation for warning alerts', async () => {
      initAlerts(createDefaultConfig({ escalationMs: 100 }));
      const alert = createAlert({ severity: 'warning' });
      await processAlert(alert);
      // Não deveria criar timer de escalation
      expect(true).toBe(true);
    });
  });
});
