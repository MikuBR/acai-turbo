# Web Vitals — Sistema Completo de Monitoramento de Performance

## Visão Geral

O Açaí Wave PDV agora possui um sistema completo de monitoramento de performance com 4 camadas:

1. **Captura** (`performance.ts`) — Core Web Vitals via PerformanceObserver nativo
2. **Reporting** (`analytics.ts`) — Envio de métricas para backend de analytics
3. **Alertas** (`alerts.ts`) — Notificações de degradação via Slack/email/console
4. **Performance Marks** (15 operações) — Instrumentação de operações críticas

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ performance  │───▶│  analytics   │───▶│   Backend    │  │
│  │    .ts       │    │    .ts       │    │ (GA4/Seg/    │  │
│  │              │    │              │    │  Custom)     │  │
│  │ Web Vitals   │    │  Batching    │    └──────────────┘  │
│  │ + Marks      │    │  + Sampling  │                       │
│  └──────┬───────┘    └──────────────┘    ┌──────────────┐  │
│         │                                  │   alerts    │  │
│         │ onDegradationAlert()             │    .ts      │  │
│         └─────────────────────────────────▶│  Slack/     │  │
│                                            │  Email/     │  │
│                                            │  Console    │  │
│                                            └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Módulos

### 1. `src/services/performance.ts` — Monitoramento Nativo

Captura Core Web Vitals usando `PerformanceObserver` (sem dependências):

| Métrica | Descrição | Warning | Critical |
|---------|-----------|---------|----------|
| TTFB | Time to First Byte | 600ms | 1000ms |
| FCP | First Contentful Paint | 1800ms | 3000ms |
| LCP | Largest Contentful Paint | 2500ms | 4000ms |
| FID | First Input Delay | 100ms | 300ms |
| CLS | Cumulative Layout Shift | 0.1 | 0.25 |
| INP | Interaction to Next Paint | 200ms | 500ms |

**API:**
- `initPerformanceMonitoring()` — Inicializa observadores (idempotente)
- `onWebVitals(cb)` — Registra callback para relatórios
- `onDegradationAlert(cb)` — Registra callback para alertas
- `mark(name)` / `measure(start, end)` — Performance marks com prefixo `acai:`
- `getCurrentReport()` — Retorna relatório atual
- `getMarks()` — Lista todas as marks `acai:`

### 2. `src/services/analytics.ts` — Reporting para Backend

Envia métricas para backend de analytics com batching e sampling:

**Backends suportados:**
- `custom` — Endpoint HTTP configurável
- `ga4` — Google Analytics 4 (Measurement Protocol)
- `segment` — Segment Analytics

**Features:**
- Batching automático (tamanho e intervalo configuráveis)
- Sampling determinístico por sessão (hash do sessionId)
- Auto-flush em `beforeunload` e `popstate`
- Queue limitada a 100 eventos (proteção contra memory leak)
- Métricas customizadas via `trackCustomMetric()`

**API:**
- `initAnalytics(overrides?)` — Inicializa com config do env
- `trackCustomMetric(name, value, extras?)` — Envia métrica custom
- `flushAnalytics()` — Força envio de métricas pendentes
- `getAnalyticsStats()` — Estatísticas do módulo

### 3. `src/services/alerts.ts` — Sistema de Alertas

Notificações de degradação com cooldown e escalation:

**Canais:**
- `console` — Log no console (sempre ativo)
- `slack` — Webhook do Slack
- `email` — Email via SMTP (preparado para IPC)

**Features:**
- Cooldown configurável (padrão: 60s)
- Escalation para alertas críticos repetidos (3x em 5min)
- Agrupamento por métrica + severidade
- Histórico de alertas (máx 1000)

**API:**
- `initAlerts(overrides?)` — Inicializa sistema
- `processAlert(alert)` — Processa alerta de degradação
- `getAlertHistory()` — Histórico de alertas
- `getAlertStats()` — Estatísticas

### 4. `src/hooks/usePerformanceMark.ts` — Hook React

Hook para facilitar instrumentação em componentes:

