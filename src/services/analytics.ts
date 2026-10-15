// ============================================================
// analytics.ts — Reporting de Web Vitals para Analytics Backend
// ============================================================
// Responsável por:
// - Capturar Core Web Vitals (LCP, INP, CLS, FCP, TTFB) via web-vitals
// - Enviar métricas para o backend de analytics configurado
// - Implementar batching (envio em lotes) e sampling (amostragem)
// - Suportar múltiplos backends: GA4, Segment, endpoint customizado
//
// Configuração via env vars:
// - VITE_ANALYTICS_ENDPOINT: URL do backend (obrigatório para envio)
// - VITE_ANALYTICS_SAMPLE_RATE: Taxa de amostragem 0-1 (padrão: 1.0)
// - VITE_ANALYTICS_BATCH_SIZE: Máximo de métricas por lote (padrão: 10)
// - VITE_ANALYTICS_BATCH_INTERVAL: Intervalo entre envios em ms (padrão: 5000)
// - VITE_ANALYTICS_DEBUG: Habilita logs de debug (padrão: false)
// ============================================================

import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals';
import type { Metric } from 'web-vitals';

// --- Tipos ---

export type AnalyticsBackend = 'ga4' | 'segment' | 'custom';

export interface AnalyticsConfig {
  endpoint: string;
  sampleRate: number;
  batchSize: number;
  batchIntervalMs: number;
  debug: boolean;
  backend: AnalyticsBackend;
  // GA4 specific
  ga4MeasurementId?: string;
  ga4ApiSecret?: string;
  // Segment specific
  segmentWriteKey?: string;
}

export interface AnalyticsEvent {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
  timestamp: number;
  // Custom metrics extras
  path?: string;
  [key: string]: unknown;
}

export interface BatchPayload {
  events: AnalyticsEvent[];
  sentAt: number;
  sessionId: string;
}

// --- Estado interno ---

let config: AnalyticsConfig | null = null;
let eventQueue: AnalyticsEvent[] = [];
let batchTimer: ReturnType<typeof setInterval> | null = null;
let sessionId: string = '';
let isInitialized = false;
let metricsReported = 0;
let metricsDropped = 0;

// --- Helpers ---

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function isDev(): boolean {
  return import.meta.env?.DEV ?? false;
}

function log(...args: unknown[]): void {
  if (config?.debug || isDev()) {
    console.log('[analytics]', ...args);
  }
}

function warn(...args: unknown[]): void {
  if (config?.debug || isDev()) {
    console.warn('[analytics]', ...args);
  }
}

/**
 * Hash determinístico para sampling consistente por sessão.
 * Garante que a mesma sessão seja sempre incluída ou excluída.
 */
function shouldSample(): boolean {
  if (!config) return false;
  if (config.sampleRate >= 1) return true;
  if (config.sampleRate <= 0) return false;

  // Hash simples do sessionId para decisão determinística
  let hash = 0;
  for (let i = 0; i < sessionId.length; i++) {
    const char = sessionId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const normalized = (Math.abs(hash) % 10000) / 10000;
  return normalized < config.sampleRate;
}

/**
 * Converte uma métrica do web-vitals para o formato interno.
 */
function metricToEvent(metric: Metric): AnalyticsEvent {
  return {
    name: metric.name.toLowerCase(),
    value: Math.round(metric.value * 100) / 100,
    rating: metric.rating,
    delta: Math.round(metric.delta * 100) / 100,
    id: metric.id,
    navigationType: metric.navigationType,
    timestamp: Date.now(),
    path: typeof window !== 'undefined' ? window.location.pathname : '/',
  };
}

// --- Backend: Custom Endpoint ---

async function sendToCustomEndpoint(payload: BatchPayload): Promise<boolean> {
  if (!config?.endpoint) return false;

  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Analytics-Session': payload.sessionId,
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });

    if (!response.ok) {
      warn(`Analytics endpoint returned ${response.status}`);
      return false;
    }

    log(`Sent ${payload.events.length} events to custom endpoint`);
    return true;
  } catch (e) {
    warn('Failed to send to custom endpoint:', e);
    return false;
  }
}

