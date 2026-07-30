/**
 * Error Service — Tratamento centralizado de erros do frontend.
 *
 * Fornece funções utilitárias para:
 * - Extrair mensagens amigáveis de erros (Error, string, respostas IPC)
 * - Logar erros com contexto
 * - Verificar respostas IPC padronizadas ({ success, error })
 */

/**
 * Verifica se um valor é uma instância de Error.
 * @param {*} obj
 * @returns {boolean}
 */
export function isError(obj) {
  return obj != null && obj instanceof Error;
}

/**
 * Extrai a mensagem de um erro, suportando:
 * - Error objects (usa .message)
 * - Strings (retorna direto)
 * - Objetos com propriedade .error ou .message
 * - Outros tipos (converte para string)
 * @param {*} error
 * @returns {string}
 */
export function extractErrorMessage(error) {
  if (error == null) return 'Erro desconhecido';
  if (typeof error === 'string') return error;
  if (isError(error)) return error.message || 'Erro sem mensagem';
  if (typeof error === 'object') {
    if (typeof error.error === 'string' && error.error.length > 0) return error.error;
    if (typeof error.message === 'string' && error.message.length > 0) return error.message;
  }
  return String(error);
}

/**
 * Loga um erro no console com contexto opcional.
 * @param {*} error — O erro (Error, string, ou objeto com .error)
 * @param {string} [context] — Contexto adicional (ex: nome do componente ou função)
 */
export function logError(error, context) {
  const prefix = context ? `[${context}]` : '[error]';
  if (isError(error)) {
    console.error(prefix, error.message, error);
  } else {
    console.error(prefix, extractErrorMessage(error));
  }
}

/**
 * Trata um erro de forma centralizada: loga e retorna mensagem amigável.
 * @param {*} error — O erro (Error, string, ou objeto com .error)
 * @param {string} [context] — Contexto para log (ex: nome do componente)
 * @param {string} [fallbackMessage] — Mensagem padrão se não houver mensagem extraível
 * @returns {string} — Mensagem amigável pronta para exibição
 */
export function handleError(error, context, fallbackMessage) {
  logError(error, context);
  const msg = extractErrorMessage(error);
  if (!msg || msg === 'Erro desconhecido') {
    return fallbackMessage || 'Ocorreu um erro inesperado. Tente novamente.';
  }
  return msg;
}

/**
 * Verifica uma resposta IPC padronizada ({ success, error, ...data }).
 * Se a resposta indicar falha, loga o erro e retorna a mensagem.
 * Se a resposta for nula/undefined (IPC indisponível), retorna fallback.
 * Se a resposta for bem-sucedida, retorna null (sem erro).
 * @param {*} res — Resposta do IPC
 * @param {string} [context] — Contexto para log
 * @param {string} [fallbackMessage] — Mensagem se res for null/undefined
 * @returns {string|null} — Mensagem de erro ou null se sucesso
 */
export function handleIPCError(res, context, fallbackMessage) {
  if (res == null) {
    logError(new Error('IPC returned null/undefined'), context);
    return fallbackMessage || 'Sem resposta do sistema. Verifique a conexão.';
  }
  if (res.success === false) {
    return handleError(res.error, context, fallbackMessage || 'Operação falhou.');
  }
  // Verifica se há erro mesmo com success true (edge case)
  if (res.error) {
    return handleError(res.error, context);
  }
  return null;
}

export default {
  isError,
  extractErrorMessage,
  logError,
  handleError,
  handleIPCError,
};