```tsx
import { usePerformanceMark } from '../hooks/usePerformanceMark'

function MyComponent() {
  const { mark, measure } = usePerformanceMark()

  const handleAction = () => {
    mark('my-action:start')
    // ... operação ...
    mark('my-action:end')
    const duration = measure('my-action:start', 'my-action:end')
  }
}
```

## Integração (main.tsx)

```tsx
import { initPerformanceMonitoring, onWebVitals, onDegradationAlert, mark, measure } from './services/performance'
import { initAnalytics } from './services/analytics'
import { initAlerts, processAlert } from './services/alerts'

// Inicializa monitoramento de Web Vitals
initPerformanceMonitoring()

// Inicializa analytics (reporta Web Vitals para backend configurado)
initAnalytics()

// Inicializa sistema de alertas (notificações de degradação)
initAlerts()

// Log de métricas em desenvolvimento
onWebVitals((report) => {
  if (import.meta.env.DEV) {
    console.log('[Web Vitals]', report)
  }
})

// Alertas de degradação
onDegradationAlert((alert) => {
  console.warn(`[Performance Degradation] ${alert.metric}: ${alert.value}`)
  processAlert(alert)
})
```

## Configuração (env vars)

### Analytics
| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `VITE_ANALYTICS_ENDPOINT` | URL do backend (obrigatório para custom) | — |
| `VITE_ANALYTICS_BACKEND` | `custom`, `ga4`, `segment` | `custom` |
| `VITE_ANALYTICS_SAMPLE_RATE` | Taxa de amostragem 0-1 | `1` |
| `VITE_ANALYTICS_BATCH_SIZE` | Máx métricas por lote | `10` |
| `VITE_ANALYTICS_BATCH_INTERVAL` | Intervalo entre envios (ms) | `5000` |
| `VITE_ANALYTICS_DEBUG` | Habilita logs de debug | `false` |
| `VITE_GA4_MEASUREMENT_ID` | GA4 Measurement ID | — |
| `VITE_GA4_API_SECRET` | GA4 API Secret | — |
| `VITE_SEGMENT_WRITE_KEY` | Segment Write Key | — |

### Alertas
| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `VITE_ALERTS_ENABLED` | Habilita/desabilita alertas | `true` |
| `VITE_ALERTS_SLACK_WEBHOOK` | URL do webhook do Slack | — |
| `VITE_ALERTS_EMAIL_SMTP_HOST` | Host SMTP | — |
| `VITE_ALERTS_EMAIL_SMTP_PORT` | Porta SMTP | `587` |
| `VITE_ALERTS_EMAIL_USER` | Usuário SMTP | — |
| `VITE_ALERTS_EMAIL_PASS` | Senha SMTP | — |
| `VITE_ALERTS_EMAIL_FROM` | Remetente | — |
| `VITE_ALERTS_EMAIL_TO` | Destinatários (separados por vírgula) | — |
| `VITE_ALERTS_COOLDOWN_MS` | Cooldown entre alertas (ms) | `60000` |
| `VITE_ALERTS_ESCALATION_MS` | Tempo para escalar crítico (ms) | `300000` |
| `VITE_ALERTS_DEBUG` | Habilita logs de debug | `false` |

## Performance Marks (15 operações)

Consulte [PERFORMANCE-MARKS.md](./PERFORMANCE-MARKS.md) para a lista completa de operações instrumentadas.

## Testes

- `src/tests/analytics.test.ts` — 17 testes
- `src/tests/alerts.test.ts` — 23 testes
- Build Vite verificado sem erros

## Como Visualizar

### DevTools Performance Tab
1. Abra Chrome DevTools (F12)
2. Vá para a aba **Performance**
3. Clique em **Record** (Ctrl+E)
4. Execute a operação desejada
5. Procure marks com prefixo `acai:` na timeline

### Console (dev mode)
```
[performance] Initializing performance monitoring...
[performance] Mark created: acai:app:startup:start
[analytics] Sent 5 events to custom endpoint
[alerts] Alert processed: lcp (warning) - count: 1
```
