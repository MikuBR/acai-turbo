/**
 * Schemas de validação para canais IPC usando Zod.
 * 
 * Uso:
 *   import { schemas } from '../shared/types/ipc-schemas';
 *   const result = schemas['catalog:add-product'].safeParse(data);
 *   if (!result.success) { /* handle error *\/ }
 */

// Validação inline (sem dependência externa de Zod)
// Se quiser usar Zod de verdade: npm install zod

const validators = {
  // --- CATÁLOGO ---
  'catalog:add-product': (data) => {
    if (!data || typeof data !== 'object') return { success: false, error: 'Dados inválidos' };
    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') return { success: false, error: 'Nome é obrigatório' };
    if (!data.price || isNaN(Number(data.price)) || Number(data.price) <= 0) return { success: false, error: 'Preço inválido' };
    if (!data.category || typeof data.category !== 'string') return { success: false, error: 'Categoria é obrigatória' };
    return { success: true, data: { ...data, price: Number(data.price) } };
  },

  'catalog:update-product': (data) => {
    if (!data || typeof data !== 'object') return { success: false, error: 'Dados inválidos' };
    if (!data.id || typeof data.id !== 'number') return { success: false, error: 'ID inválido' };
    if (!data.product || typeof data.product !== 'object') return { success: false, error: 'Produto inválido' };
    if (!data.product.name || typeof data.product.name !== 'string' || data.product.name.trim() === '') return { success: false, error: 'Nome é obrigatório' };
    if (!data.product.price || isNaN(Number(data.product.price)) || Number(data.product.price) <= 0) return { success: false, error: 'Preço inválido' };
    return { success: true, data: { ...data, product: { ...data.product, price: Number(data.product.price) } } };
  },

  'catalog:add-category': (name) => {
    if (!name || typeof name !== 'string' || name.trim() === '') return { success: false, error: 'Nome da categoria inválido' };
    return { success: true, data: name.trim().toUpperCase() };
  },

  // --- PEDIDOS ---
  'orders:save': (data) => {
    if (!data || typeof data !== 'object') return { success: false, error: 'Dados inválidos' };
    if (!data.orderData || typeof data.orderData !== 'object') return { success: false, error: 'Dados do pedido inválidos' };
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) return { success: false, error: 'Itens do pedido inválidos' };
    return { success: true, data };
  },

  // --- AUTENTICAÇÃO ---
  'auth:login': (data) => {
    if (!data || typeof data !== 'object') return { success: false, error: 'Dados inválidos' };
    if (!data.username || typeof data.username !== 'string' || data.username.trim() === '') return { success: false, error: 'Usuário é obrigatório' };
    if (!data.password || typeof data.password !== 'string' || data.password.trim() === '') return { success: false, error: 'Senha é obrigatória' };
    return { success: true, data: { username: data.username.trim(), password: data.password } };
  },

  'auth:change-user-password': (data) => {
    if (!data || typeof data !== 'object') return { success: false, error: 'Dados inválidos' };
    if (!data.userId || typeof data.userId !== 'number') return { success: false, error: 'ID do usuário inválido' };
    if (!data.current || typeof data.current !== 'string' || data.current.length < 4) return { success: false, error: 'Senha atual inválida' };
    if (!data.new || typeof data.new !== 'string' || data.new.length < 4) return { success: false, error: 'Nova senha deve ter no mínimo 4 caracteres' };
    return { success: true, data };
  },

  // --- USUÁRIOS ---
  'users:add': (data) => {
    if (!data || typeof data !== 'object') return { success: false, error: 'Dados inválidos' };
    if (!data.username || typeof data.username !== 'string' || data.username.trim() === '') return { success: false, error: 'Usuário é obrigatório' };
    if (!data.password || typeof data.password !== 'string' || data.password.length < 4) return { success: false, error: 'Senha deve ter no mínimo 4 caracteres' };
    if (!data.full_name || typeof data.full_name !== 'string' || data.full_name.trim() === '') return { success: false, error: 'Nome completo é obrigatório' };
    if (!data.role || !['admin', 'manager', 'operator'].includes(data.role)) return { success: false, error: 'Função inválida' };
    return { success: true, data };
  },

  // --- CAIXA ---
  'cash:register': (data) => {
    if (!data || typeof data !== 'object') return { success: false, error: 'Dados inválidos' };
    if (!data.type || !['ENTRADA', 'SAIDA'].includes(data.type)) return { success: false, error: 'Tipo de movimento inválido' };
    if (!data.amount || isNaN(Number(data.amount)) || Number(data.amount) <= 0) return { success: false, error: 'Valor inválido' };
    if (!data.description || typeof data.description !== 'string' || data.description.trim() === '') return { success: false, error: 'Descrição é obrigatória' };
    return { success: true, data: { ...data, amount: Number(data.amount) } };
  },

  // --- PROMOÇÕES ---
  'promotions:add': (data) => {
    if (!data || typeof data !== 'object') return { success: false, error: 'Dados inválidos' };
    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') return { success: false, error: 'Nome é obrigatório' };
    if (!data.type || !['PERCENTAGE', 'FIXED_AMOUNT', 'BUY_X_GET_Y'].includes(data.type)) return { success: false, error: 'Tipo de promoção inválido' };
    if (!data.value || isNaN(Number(data.value)) || Number(data.value) <= 0) return { success: false, error: 'Valor inválido' };
    if (!data.start_date || !data.end_date) return { success: false, error: 'Datas de início e fim são obrigatórias' };
    return { success: true, data: { ...data, value: Number(data.value), min_quantity: Number(data.min_quantity) || 1 } };
  },

  // --- ESTOQUE ---
  'inventory:add': (data) => {
    if (!data || typeof data !== 'object') return { success: false, error: 'Dados inválidos' };
    if (!data.productId || isNaN(Number(data.productId))) return { success: false, error: 'Produto inválido' };
    if (!data.quantity || isNaN(Number(data.quantity)) || Number(data.quantity) < 0) return { success: false, error: 'Quantidade inválida' };
    return { success: true, data: { ...data, productId: Number(data.productId), quantity: Number(data.quantity), minQuantity: Number(data.minQuantity) || 0 } };
  },

  'inventory:adjust': (data) => {
    if (!data || typeof data !== 'object') return { success: false, error: 'Dados inválidos' };
    if (!data.inventoryId || isNaN(Number(data.inventoryId))) return { success: false, error: 'ID do estoque inválido' };
    if (data.delta === undefined || isNaN(Number(data.delta))) return { success: false, error: 'Delta inválido' };
    return { success: true, data: { ...data, inventoryId: Number(data.inventoryId), delta: Number(data.delta) } };
  },

  // --- FINANCEIRO ---
  'financial:add-account': (data) => {
    if (!data || typeof data !== 'object') return { success: false, error: 'Dados inválidos' };
    if (!data.type || !['payable', 'receivable'].includes(data.type)) return { success: false, error: 'Tipo de conta inválido' };
    if (!data.description || typeof data.description !== 'string' || data.description.trim() === '') return { success: false, error: 'Descrição é obrigatória' };
    if (!data.amount || isNaN(Number(data.amount)) || Number(data.amount) <= 0) return { success: false, error: 'Valor inválido' };
    return { success: true, data: { ...data, amount: Number(data.amount) } };
  },

  // --- CLIENTES ---
  'clients:add': (data) => {
    if (!data || typeof data !== 'object') return { success: false, error: 'Dados inválidos' };
    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') return { success: false, error: 'Nome é obrigatório' };
    return { success: true, data };
  },
};

/**
 * Valida dados para um canal IPC específico.
 * @param {string} channel - Nome do canal IPC
 * @param {*} data - Dados a serem validados
 * @returns {{ success: boolean, data?: any, error?: string }}
 */
export function validateIPC(channel, data) {
  const validator = validators[channel];
  if (!validator) {
    // Se não tem validador específico, passa sem validação
    return { success: true, data };
  }
  return validator(data);
}

/**
 * Retorna todos os nomes de canais IPC válidos.
 * @returns {string[]}
 */
export function getValidChannels() {
  return Object.keys(validators);
}

export { validators };