/**
 * Regressão: o login lançava "Erro interno ao fazer login" porque setAuthCookies
 * chamava `session.cookies.set(name, value, opts)` (3 args, string no índice 0)
 * em vez de `session.cookies.set({ url, name, value, ... })`. Esse teste
 * garante que:
 *   - cookies.set receba um OBJETO com `url` (não uma string);
 *   - cookies.remove revele url+name;
 *   - cookies.get filtre por `{ url, name }`.
 *
 * Não requer Electron: os helpers são puros (duck-typed session) e importam
 * `main/cookie-helpers.cjs`, que não carrega o binding nativo.
 */

import { describe, it, expect } from 'vitest';
import cookieHelpers from '../../main/cookie-helpers.cjs';

const {
  AUTH_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  AUTH_TOKEN_TTL_MS,
  REFRESH_TOKEN_TTL_MS,
  getCookieOrigin,
  buildSetDetails,
  setAuthCookies,
  clearAuthCookies,
  getAuthTokenFromCookies,
  getRefreshTokenFromCookies,
} = cookieHelpers;

describe('cookie helpers — Electron cookies.set regression', () => {
  it('setAuthCookies passa um OBJETO com url para cookies.set (não uma string)', () => {
    // Regression guard: antes, arg0 era o nome do cookie (string) e lançava
    // TypeError de conversão síncrona. Agora deve ser { url, name, value, ... }
    const setCalls = [];
    const mockSession = {
      cookies: { set: (details) => setCalls.push(details) },
    };

    setAuthCookies(mockSession, 'http://localhost:5173', 'access.token', 'refresh.token', false);

    expect(setCalls).toHaveLength(2);
    for (const call of setCalls) {
      expect(typeof call).toBe('object');
      expect(call).not.toBeNull();
      // O defeito original: url estava ausente. Ele é obrigatório e deve bater
      // com a origem derivada do renderer.
      expect(call.url).toBe('http://localhost:5173');
      expect(call.name).toBeTruthy();
      expect(call.value).toBeTruthy();
      expect(call.httpOnly).toBe(true);
      expect(call.sameSite).toBe('strict');
      expect(call.path).toBe('/');
      expect(call.maxAge).toBeGreaterThan(0);
      expect(call.secure).toBe(false); // dev (isProd = false) => secure off
    }
    expect(setCalls[0].name).toBe(AUTH_COOKIE_NAME);
    expect(setCalls[1].name).toBe(REFRESH_COOKIE_NAME);
    expect(setCalls[0].value).toBe('access.token');
    expect(setCalls[1].value).toBe('refresh.token');
    expect(setCalls[0].maxAge).toBe(Math.round(AUTH_TOKEN_TTL_MS / 1000));
    expect(setCalls[1].maxAge).toBe(Math.round(REFRESH_TOKEN_TTL_MS / 1000));
  });

  it('em prod (isProd=true) sobre origin http (fallback), secure=false (Chromium rejeita secure sobre http)', () => {
    const setCalls = [];
    const mockSession = { cookies: { set: (d) => setCalls.push(d) } };
    setAuthCookies(mockSession, 'http://localhost', 'a', 'r', true);
    expect(setCalls[0].secure).toBe(false);
    expect(setCalls[0].url).toBe('http://localhost');
  });

  it('em prod (isProd=true) sobre origin https, secure=true', () => {
    const setCalls = [];
    const mockSession = { cookies: { set: (d) => setCalls.push(d) } };
    setAuthCookies(mockSession, 'https://app.local', 'a', 'r', true);
    expect(setCalls[0].secure).toBe(true);
    expect(setCalls[0].url).toBe('https://app.local');
  });

  it('clearAuthCookies chama remove(url, name) para ambos os cookies', () => {
    const calls = [];
    const mockSession = {
      cookies: { remove: (url, name) => calls.push({ url, name }) },
    };
    clearAuthCookies(mockSession, 'http://localhost:5173');
    expect(calls).toEqual([
      { url: 'http://localhost:5173', name: AUTH_COOKIE_NAME },
      { url: 'http://localhost:5173', name: REFRESH_COOKIE_NAME },
    ]);
  });

  it('getAuthTokenFromCookies / getRefreshTokenFromCookies filtram por { url, name }', async () => {
    const getFilters = [];
    const mockSession = {
      cookies: { get: (filter) => getFilters.push(filter) },
    };
    // Simula cookies httpOnly já gravados (Electron devolve [{ value }]).
    mockSession.cookies.get = (filter) => {
      getFilters.push(filter);
      return Promise.resolve([
        filter.name === AUTH_COOKIE_NAME
          ? { value: 'access-from-cookie' }
          : { value: 'refresh-from-cookie' },
      ]);
    };

    const access = await getAuthTokenFromCookies(mockSession, 'http://localhost:5173');
    const refresh = await getRefreshTokenFromCookies(mockSession, 'http://localhost:5173');

    expect(access).toBe('access-from-cookie');
    expect(refresh).toBe('refresh-from-cookie');
    expect(getFilters.some((f) => f.url === 'http://localhost:5173' && f.name === AUTH_COOKIE_NAME)).toBe(true);
    expect(getFilters.some((f) => f.url === 'http://localhost:5173' && f.name === REFRESH_COOKIE_NAME)).toBe(true);
  });

  it('getAuthTokenFromCookies retorna null quando não há cookie', async () => {
    const mockSession = { cookies: { get: () => Promise.resolve([]) } };
    await expect(getAuthTokenFromCookies(mockSession, 'http://localhost:5173')).resolves.toBeNull();
  });

  it('buildSetDetails produz um CookiesSetDetails válido', () => {
    const d = buildSetDetails('http://localhost:5173', AUTH_COOKIE_NAME, 'v', 1000, false);
    expect(d.url).toBe('http://localhost:5173');
    expect(d.name).toBe(AUTH_COOKIE_NAME);
    expect(d.value).toBe('v');
    expect(d.httpOnly).toBe(true);
    expect(d.sameSite).toBe('strict');
    expect(d.path).toBe('/');
    expect(d.secure).toBe(false);
    expect(d.maxAge).toBe(1);
  });

  describe('getCookieOrigin', () => {
    it('deriva scheme://host de webContents.getURL() http', () => {
      expect(getCookieOrigin({ getURL: () => 'http://localhost:5173/' })).toBe('http://localhost:5173');
      expect(getCookieOrigin({ getURL: () => 'https://app.local:443/' })).toBe('https://app.local');
    });
    it('faz fallback a http://localhost para file://', () => {
      expect(getCookieOrigin({ getURL: () => 'file:///dist/index.html' })).toBe('http://localhost');
    });
    it('faz fallback a http://localhost se getURL() lançar', () => {
      expect(getCookieOrigin({ getURL: () => { throw new Error('boom'); } })).toBe('http://localhost');
    });
  });
});
