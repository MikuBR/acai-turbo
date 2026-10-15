// ============================================================
// sentry.cjs — Inicialização do Sentry no main process (Electron)
// ============================================================
// Responsável por:
// - Inicializar o Sentry SDK no main process
// - Capturar erros não tratados
// - Adicionar breadcrumbs para operações críticas
// - Configurar source maps
//
// O DSN é lido de process.env.VITE_SENTRY_DSN
// Apenas inicializa em produção (NODE_ENV=production)
// ============================================================

const Sentry = require('@sentry/electron/main');
const path = require('path');
const fs = require('fs');

let isInitialized = false;

/**
 * Inicializa o Sentry no main process.
 * Deve ser chamado uma vez no início do main.cjs.
 * Idempotente — chamadas subsequentes são ignoradas.
 */
function initSentry() {
  if (isInitialized) return;

  const dsn = process.env.VITE_SENTRY_DSN;

  // Não inicializa se não houver DSN configurado
  if (!dsn) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Sentry Main] DSN não configurado — Sentry desabilitado');
    }
    return;
  }

  // Não inicializa em desenvolvimento
  if (process.env.NODE_ENV !== 'production') {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Sentry Main] Desabilitado em desenvolvimento');
    }
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'production',
    release: process.env.VITE_APP_VERSION || 'unknown',

    // Integrações padrão
    integrations: [
      // Captura erros não tratados
      Sentry.mainProcessSessionIntegration(),
      // Captura erros de crash do Electron
      Sentry.electronMinidumpIntegration(),
    ],

    // Performance monitoring
    tracesSampleRate: 0.1, // 10% das transações

    // Não enviar dados sensíveis
    beforeSend(event) {
      // Remove dados sensíveis do evento
      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['Cookie'];
      }
      if (event.request?.data) {
        const data = event.request.data;
        if (typeof data === 'object') {
          delete data.password;
          delete data.token;
          delete data.accessToken;
          delete data.refreshToken;
        }
      }
      return event;
    },

    // Tags padrão
    initialScope: {
      tags: {
        platform: 'electron-main',
      },
    },
  });

  isInitialized = true;
  console.log('[Sentry Main] Inicializado com sucesso');
}

/**
 * Adiciona um breadcrumb ao Sentry.
 * @param {string} category - Categoria do breadcrumb
 * @param {string} message - Mensagem descritiva
 * @param {string} level - Nível: 'info' | 'warning' | 'error'
 * @param {object} data - Dados adicionais
 */
function addBreadcrumb(category, message, level = 'info', data = {}) {
  if (!isInitialized) return;

  Sentry.addBreadcrumb({
    category,
    message,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Reporta um erro manualmente ao Sentry.
 * @param {Error|string} error - Erro ou mensagem
 * @param {object} context - Contexto adicional
 */
function reportError(error, context = {}) {
  if (!isInitialized) return;

  const err = error instanceof Error ? error : new Error(String(error));

  Sentry.withScope((scope) => {
    Object.entries(context).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });

    if (context.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    Sentry.captureException(err);
  });
}

/**
 * Define o usuário atual no Sentry.
 * @param {object} user - Objeto com id, email, username
 */
function setUser(user) {
  if (!isInitialized) return;

  if (user) {
    Sentry.setUser({
      id: user.id?.toString(),
      email: user.email,
      username: user.username,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Define uma tag personalizada no Sentry.
 * @param {string} key - Nome da tag
 * @param {string} value - Valor da tag
 */
function setTag(key, value) {
  if (!isInitialized) return;
  Sentry.setTag(key, value);
}

/**
 * Define um contexto extra no Sentry.
 * @param {string} key - Nome do contexto
 * @param {object} value - Valor do contexto
 */
function setContext(key, value) {
  if (!isInitialized) return;
  Sentry.setContext(key, value);
}

/**
 * Retorna true se o Sentry está inicializado.
 */
function isSentryInitialized() {
  return isInitialized;
}

/**
 * Retorna a instância do Sentry para uso avançado.
 */
function getSentry() {
  return Sentry;
}

module.exports = {
  initSentry,
  addBreadcrumb,
  reportError,
  setUser,
  setTag,
  setContext,
  isSentryInitialized,
  getSentry,
};
