// ============================================================
// Cache em memória com TTL para produtos (renderer)
// ============================================================
// Estratégia: stale-while-revalidate
//   - Dados frescos (< TTL): retornam do cache sem IPC
//   - Dados stale (>= TTL < 2xTTL): retornam stale + revalidam em background
//   - Dados expirados (>= 2xTTL): bloqueiam até resposta do IPC
// ============================================================

import type { IPCResponse, Product } from '../types';

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutos
const STALE_MULTIPLIER = 2; // stale window = 2x TTL

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface CacheOptions {
  ttlMs?: number;
}

// Estado do cache (módulo singleton)
let cache: CacheEntry<Product[]> | null = null;
let inflightPromise: Promise<Product[]> | null = null;
// Geração do cache: incrementada por clearProductCache() para invalidar
// promises em voo que tentariam repopular o cache após um clear.
let cacheGeneration = 0;

/**
 * Verifica se o cache está fresco (dentro do TTL)
 */
function isFresh(entry: CacheEntry<Product[]>, ttlMs: number): boolean {
  return Date.now() - entry.timestamp < ttlMs;
}

/**
 * Verifica se o cache está stale (dentro da janela stale-while-revalidate)
 */
function isStale(entry: CacheEntry<Product[]>, ttlMs: number): boolean {
  const age = Date.now() - entry.timestamp;
  return age >= ttlMs && age < ttlMs * STALE_MULTIPLIER;
}

/**
 * Verifica se o cache está expirado (fora da janela stale)
 */
function isExpired(entry: CacheEntry<Product[]>, ttlMs: number): boolean {
  return Date.now() - entry.timestamp >= ttlMs * STALE_MULTIPLIER;
}

/**
 * Busca produtos do IPC (usado para revalidação)
 */
async function fetchProductsFromIPC(): Promise<Product[]> {
  // Deduplica chamadas concorrentes
  if (inflightPromise) return inflightPromise;

  inflightPromise = (async () => {
    const generation = cacheGeneration;
    try {
      const ipc = (window as any).electron?.ipcRenderer;
      if (!ipc) return [];

      const res: IPCResponse<Product[]> = await ipc.invoke('catalog:get-products');
      // Se o cache foi limpo durante o await, descarta o resultado
      if (generation !== cacheGeneration) {
        return [];
      }
      if (res?.success && Array.isArray(res.data)) {
        return res.data;
      }
      return [];
    } finally {
      inflightPromise = null;
    }
  })();

  return inflightPromise;
}

/**
 * Obtém produtos do cache ou do IPC.
 * 
 * Comportamento:
 * - Cache fresco: retorna do cache (sem IPC)
 * - Cache stale: retorna stale + revalida em background
 * - Cache expirado/vazio: busca do IPC (bloqueante)
 * 
 * @param options - Opções de cache (ttlMs custom)
 * @returns Promise<Product[]>
 */
export async function getProducts(options: CacheOptions = {}): Promise<Product[]> {
  const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
  const generationAtStart = cacheGeneration;

  if (cache) {
    if (isFresh(cache, ttlMs)) {
      return cache.data;
    }

    if (isStale(cache, ttlMs)) {
      // Retorna stale imediatamente, revalida em background
      fetchProductsFromIPC().then(products => {
        // Só repovoa se o cache não foi limpo durante o await
        if (products.length > 0 && cacheGeneration === generationAtStart) {
          setProducts(products);
        }
      }).catch(() => {/* silencioso */});
      return cache.data;
    }

    // Expirado: cai no fetch bloqueante abaixo
  }

  // Sem cache ou expirado: busca do IPC
  const products = await fetchProductsFromIPC();
  // Só repovoa se o cache não foi limpo durante o await (clearProductCache incrementa a geração)
  if (products.length > 0 && cacheGeneration === generationAtStart) {
    setProducts(products);
  }
  return products;
}

/**
 * Armazena produtos no cache.
 * @param products - Lista de produtos para cachear
 */
export function setProducts(products: Product[]): void {
  cache = {
    data: products,
    timestamp: Date.now(),
  };
}

/**
 * Invalida o cache de produtos.
 * Deve ser chamado após add/update/delete de produtos.
 */
export function invalidateProducts(): void {
  cache = null;
}

/**
 * Retorna o estado atual do cache (para debugging/monitoring).
 */
export function getCacheStatus(): { hasCache: boolean; ageMs: number | null; isFresh: boolean; isStale: boolean } {
  if (!cache) {
    return { hasCache: false, ageMs: null, isFresh: false, isStale: false };
  }
  const ageMs = Date.now() - cache.timestamp;
  return {
    hasCache: true,
    ageMs,
    isFresh: isFresh(cache, DEFAULT_TTL_MS),
    isStale: isStale(cache, DEFAULT_TTL_MS),
  };
}

/**
 * Limpa completamente o cache (útil para logout/reset).
 */
export function clearProductCache(): void {
  cache = null;
  inflightPromise = null;
  cacheGeneration++;
}
