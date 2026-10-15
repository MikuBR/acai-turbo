import { useEffect, useRef, useCallback } from 'react';

// Cache global de chunks já preloadados
const preloadCache = new Map();

/**
 * Faz preload de um módulo dinâmico com cache.
 * Função standalone que pode ser usada fora de componentes React.
 * 
 * @param {string} modulePath - Caminho do módulo para preload
 * @returns {Promise<void>}
 */
export async function preloadModule(modulePath) {
  if (preloadCache.has(modulePath)) {
    return; // Já preloadado
  }

  try {
    preloadCache.set(modulePath, 'loading');
    const module = await import(/* @vite-ignore */ modulePath);
    preloadCache.set(modulePath, module);
    
    if (import.meta.env.DEV) {
      console.log('[Preload] Chunk carregado:', modulePath);
    }
  } catch (err) {
    preloadCache.delete(modulePath);
    if (import.meta.env.DEV) {
      console.warn('[Preload] Falha ao preload:', modulePath, err);
    }
  }
}

/**
 * Preload de rotas prioritárias com cache e detecção de idle.
 * 
 * Estratégia:
 * - Hover em link → preload imediato (via PreloadLink)
 * - Idle (sem interação por X ms) → preload rotas prioritárias
 * - Cache: chunks preloadados são reutilizados no primeiro import()
 * 
 * @param {string[]} priorityRoutes - Array de caminhos de módulo para preload
 * @param {object} options - Opções de configuração
 * @param {number} options.idleDelay - Tempo de idle antes de preload (ms)
 * @param {boolean} options.enabled - Se o preload está ativo
 */
export function usePreloadRoute(priorityRoutes = [], options = {}) {
  const { idleDelay = 2000, enabled = true } = options;
  const idleTimerRef = useRef(null);
  const isPreloadingRef = useRef(false);

  /**
   * Faz preload de um módulo dinâmico com cache.
   * Se já está no cache, não faz nada.
   */
  const preload = useCallback(async (modulePath) => {
    if (preloadCache.has(modulePath)) {
      return; // Já preloadado
    }

    try {
      // Marca como em preload para evitar duplicatas
      preloadCache.set(modulePath, 'loading');
      
      // Faz o import dinâmico — Vite code-splitting
      const module = await import(/* @vite-ignore */ modulePath);
      
      // Armazena no cache
      preloadCache.set(modulePath, module);
      
      if (import.meta.env.DEV) {
        console.log('[Preload] Chunk carregado:', modulePath);
      }
    } catch (err) {
      // Remove do cache em caso de erro para permitir retry
      preloadCache.delete(modulePath);
      if (import.meta.env.DEV) {
        console.warn('[Preload] Falha ao preload:', modulePath, err);
      }
    }
  }, []);

  /**
   * Preload de todas as rotas prioritárias em paralelo.
   */
  const preloadAll = useCallback(async () => {
    if (isPreloadingRef.current) return;
    isPreloadingRef.current = true;

    try {
      await Promise.all(priorityRoutes.map(preload));
    } finally {
      isPreloadingRef.current = false;
    }
  }, [priorityRoutes, preload]);

  /**
   * Detecta idle time e dispara preload.
   * Reinicia o timer a cada interação do usuário.
   */
  useEffect(() => {
    if (!enabled || priorityRoutes.length === 0) return;

    const resetIdleTimer = () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      idleTimerRef.current = setTimeout(() => {
        preloadAll();
      }, idleDelay);
    };

    // Inicia o timer
    resetIdleTimer();

    // Reinicia em interações do usuário
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(event => {
      window.addEventListener(event, resetIdleTimer, { passive: true });
    });

    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      events.forEach(event => {
        window.removeEventListener(event, resetIdleTimer);
      });
    };
  }, [enabled, idleDelay, priorityRoutes, preloadAll]);

  return { preload, preloadAll, preloadCache };
}

/**
 * Hook para preload de uma única rota (usado em PreloadLink).
 */
export function usePreloadOnHover(modulePath) {
  const { preload } = usePreloadRoute([modulePath], { enabled: false });

  const handleMouseEnter = useCallback(() => {
    preload(modulePath);
  }, [preload, modulePath]);

  const handleFocus = useCallback(() => {
    preload(modulePath);
  }, [preload, modulePath]);

  return { handleMouseEnter, handleFocus };
}

/**
 * Verifica se um módulo já está no cache de preload.
 * Usado pelo lazyWithRetry para evitar re-fetch desnecessário.
 */
export function isPreloaded(modulePath) {
  return preloadCache.has(modulePath);
}

/**
 * Obtém um módulo do cache de preload, ou null se não estiver.
 */
export function getPreloaded(modulePath) {
  return preloadCache.get(modulePath) || null;
}
