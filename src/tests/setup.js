import '@testing-library/jest-dom';

// Polyfill localStorage para jsdom.
// Em Node.js >= 22 o global `localStorage` é um getter experimental que retorna
// `undefined` (com warning) a menos que o processo seja iniciado com
// `--localstorage-file=<path>`. Esse getter someia o localStorage do jsdom,
// fazendo com que `localStorage.clear()` lance
// "Cannot read properties of undefined (reading 'clear')" em todo teste que
// toca no storage. O polyfill abaixo é idempotente: só define se o objeto
// atual for `undefined` ou não for um Storage real.
if (typeof globalThis.localStorage === 'undefined' || !('setItem' in globalThis.localStorage)) {
  const store = new Map();
  const storageMock = {
    getItem: (key) => (store.has(String(key)) ? store.get(String(key)) : null),
    setItem: (key, value) => {
      store.set(String(key), String(value));
    },
    removeItem: (key) => {
      store.delete(String(key));
    },
    clear: () => {
      store.clear();
    },
    key: (index) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: storageMock,
    writable: true,
    configurable: true,
  });
  if (typeof globalThis.window !== 'undefined') {
    Object.defineProperty(globalThis.window, 'localStorage', {
      value: storageMock,
      writable: true,
      configurable: true,
    });
  }
}
