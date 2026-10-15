import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getProducts, setProducts, invalidateProducts, getCacheStatus, clearProductCache } from '../services/productCache.js';

const mockProducts = [
  { id: 1, name: 'Açaí 500ml', price: 15, category: 'COPOS DE AÇAÍ' },
  { id: 2, name: 'Água', price: 5, category: 'BEBIDAS' },
];

function mockIpcInvoke(products = mockProducts) {
  const invokeMock = vi.fn().mockResolvedValue({ success: true, data: products });
  window.electron = {
    ipcRenderer: {
      invoke: invokeMock,
    },
  };
  return invokeMock;
}

describe('productCache', () => {
  beforeEach(() => {
    clearProductCache();
  });

  afterEach(() => {
    delete window.electron;
    vi.restoreAllMocks();
  });

  it('busca do IPC quando cache está vazio', async () => {
    const invokeMock = mockIpcInvoke();
    const products = await getProducts();
    expect(products).toEqual(mockProducts);
    expect(invokeMock).toHaveBeenCalledWith('catalog:get-products');
  });

  it('retorna do cache quando está fresco (sem chamar IPC)', async () => {
    const invokeMock = mockIpcInvoke();
    await getProducts();
    expect(invokeMock).toHaveBeenCalledTimes(1);

    const products = await getProducts();
    expect(products).toEqual(mockProducts);
    expect(invokeMock).toHaveBeenCalledTimes(1);
  });

  it('setProducts armazena produtos no cache', async () => {
    const invokeMock = mockIpcInvoke();
    setProducts(mockProducts);

    const status = getCacheStatus();
    expect(status.hasCache).toBe(true);
    expect(status.isFresh).toBe(true);

    const products = await getProducts();
    expect(products).toEqual(mockProducts);
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it('invalidateProducts limpa o cache', async () => {
    const invokeMock = mockIpcInvoke();
    setProducts(mockProducts);

    let status = getCacheStatus();
    expect(status.hasCache).toBe(true);

    invalidateProducts();

    status = getCacheStatus();
    expect(status.hasCache).toBe(false);

    await getProducts();
    expect(invokeMock).toHaveBeenCalledTimes(1);
  });

  it('deduplica chamadas IPC concorrentes', async () => {
    let resolveInvoke;
    const invokeMock = vi.fn().mockImplementation(
      () => new Promise((resolve) => { resolveInvoke = resolve; })
    );
    window.electron = { ipcRenderer: { invoke: invokeMock } };

    const p1 = getProducts();
    const p2 = getProducts();
    const p3 = getProducts();

    resolveInvoke({ success: true, data: mockProducts });

    const [r1, r2, r3] = await Promise.all([p1, p2, p3]);
    expect(r1).toEqual(mockProducts);
    expect(r2).toEqual(mockProducts);
    expect(r3).toEqual(mockProducts);
    expect(invokeMock).toHaveBeenCalledTimes(1);
  });

  it('retorna array vazio quando IPC falha', async () => {
    const invokeMock = vi.fn().mockResolvedValue({ success: false, error: 'DB error' });
    window.electron = { ipcRenderer: { invoke: invokeMock } };

    const products = await getProducts();
    expect(products).toEqual([]);
  });

  it('retorna array vazio quando window.electron não existe', async () => {
    delete window.electron;
    const products = await getProducts();
    expect(products).toEqual([]);
  });

  it('clearProductCache limpa cache e inflight promise', async () => {
    let resolveInvoke;
    const invokeMock = vi.fn().mockImplementation(
      () => new Promise((resolve) => { resolveInvoke = resolve; })
    );
    window.electron = { ipcRenderer: { invoke: invokeMock } };

    const p1 = getProducts();
    clearProductCache();
    resolveInvoke({ success: true, data: mockProducts });
    await p1;

    const status = getCacheStatus();
    expect(status.hasCache).toBe(false);
  });

  it('respeita ttl customizado', async () => {
    const invokeMock = mockIpcInvoke();
    await getProducts({ ttlMs: 100 });
    expect(invokeMock).toHaveBeenCalledTimes(1);

    await new Promise(r => setTimeout(r, 150));

    await getProducts({ ttlMs: 100 });
    expect(invokeMock).toHaveBeenCalledTimes(2);
  });
});