// --- Backend: Google Analytics 4 ---

async function sendToGA4(payload: BatchPayload): Promise<boolean> {
  if (!config?.ga4MeasurementId || !config?.ga4ApiSecret) {
    warn('GA4 credentials not configured');
    return false;
  }

  const baseUrl = `https://www.google-analytics.com/mp/collect?measurement_id=${config.ga4MeasurementId}&api_secret=${config.ga4ApiSecret}`;

  try {
    // GA4 suporta até 25 eventos por request
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: payload.sessionId,
        events: payload.events.map((event) => ({
          name: `web_vitals_${event.name}`,
          params: {
            value: event.value,
            rating: event.rating,
            delta: event.delta,
            metric_id: event.id,
            navigation_type: event.navigationType,
            page_path: event.path,
            session_id: payload.sessionId,
          },
        })),
      }),
      keepalive: true,
    });

    if (!response.ok) {
      warn(`GA4 endpoint returned ${response.status}`);
      return false;
    }

    log(`Sent ${payload.events.length} events to GA4`);
    return true;
  } catch (e) {
    warn('Failed to send to GA4:', e);
    return false;
  }
}

// --- Backend: Segment ---

async function sendToSegment(payload: BatchPayload): Promise<boolean> {
  if (!config?.segmentWriteKey) {
    warn('Segment write key not configured');
    return false;
  }

  try {
    const response = await fetch('https://api.segment.io/v1/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(config.segmentWriteKey + ':')}`,
      },
      body: JSON.stringify({
        batch: payload.events.map((event) => ({
          event: `Web Vitals ${event.name.toUpperCase()}`,
          properties: {
            value: event.value,
            rating: event.rating,
            delta: event.delta,
            metric_id: event.id,
            navigation_type: event.navigationType,
            page_path: event.path,
            session_id: payload.sessionId,
          },
          type: 'track',
        })),
      }),
      keepalive: true,
    });

    if (!response.ok) {
      warn(`Segment endpoint returned ${response.status}`);
      return false;
    }

    log(`Sent ${payload.events.length} events to Segment`);
    return true;
  } catch (e) {
    warn('Failed to send to Segment:', e);
    return false;
  }
}

// --- Batching ---

async function flushBatch(): Promise<void> {
  if (eventQueue.length === 0) return;

  const events = [...eventQueue];
  eventQueue = [];

  const payload: BatchPayload = {
    events,
    sentAt: Date.now(),
    sessionId,
  };

  log(`Flushing batch of ${events.length} events`);

  let success = false;

  switch (config?.backend) {
    case 'ga4':
      success = await sendToGA4(payload);
      break;
    case 'segment':
      success = await sendToSegment(payload);
      break;
    case 'custom':
    default:
      success = await sendToCustomEndpoint(payload);
      break;
  }

  if (success) {
    metricsReported += events.length;
  } else {
    // Re-enfileira eventos falhos (máximo 100 para evitar memory leak)
    if (eventQueue.length < 100) {
      eventQueue = [...events, ...eventQueue];
    }
    metricsDropped += events.length;
  }
}

function startBatchTimer(): void {
  if (batchTimer) return;
  batchTimer = setInterval(() => {
    flushBatch();
  }, config?.batchIntervalMs ?? 5000);
}

function stopBatchTimer(): void {
  if (batchTimer) {
    clearInterval(batchTimer);
    batchTimer = null;
  }
}

// --- API Pública ---

/**
 * Inicializa o módulo de analytics.
 * Deve ser chamado uma vez no entry point do app (main.tsx).
 * Idempotente — chamadas subsequentes são ignoradas.
 */
