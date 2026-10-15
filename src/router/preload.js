import { preloadModule } from '../hooks/usePreloadRoute.js';

/**
 * Preload de rotas prioritárias para melhorar TTI (Time to Interactive).
 * Deve ser chamado no entry point do app (main.tsx) após inicialização.
 * 
 * Usa o cache compartilhado do usePreloadRoute para evitar duplicatas.
 */

/**
 * Preload das rotas prioritárias: PDV e Checkout.
 * Usa import() dinâmico para forçar o download dos chunks antes da navegação.
 */
export function preloadPriorityRoutes() {
  return Promise.all([
    preloadModule('../features/pdv/PdvScreen.tsx'),
    preloadModule('../features/pdv/CheckoutScreen.tsx'),
  ]);
}
