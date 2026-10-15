// ============================================================
// sentry.js — Inicialização e utilitários do Sentry (renderer)
// ============================================================
// Responsável por:
// - Inicializar o Sentry SDK no renderer (React)
// - Configurar user feedback widget
// - Adicionar breadcrumbs para operações críticas
// - Reportar erros manualmente
//
// O DSN é lido de import.meta.env.VITE_SENTRY_DSN
// Apenas inicializa em produção (import.meta.env.PROD)
// ============================================================

import * as Sentry from '@sentry/react';

let isInitialized = false;

/**
 * Inicializa o Sentry no renderer.
 * Deve ser chamado uma vez no entry point do app (main.jsx).
 * Idempotente — chamadas subsequentes são ignoradas.
 */
export function initSentry() {
  if (isInitialized) return;

  const dsn = import.meta.env.VITE_SENTRY_DSN;

  // Não inicializa se não houver DSN configurado
  if (!dsn) {
    if (import.meta.env.DEV) {
      console.log('[Sentry] DSN não configurado — Sentry desabilitado');
    }
    return;
  }

  // Não inicializa em desenvolvimento
  if (!import.meta.env.PROD) {
    if (import.meta.env.DEV) {
      console.log('[Sentry] Desabilitado em desenvolvimento');
    }
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || 'production',
    release: import.meta.env.VITE_APP_VERSION || 'unknown',

    // Integrações padrão
    integrations: [
      // Breadcrumbs de navegação
      Sentry.browserTracingIntegration({
        // Instrumentação de navegação
        enableInp: true,
      }),
      // Replay para sessões de usuário (opcional, pode ser removido se não usar)
      // Sentry.replayIntegration({
      //   maskAllText: true,
      //   blockAllMedia: true,
      // }),
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
        // Remove senhas e tokens do body
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
        platform: 'electron-renderer',
      },
    },
  });

  isInitialized = true;
  console.log('[Sentry] Inicializado com sucesso');
}

/**
 * Adiciona um breadcrumb ao Sentry.
 * @param {string} category - Categoria do breadcrumb (ex: 'auth', 'checkout')
 * @param {string} message - Mensagem descritiva
 * @param {string} level - Nível: 'info' | 'warning' | 'error'
 * @param {object} data - Dados adicionais
 */
export function addBreadcrumb(category, message, level = 'info', data = {}) {
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
export function reportError(error, context = {}) {
  if (!isInitialized) return;

  const err = error instanceof Error ? error : new Error(String(error));

  Sentry.withScope((scope) => {
    // Adiciona contexto
    Object.entries(context).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });

    // Adiciona tags
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
export function setUser(user) {
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
export function setTag(key, value) {
  if (!isInitialized) return;
  Sentry.setTag(key, value);
}

/**
 * Define um contexto extra no Sentry.
 * @param {string} key - Nome do contexto
 * @param {object} value - Valor do contexto
 */
export function setContext(key, value) {
  if (!isInitialized) return;
  Sentry.setContext(key, value);
}

/**
 * Retorna true se o Sentry está inicializado.
 */
export function isSentryInitialized() {
  return isInitialized;
}

/**
 * Retorna a instância do Sentry para uso avançado.
 */
export function getSentry() {
  return Sentry;
}

export default {
  initSentry,
  addBreadcrumb,
  reportError,
  setUser,
  setTag,
  setContext,
  isSentryInitialized,
  getSentry,
};
