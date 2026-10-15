// ============================================================
// performance.ts — Monitoramento de Web Vitals e Performance Marks
// ============================================================
// Implementação nativa usando PerformanceObserver (sem dependências).
// Captura: LCP, FID, CLS, FCP, TTFB, INP
// Performance marks: prefixo "acai:"
// Alertas de degradação: LCP > 2.5s, FID > 100ms, CLS > 0.1, FCP > 1.8s, TTFB > 600ms
// ============================================================

// --- Tipos ---

export interface WebVitalsReport {
  lcp: number | null;  // Largest Contentful Paint (ms)
  fid: number | null;  // First Input Delay (ms)
  cls: number | null;  // Cumulative Layout Shift (unitless)
  fcp: number | null;  // First Contentful Paint (ms)
  ttfb: number | null; // Time to First Byte (ms)
  inp: number | null;  // Interaction to Next Paint (ms)
}

export interface PerformanceMark {
  name: string;
  startTime: number;
  duration?: number;
}

export interface DegradationAlert {
  metric: string;
  value: number;
  threshold: number;
  severity: 'warning' | 'critical';
  timestamp: number;
}

export type PerformanceCallback = (report: WebVitalsReport) => void;
export type AlertCallback = (alert: DegradationAlert) => void;

// --- Constantes ---

const MARK_PREFIX = 'acai:';

const THRESHOLDS = {
  lcp: { warning: 2500, critical: 4000 },   // ms
  fid: { warning: 100, critical: 300 },     // ms
  cls: { warning: 0.1, critical: 0.25 },    // unitless
  fcp: { warning: 1800, critical: 3000 },   // ms
  ttfb: { warning: 600, critical: 1000 },   // ms
  inp: { warning: 200, critical: 500 },     // ms
} as const;

// --- Estado interno ---

let isInitialized = false;
let reportCallbacks: PerformanceCallback[] = [];
let alertCallbacks: AlertCallback[] = [];
let currentReport: WebVitalsReport = {
  lcp: null,
  fid: null,
  cls: null,
  fcp: null,
  ttfb: null,
  inp: null,
};

// CLS acumulado
let clsValue = 0;
let sessionValue = 0;
let sessionEntries: PerformanceEntry[] = [];

// --- Helpers ---

function isDev(): boolean {
  return import.meta.env?.DEV ?? false;
}

function log(...args: unknown[]): void {
  if (isDev()) {
    console.log('[performance]', ...args);
  }
}

function warn(...args: unknown[]): void {
  if (isDev()) {
    console.warn('[performance]', ...args);
  }
}

// --- TTFB (Time to First Byte) ---

function captureTTFB(): void {
  try {
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (navEntry) {
      const ttfb = navEntry.responseStart - navEntry.startTime;
      currentReport.ttfb = Math.round(ttfb * 100) / 100;
      checkThreshold('ttfb', currentReport.ttfb);
      notifyReport();
    }
  } catch (e) {
    warn('Failed to capture TTFB:', e);
  }
}

// --- FCP (First Contentful Paint) ---

function observeFCP(): void {
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          currentReport.fcp = Math.round(entry.startTime * 100) / 100;
          checkThreshold('fcp', currentReport.fcp);
          notifyReport();
          observer.disconnect();
        }
      }
    });
    observer.observe({ type: 'paint', buffered: true });
  } catch (e) {
    warn('Failed to observe FCP:', e);
  }
}

// --- LCP (Largest Contentful Paint) ---

function observeLCP(): void {
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        currentReport.lcp = Math.round(lastEntry.startTime * 100) / 100;
        checkThreshold('lcp', currentReport.lcp);
        notifyReport();
      }
    });
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) {
    warn('Failed to observe LCP:', e);
  }
}

// --- FID (First Input Delay) ---

function observeFID(): void {
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const delay = (entry as any).processingStart - entry.startTime;
        if (delay > 0) {
          currentReport.fid = Math.round(delay * 100) / 100;
          checkThreshold('fid', currentReport.fid);
          notifyReport();
          observer.disconnect();
        }
      }
    });
    observer.observe({ type: 'first-input', buffered: true });
  } catch (e) {
    warn('Failed to observe FID:', e);
  }
}

// --- CLS (Cumulative Layout Shift) ---

function observeCLS(): void {
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShift = entry as any;
        if (!layoutShift.hadRecentInput) {
          sessionValue += layoutShift.value;
          sessionEntries.push(entry);
        }
      }
      // CLS é o valor máximo da sessão
      if (sessionValue > clsValue) {
        clsValue = sessionValue;
        currentReport.cls = Math.round(clsValue * 10000) / 10000;
        checkThreshold('cls', currentReport.cls);
        notifyReport();
      }
    });
    observer.observe({ type: 'layout-shift', buffered: true });
  } catch (e) {
    warn('Failed to observe CLS:', e);
  }
}

// --- INP (Interaction to Next Paint) ---

function observeINP(): void {
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        // INP é a pior interação (aproximação)
        let maxDuration = 0;
        for (const entry of entries) {
          const duration = entry.duration;
          if (duration > maxDuration) {
            maxDuration = duration;
          }
        }
        currentReport.inp = Math.round(maxDuration * 100) / 100;
        checkThreshold('inp', currentReport.inp);
        notifyReport();
      }
    });
    observer.observe({ type: 'event', buffered: true, durationThreshold: 40 } as PerformanceObserverInit);
  } catch (e) {
    warn('Failed to observe INP:', e);
  }
}

// --- Alertas de degradação ---

