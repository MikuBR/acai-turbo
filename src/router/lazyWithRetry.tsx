import { lazy, ComponentType } from 'react';
import { getPreloaded } from '../hooks/usePreloadRoute.js';

/**
 * Cria um componente lazy com retry e verificação de cache de preload.
 * 
 * Se o chunk já foi preloadado (via usePreloadRoute ou PreloadLink),
 * o módulo é resolvido instantaneamente do cache. Caso contrário,
 * faz o import dinâmico normal com retry em caso de erro.
 * 
 * @param {string} modulePath - Caminho do módulo para cache/preload
 * @param {() => Promise<{ default: ComponentType<any> }>} factory - Factory do import dinâmico
 * @param {object} options - Opções
 * @param {number} options.maxRetries - Máximo de tentativas (padrão: 3)
 * @param {number} options.retryDelay - Delay entre retries em ms (padrão: 1000)
 * @returns {ComponentType} Componente lazy com retry
 */
export function lazyWithRetry(
  modulePath: string,
  factory: () => Promise<{ default: ComponentType<any> }>,
  options: { maxRetries?: number; retryDelay?: number } = {}
) {
  const { maxRetries = 3, retryDelay = 1000 } = options;

  // Tenta resolver do cache primeiro
  const cachedModule = getPreloaded(modulePath);
  if (cachedModule) {
    return cachedModule.default;
  }

  return lazy(async () => {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const module = await factory();
        return module;
      } catch (err) {
        lastError = err as Error;
        if (import.meta.env.DEV) {
          console.warn(`[lazyWithRetry] Tentativa ${attempt + 1}/${maxRetries} falhou:`, err);
        }
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
      }
    }
    
    throw lastError || new Error('Falha ao carregar componente após múltiplas tentativas');
  });
}
