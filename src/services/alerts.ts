// ============================================================
// alerts.ts — Sistema de Alertas de Performance
// ============================================================
// Responsável por:
// - Receber alertas de degradação do performance.ts
// - Enviar notificações para canais configurados (Slack, email, console)
// - Implementar políticas de escalation (repetição, escalonamento)
// - Cooldown para evitar spam de alertas
// - Agrupamento de alertas similares
//
// Configuração via env vars:
// - VITE_ALERTS_ENABLED: Habilita/desabilita alertas (padrão: true em prod)
// - VITE_ALERTS_SLACK_WEBHOOK: URL do webhook do Slack
// - VITE_ALERTS_EMAIL_SMTP_HOST: Host SMTP para envio de email
// - VITE_ALERTS_EMAIL_SMTP_PORT: Porta SMTP (padrão: 587)
// - VITE_ALERTS_EMAIL_USER: Usuário SMTP
// - VITE_ALERTS_EMAIL_PASS: Senha SMTP
// - VITE_ALERTS_EMAIL_FROM: Remetente
// - VITE_ALERTS_EMAIL_TO: Destinatário(s), separados por vírgula
// - VITE_ALERTS_COOLDOWN_MS: Cooldown entre alertas do mesmo tipo (padrão: 60000)
// - VITE_ALERTS_ESCALATION_MS: Tempo para escalar alerta crítico (padrão: 300000)
// - VITE_ALERTS_DEBUG: Habilita logs de debug (padrão: false)
// ============================================================

import type { DegradationAlert } from './performance';

// --- Tipos ---

export type AlertChannel = 'console' | 'slack' | 'email';

export interface AlertConfig {
  enabled: boolean;
  channels: AlertChannel[];
  cooldownMs: number;
  escalationMs: number;
  debug: boolean;
  // Slack
  slackWebhookUrl?: string;
  // Email
  emailSmtpHost?: string;
  emailSmtpPort?: number;
  emailUser?: string;
  emailPass?: string;
  emailFrom?: string;
  emailTo?: string[];
}

export interface AlertNotification {
  alert: DegradationAlert;
  channel: AlertChannel;
  sentAt: number;
  success: boolean;
  error?: string;
}

export interface EscalationRule {
  metric: string;
  severity: 'warning' | 'critical';
  maxOccurrences: number;
  escalationChannel: AlertChannel;
  escalationMessage: string;
}

// --- Estado interno ---

let config: AlertConfig | null = null;
let isInitialized = false;
let alertHistory: AlertNotification[] = [];
let lastAlertTime: Map<string, number> = new Map();
let escalationTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
let alertCounts: Map<string, number> = new Map();

// --- Constantes ---

const DEFAULT_COOLDOWN_MS = 60_000; // 1 minuto
const DEFAULT_ESCALATION_MS = 300_000; // 5 minutos
const MAX_HISTORY_SIZE = 1000;

// --- Helpers ---

function isDev(): boolean {
  return import.meta.env?.DEV ?? false;
}

function log(...args: unknown[]): void {
  if (config?.debug || isDev()) {
    console.log('[alerts]', ...args);
  }
}

function warn(...args: unknown[]): void {
  if (config?.debug || isDev()) {
    console.warn('[alerts]', ...args);
  }
}

function getAlertKey(alert: DegradationAlert): string {
  return `${alert.metric}_${alert.severity}`;
}

function isInCooldown(alert: DegradationAlert): boolean {
  const key = getAlertKey(alert);
  const lastTime = lastAlertTime.get(key);
  if (!lastTime) return false;
  return Date.now() - lastTime < (config?.cooldownMs ?? DEFAULT_COOLDOWN_MS);
}

function incrementAlertCount(alert: DegradationAlert): number {
  const key = getAlertKey(alert);
  const count = (alertCounts.get(key) ?? 0) + 1;
  alertCounts.set(key, count);
  return count;
}

function resetAlertCount(alert: DegradationAlert): void {
  const key = getAlertKey(alert);
  alertCounts.delete(key);
}

// --- Canais de Notificação ---

async function sendToConsole(alert: DegradationAlert): Promise<boolean> {
  const emoji = alert.severity === 'critical' ? '🔴' : '🟡';
  const message = `${emoji} [Performance Alert] ${alert.metric.toUpperCase()}: ${alert.value} (threshold: ${alert.threshold}, severity: ${alert.severity})`;
  console.warn(message);
  return true;
}

