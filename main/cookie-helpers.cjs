/**
 * cookie-helpers.cjs
 *
 * Encapsulates every interaction with Electron's `session.cookies` API for auth
 * tokens, so the calling code in main.cjs can't accidentally regress the
 * (in)famous 3-arg signature that threw synchronously on login.
 *
 * Why a separate module:
 *  - `session.cookies.set(details)` REQUIRES a single CookiesSetDetails object
 *    whose `url` field is mandatory. The previous implementation called
 *    `cookies.set(name, value, opts)` (string first arg) which synchronously
 *    throws `TypeError: Error processing argument at index 0, conversion
 *    failure from <name>`. Extracting the call sites into pure, testable
 *    helpers (no `require('electron')` here) lets vitest assert the correct
 *    shape without launching Electron.
 *  - `cookies.remove(url, name)` and `cookies.get({ url, name })` use equally
 *    easy-to-invert signatures; keeping them here prevents the same class of
 *    bug from creeping into logout / refresh / session-restore paths.
 *
 * `isProd` is passed in by the caller (from `app.isPackaged`) rather than read
 * here, so these functions stay side-effect free and unit-testable in Node.
 */

'use strict';

// Nomes e TTLs vivem aqui como única fonte da verdade; main.cjs importa-os.
const AUTH_COOKIE_NAME = 'auth_token';
const REFRESH_COOKIE_NAME = 'refresh_token';
const AUTH_TOKEN_TTL_MS = 8 * 60 * 60 * 1000; // 8 horas
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

/**
 * Deriva a origem (scheme + host) do renderer onde os cookies httpOnly devem
 * ser lidos/gravados. Em dev o renderer é `http://localhost:5173` (cookies
 * httpOnly funcionam com secure=false). Em prod (file://) httpOnly não pode
 * ser garantido sobre file:// — nesse caso retornamos um origin http válido
 * para que a chamada não lance, mas o cookie não faremos round-trip; a auth
 * primária continua sendo a sessão corrente em memória (currentSession).
 *
 * @param {{ getURL: () => string }} webContents
 * @returns {string} origin no formato `scheme://host`
 */
function getCookieOrigin(webContents) {
  try {
    const { protocol, host } = new URL(webContents.getURL());
    if (protocol === 'http:' || protocol === 'https:') {
      return `${protocol}//${host}`;
    }
  } catch (_) {
    // getURL() pode lançar / retornar URL inválida em contextos de teste.
  }
  return 'http://localhost';
}

/**
 * Monta um objeto CookiesSetDetails válido para `session.cookies.set`.
 * O `url` é obrigatório pela API Electron — ele é o que garante que a chamada
 * não lance `TypeError` de conversão.
 *
 * @returns {Electron.CookieSetDetails}
 */
function buildSetDetails(url, name, value, ttlMs, isProd) {
  return {
    url,
    name,
    value,
    httpOnly: true,
    secure: !!isProd && /^https:/i.test(url),
    sameSite: 'strict',
    path: '/',
    maxAge: Math.round(ttlMs / 1000),
  };
}

/**
 * Grava os cookies httpOnly de access + refresh.
 * @param {Electron.Session} session  (duck-typed: precisa de `.cookies`)
 * @param {string} urlOrigin
 * @param {string} accessToken
 * @param {string} refreshToken
 * @param {boolean} isProd
 */
function setAuthCookies(session, urlOrigin, accessToken, refreshToken, isProd) {
  Promise.resolve(session.cookies.set(
    buildSetDetails(urlOrigin, AUTH_COOKIE_NAME, accessToken, AUTH_TOKEN_TTL_MS, isProd)
  )).catch((e) => console.error('[auth] cookies.set (access) failed:', e?.message));
  Promise.resolve(session.cookies.set(
    buildSetDetails(urlOrigin, REFRESH_COOKIE_NAME, refreshToken, REFRESH_TOKEN_TTL_MS, isProd)
  )).catch((e) => console.error('[auth] cookies.set (refresh) failed:', e?.message));
}

/**
 * Apaga os cookies httpOnly de access + refresh.
 * `session.cookies.remove(url, name)` recebe url e name como dois argumentos.
 */
function clearAuthCookies(session, urlOrigin) {
  session.cookies.remove(urlOrigin, AUTH_COOKIE_NAME);
  session.cookies.remove(urlOrigin, REFRESH_COOKIE_NAME);
}

/**
 * Lê o access token do cookie httpOnly via filtro `{ url, name }`.
 * Retorna uma Promise<string|null>.
 */
function getAuthTokenFromCookies(session, urlOrigin) {
  return Promise.resolve(session.cookies.get({ url: urlOrigin, name: AUTH_COOKIE_NAME })).then(
    (cookies) => (cookies && cookies[0] && cookies[0].value) || null
  );
}

/**
 * Lê o refresh token do cookie httpOnly.
 */
function getRefreshTokenFromCookies(session, urlOrigin) {
  return Promise.resolve(
    session.cookies.get({ url: urlOrigin, name: REFRESH_COOKIE_NAME })
  ).then((cookies) => (cookies && cookies[0] && cookies[0].value) || null);
}

module.exports = {
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
};
