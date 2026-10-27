import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import './index.css'
import router from './router/index.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import SentryFeedbackButton from './components/SentryFeedbackButton.tsx'
import SentryFeedbackWidget from './components/SentryFeedbackWidget.tsx'
import { SentryFeedbackProvider } from './contexts/SentryFeedbackContext.tsx'
import { initPerformanceMonitoring, onWebVitals, onDegradationAlert, mark, measure } from './services/performance'
import { initAnalytics } from './services/analytics'
import { initAlerts, processAlert } from './services/alerts'
import { initSentry } from './services/sentry.js'
import logger from './services/logger.js'
import { preloadPriorityRoutes } from './router/preload'
import ChangelogModal from './components/organisms/ChangelogModal'

// Inicializa Sentry (error tracking em produção)
initSentry()

// Captura promise rejections não tratadas no renderer
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  console.error('[Unhandled Rejection]', reason);
  // O Sentry SDK captura automaticamente, mas garantimos o log local
  if (reason instanceof Error) {
    logger.error('Unhandled promise rejection', { error: reason.message, stack: reason.stack });
  } else {
    logger.error('Unhandled promise rejection', { reason: String(reason) });
  }
})

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

// Alertas de degradação — envia para canais configurados (console, Slack, email)
onDegradationAlert((alert) => {
  console.warn(`[Performance Degradation] ${alert.metric}: ${alert.value} (threshold: ${alert.threshold}, severity: ${alert.severity})`)
  processAlert(alert)
})

// Preload de rotas prioritárias (PDV e Checkout) em background
// Isso acelera a primeira navegação para essas rotas
preloadPriorityRoutes()

// Marca o início do bootstrap da aplicação
mark('app:startup:start')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SentryFeedbackProvider>
      <ErrorBoundary>
        <RouterProvider router={router} />
        <SentryFeedbackButton />
        <SentryFeedbackWidget />
        <ChangelogModal />
      </ErrorBoundary>
    </SentryFeedbackProvider>
  </StrictMode>,
)
// Marca o fim do primeiro render e mede a duração
mark('app:startup:end')
const startupDuration = measure('app:startup:start', 'app:startup:end')
if (startupDuration !== null) {
  console.log('[app] startup duration:', startupDuration, 'ms')
}