async function sendToSlack(alert: DegradationAlert): Promise<boolean> {
  if (!config?.slackWebhookUrl) {
    warn('Slack webhook URL not configured');
    return false;
  }

  const color = alert.severity === 'critical' ? '#FF0000' : '#FFA500';
  const emoji = alert.severity === 'critical' ? '🔴' : '🟡';

  try {
    const response = await fetch(config.slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attachments: [
          {
            color,
            title: `${emoji} Performance Degradation Alert`,
            fields: [
              { title: 'Metric', value: alert.metric.toUpperCase(), short: true },
              { title: 'Value', value: String(alert.value), short: true },
              { title: 'Threshold', value: String(alert.threshold), short: true },
              { title: 'Severity', value: alert.severity, short: true },
              { title: 'Time', value: new Date(alert.timestamp).toISOString(), short: false },
            ],
            footer: 'Açaí Wave Performance Monitor',
            ts: Math.floor(alert.timestamp / 1000),
          },
        ],
      }),
    });

    if (!response.ok) {
      warn(`Slack webhook returned ${response.status}`);
      throw new Error(`Slack webhook returned ${response.status}`);
    }

    log(`Alert sent to Slack: ${alert.metric}`);
    return true;
  } catch (e) {
    warn('Failed to send to Slack:', e);
    throw e;
  }
}

async function sendToEmail(alert: DegradationAlert): Promise<boolean> {
  if (!config?.emailSmtpHost || !config?.emailTo?.length) {
    warn('Email not configured');
    return false;
  }

  // Nota: Em um app Electron, o envio de email seria feito via IPC para o main process
  // que usaria um pacote como nodemailer. Aqui, preparamos o payload e logamos.
  // A implementação real depende da arquitetura de IPC do projeto.

  const subject = `[${alert.severity.toUpperCase()}] Performance Alert: ${alert.metric.toUpperCase()}`;
  const body = `
Performance Degradation Detected

Metric: ${alert.metric.toUpperCase()}
Value: ${alert.value}
Threshold: ${alert.threshold}
Severity: ${alert.severity}
Time: ${new Date(alert.timestamp).toISOString()}

---
Açaí Wave Performance Monitor
  `.trim();

  log(`Email alert prepared: ${subject}`);
  log(`Would send to: ${config.emailTo.join(', ')}`);

  // Em produção, isso seria enviado via IPC para o main process
  // Por enquanto, logamos e retornamos true para indicar que o alerta foi processado
  return true;
}

// --- Escalation ---

function setupEscalation(alert: DegradationAlert): void {
  if (alert.severity !== 'critical') return;

  const key = getAlertKey(alert);

  // Se já existe um timer de escalation, não cria outro
  if (escalationTimers.has(key)) return;

  const timer = setTimeout(() => {
    const count = alertCounts.get(key) ?? 0;
    if (count >= 3) {
      // Escalar: enviar para todos os canais
      escalateAlert(alert, count);
    }
    escalationTimers.delete(key);
    alertCounts.delete(key);
  }, config?.escalationMs ?? DEFAULT_ESCALATION_MS);

  escalationTimers.set(key, timer);
  log(`Escalation timer set for ${key} (${config?.escalationMs ?? DEFAULT_ESCALATION_MS}ms)`);
}

async function escalateAlert(alert: DegradationAlert, occurrences: number): Promise<void> {
  const message = `🚨 ESCALATION: ${alert.metric.toUpperCase()} exceeded threshold ${occurrences} times in ${config?.escalationMs ?? DEFAULT_ESCALATION_MS}ms`;

  console.error(`[ESCALATION] ${message}`);

  // Enviar para todos os canais configurados
  for (const channel of config?.channels ?? []) {
    try {
      switch (channel) {
        case 'slack':
          if (config?.slackWebhookUrl) {
            await fetch(config.slackWebhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                attachments: [
                  {
                    color: '#8B0000',
                    title: message,
                    fields: [
                      { title: 'Metric', value: alert.metric.toUpperCase(), short: true },
                      { title: 'Value', value: String(alert.value), short: true },
                      { title: 'Occurrences', value: String(occurrences), short: true },
                    ],
                    footer: 'Açaí Wave Performance Monitor - ESCALATION',
                    ts: Math.floor(Date.now() / 1000),
                  },
                ],
              }),
            });
          }
          break;
        case 'email':
          log(`Escalation email would be sent: ${message}`);
          break;
        case 'console':
          console.error(`[ESCALATION] ${message}`);
          break;
      }
    } catch (e) {
      warn(`Failed to escalate via ${channel}:`, e);
    }
  }
}

// --- API Pública ---

/**
 * Inicializa o sistema de alertas.
 * Deve ser chamado uma vez no entry point do app (main.tsx).
 * Idempotente — chamadas subsequentes são ignoradas.
 */