export function initAnalytics(overrides?: Partial<AnalyticsConfig>): void {
  if (isInitialized) return;

  const env = import.meta.env;

  config = {
    endpoint: overrides?.endpoint ?? env.VITE_ANALYTICS_ENDPOINT ?? '',
    sampleRate: overrides?.sampleRate ?? parseFloat(env.VITE_ANALYTICS_SAMPLE_RATE ?? '1'),
    batchSize: overrides?.batchSize ?? parseInt(env.VITE_ANALYTICS_BATCH_SIZE ?? '10', 10),
    batchIntervalMs: overrides?.batchIntervalMs ?? parseInt(env.VITE_ANALYTICS_BATCH_INTERVAL ?? '5000', 10),
    debug: overrides?.debug ?? env.VITE_ANALYTICS_DEBUG === 'true',
    backend: overrides?.backend ?? (env.VITE_ANALYTICS_BACKEND as AnalyticsBackend) ?? 'custom',
    ga4MeasurementId: overrides?.ga4MeasurementId ?? env.VITE_GA4_MEASUREMENT_ID,
    ga4ApiSecret: overrides?.ga4ApiSecret ?? env.VITE_GA4_API_SECRET,
    segmentWriteKey: overrides?.segmentWriteKey ?? env.VITE_SEGMENT_WRITE_KEY,
  };

  sessionId = generateSessionId();

  // Validação
  if (!config.endpoint && config.backend === 'custom') {
    warn('Analytics endpoint not configured — analytics disabled');
    return;
  }

  if (config.sampleRate <= 0) {
    warn('Sample rate is 0 — analytics disabled');
    return;
  }

  isInitialized = true;
  log('Analytics initialized', { sessionId, sampleRate: config.sampleRate, backend: config.backend });

  // Registra handlers do web-vitals
  const reportHandler = (metric: Metric) => {
    if (!shouldSample()) {
      metricsDropped++;
      return;
    }

    const event = metricToEvent(metric);
    eventQueue.push(event);

    // Flush imediato se batch estiver cheio
    if (eventQueue.length >= config!.batchSize) {
      flushBatch();
    }
  };

  onCLS(reportHandler);
  onINP(reportHandler);
  onLCP(reportHandler);
  onFCP(reportHandler);
  onTTFB(reportHandler);

  // Inicia timer de batch
  startBatchTimer();

  // Flush ao sair da página
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      flushBatch();
    });

    // Flush ao mudar de página (SPA navigation)
    window.addEventListener('popstate', () => {
      flushBatch();
    });
  }
}

/**
 * Envia uma métrica customizada para o analytics.
 */
export function trackCustomMetric(name: string, value: number, extras: Record<string, unknown> = {}): void {
  if (!isInitialized || !config) return;
  if (!shouldSample()) return;

  const event: AnalyticsEvent = {
    name: `custom_${name}`,
    value,
    rating: 'good',
    delta: value,
    id: `custom_${Date.now()}`,
    navigationType: 'custom',
    timestamp: Date.now(),
    path: typeof window !== 'undefined' ? window.location.pathname : '/',
    ...extras,
  };

  eventQueue.push(event);

  if (eventQueue.length >= config.batchSize) {
    flushBatch();
  }
}

/**
 * Força o envio de todas as métricas pendentes.
 */
export function flushAnalytics(): Promise<void> {
  return flushBatch();
}

/**
 * Retorna estatísticas do módulo de analytics.
 */
export function getAnalyticsStats(): {
  metricsReported: number;
  metricsDropped: number;
  queueSize: number;
  isInitialized: boolean;
  sessionId: string;
} {
  return {
    metricsReported,
    metricsDropped,
    queueSize: eventQueue.length,
    isInitialized,
    sessionId,
  };
}

/**
 * Retorna a configuração atual do analytics.
 */
export function getAnalyticsConfig(): AnalyticsConfig | null {
  return config ? { ...config } : null;
}

/**
 * Reseta o módulo de analytics (útil para testes).
 */
export function resetAnalytics(): void {
  stopBatchTimer();
  config = null;
  eventQueue = [];
  sessionId = '';
  isInitialized = false;
  metricsReported = 0;
  metricsDropped = 0;
}

export default {
  initAnalytics,
  trackCustomMetric,
  flushAnalytics,
  getAnalyticsStats,
  getAnalyticsConfig,
  resetAnalytics,
};