function checkThreshold(metric: keyof typeof THRESHOLDS, value: number): void {
  const thresholds = THRESHOLDS[metric];
  if (!thresholds) return;

  let severity: 'warning' | 'critical' | null = null;

  if (value >= thresholds.critical) {
    severity = 'critical';
  } else if (value >= thresholds.warning) {
    severity = 'warning';
  }

  if (severity) {
    const alert: DegradationAlert = {
      metric,
      value,
      threshold: severity === 'critical' ? thresholds.critical : thresholds.warning,
      severity,
      timestamp: Date.now(),
    };

    warn(`Degradation alert: ${metric} = ${value} (threshold: ${alert.threshold})`);

    for (const cb of alertCallbacks) {
      try {
        cb(alert);
      } catch (e) {
        warn('Alert callback error:', e);
      }
    }
  }
}

// --- Notificação ---

function notifyReport(): void {
  for (const cb of reportCallbacks) {
    try {
      cb({ ...currentReport });
    } catch (e) {
      warn('Report callback error:', e);
    }
  }
}

// --- API Pública ---

/**
 * Inicializa o monitoramento de Web Vitals.
 * Deve ser chamado uma vez no entry point do app (main.jsx).
 * Idempotente — chamadas subsequentes são ignoradas.
 */
export function initPerformanceMonitoring(): void {
  if (isInitialized) return;
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    warn('PerformanceObserver not supported');
    return;
  }

  isInitialized = true;
  log('Initializing performance monitoring...');

  // TTFB é capturado imediatamente (navigation entry já disponível)
  captureTTFB();

  // Observadores para métricas contínuas
  observeFCP();
  observeLCP();
  observeFID();
  observeCLS();
  observeINP();

  log('Performance monitoring initialized');
}

/**
 * Registra um callback para receber relatórios de Web Vitals.
 * Retorna função para desregistrar.
 */
export function onWebVitals(cb: PerformanceCallback): () => void {
  reportCallbacks.push(cb);
  // Envia relatório atual imediatamente
  if (isInitialized) {
    cb({ ...currentReport });
  }
  return () => {
    reportCallbacks = reportCallbacks.filter(c => c !== cb);
  };
}

/**
 * Registra um callback para receber alertas de degradação.
 * Retorna função para desregistrar.
 */
export function onDegradationAlert(cb: AlertCallback): () => void {
  alertCallbacks.push(cb);
  return () => {
    alertCallbacks = alertCallbacks.filter(c => c !== cb);
  };
}

/**
 * Cria uma performance mark com prefixo "acai:".
 * @param name - Nome da marca (será prefixado com "acai:")
 */
export function mark(name: string): void {
  if (typeof performance === 'undefined' || !performance.mark) return;
  const markName = name.startsWith(MARK_PREFIX) ? name : `${MARK_PREFIX}${name}`;
  try {
    performance.mark(markName);
    log('Mark created:', markName);
  } catch (e) {
    warn('Failed to create mark:', e);
  }
}

/**
 * Mede a duração entre duas marks e retorna em ms.
 * @param startName - Nome da marca inicial
 * @param endName - Nome da marca final
 * @returns Duração em ms ou null se não encontrada
 */
export function measure(startName: string, endName: string): number | null {
  if (typeof performance === 'undefined' || !performance.measure) return null;
  const start = startName.startsWith(MARK_PREFIX) ? startName : `${MARK_PREFIX}${startName}`;
  const end = endName.startsWith(MARK_PREFIX) ? endName : `${MARK_PREFIX}${endName}`;
  try {
    const measureName = `${start}_to_${end}`;
    performance.measure(measureName, start, end);
    const entries = performance.getEntriesByName(measureName, 'measure');
    const last = entries[entries.length - 1];
    if (last) {
      const duration = Math.round(last.duration * 100) / 100;
      log(`Measure ${start} → ${end}: ${duration}ms`);
      return duration;
    }
  } catch (e) {
    warn('Failed to measure:', e);
  }
  return null;
}

/**
 * Limpa todas as performance marks com prefixo "acai:".
 */
export function clearMarks(): void {
  if (typeof performance === 'undefined' || !performance.clearMarks) return;
  try {
    const entries = performance.getEntriesByType('mark');
    for (const entry of entries) {
      if (entry.name.startsWith(MARK_PREFIX)) {
        performance.clearMarks(entry.name);
      }
    }
  } catch (e) {
    warn('Failed to clear marks:', e);
  }
}

/**
 * Retorna o relatório atual de Web Vitals.
 */
export function getCurrentReport(): WebVitalsReport {
  return { ...currentReport };
}

/**
 * Retorna todas as performance marks com prefixo "acai:".
 */
export function getMarks(): PerformanceMark[] {
  if (typeof performance === 'undefined') return [];
  try {
    const entries = performance.getEntriesByType('mark');
    return entries
      .filter(e => e.name.startsWith(MARK_PREFIX))
      .map(e => ({
        name: e.name,
        startTime: Math.round(e.startTime * 100) / 100,
        duration: e.duration ? Math.round(e.duration * 100) / 100 : undefined,
      }));
  } catch {
    return [];
  }
}

/**
 * Reseta o monitoramento (útil para testes).
 */
export function resetPerformanceMonitoring(): void {
  isInitialized = false;
  reportCallbacks = [];
  alertCallbacks = [];
  currentReport = { lcp: null, fid: null, cls: null, fcp: null, ttfb: null, inp: null };
  clsValue = 0;
  sessionValue = 0;
  sessionEntries = [];
}