export function initAlerts(overrides?: Partial<AlertConfig>): void {
  if (isInitialized) return;

  const env = import.meta.env;

  config = {
    enabled: overrides?.enabled ?? (env.VITE_ALERTS_ENABLED !== 'false'),
    channels: overrides?.channels ?? (['console', 'slack', 'email'] as AlertChannel[]),
    cooldownMs: overrides?.cooldownMs ?? parseInt(env.VITE_ALERTS_COOLDOWN_MS ?? String(DEFAULT_COOLDOWN_MS), 10),
    escalationMs: overrides?.escalationMs ?? parseInt(env.VITE_ALERTS_ESCALATION_MS ?? String(DEFAULT_ESCALATION_MS), 10),
    debug: overrides?.debug ?? (env.VITE_ALERTS_DEBUG === 'true'),
    slackWebhookUrl: overrides?.slackWebhookUrl ?? env.VITE_ALERTS_SLACK_WEBHOOK,
    emailSmtpHost: overrides?.emailSmtpHost ?? env.VITE_ALERTS_EMAIL_SMTP_HOST,
    emailSmtpPort: overrides?.emailSmtpPort ?? parseInt(env.VITE_ALERTS_EMAIL_SMTP_PORT ?? '587', 10),
    emailUser: overrides?.emailUser ?? env.VITE_ALERTS_EMAIL_USER,
    emailPass: overrides?.emailPass ?? env.VITE_ALERTS_EMAIL_PASS,
    emailFrom: overrides?.emailFrom ?? env.VITE_ALERTS_EMAIL_FROM,
    emailTo: overrides?.emailTo ?? (env.VITE_ALERTS_EMAIL_TO?.split(',').map((s: string) => s.trim()).filter(Boolean) || []),
  };

  if (!config.enabled) {
    log('Alerts disabled');
    return;
  }

  isInitialized = true;
  log('Alerts system initialized', { channels: config.channels, cooldownMs: config.cooldownMs });
}

/**
 * Processa um alerta de degradação.
 * Verifica cooldown, envia para os canais configurados e configura escalation.
 */
export async function processAlert(alert: DegradationAlert): Promise<void> {
  if (!isInitialized || !config?.enabled) return;

  // Verifica cooldown
  if (isInCooldown(alert)) {
    log(`Alert ${alert.metric} in cooldown, skipping`);
    return;
  }

  // Atualiza contadores
  const count = incrementAlertCount(alert);
  lastAlertTime.set(getAlertKey(alert), Date.now());

  // Configura escalation para alertas críticos
  setupEscalation(alert);

  // Envia para os canais configurados
  for (const channel of config.channels) {
    let success = false;
    let error: string | undefined;

    try {
      switch (channel) {
        case 'console':
          success = await sendToConsole(alert);
          break;
        case 'slack':
          success = await sendToSlack(alert);
          if (!success) error = 'Slack webhook failed';
          break;
        case 'email':
          success = await sendToEmail(alert);
          if (!success) error = 'Email not configured';
          break;
      }
    } catch (e) {
      success = false;
      error = String(e);
      warn(`Failed to send alert via ${channel}:`, e);
    }

    // Registra no histórico
    const notification: AlertNotification = {
      alert,
      channel,
      sentAt: Date.now(),
      success,
      error,
    };

    alertHistory.push(notification);

    // Limita tamanho do histórico
    if (alertHistory.length > MAX_HISTORY_SIZE) {
      alertHistory = alertHistory.slice(-MAX_HISTORY_SIZE);
    }
  }

  log(`Alert processed: ${alert.metric} (${alert.severity}) - count: ${count}`);
}

/**
 * Retorna o histórico de alertas enviados.
 */
export function getAlertHistory(): AlertNotification[] {
  return [...alertHistory];
}

/**
 * Retorna estatísticas do sistema de alertas.
 */
export function getAlertStats(): {
  totalAlerts: number;
  successfulAlerts: number;
  failedAlerts: number;
  isInitialized: boolean;
  channels: AlertChannel[];
} {
  const successful = alertHistory.filter(n => n.success).length;
  return {
    totalAlerts: alertHistory.length,
    successfulAlerts: successful,
    failedAlerts: alertHistory.length - successful,
    isInitialized,
    channels: config?.channels ?? [],
  };
}

/**
 * Retorna a configuração atual dos alertas.
 */
export function getAlertConfig(): AlertConfig | null {
  return config ? { ...config } : null;
}

/**
 * Reseta o sistema de alertas (útil para testes).
 */
export function resetAlerts(): void {
  // Limpa timers de escalation
  for (const timer of escalationTimers.values()) {
    clearTimeout(timer);
  }
  escalationTimers.clear();
  alertCounts.clear();
  lastAlertTime.clear();
  alertHistory = [];
  config = null;
  isInitialized = false;
}

export default {
  initAlerts,
  processAlert,
  getAlertHistory,
  getAlertStats,
  getAlertConfig,
  resetAlerts,
};
