// @ts-check

/** @typedef {{ success: boolean; data?: any; error?: string }} ValidationResult */

/** @type {Record<string, (data?: any) => ValidationResult>} */
const validators = {
  'catalog:add-product': (data) => {
    if (!data || typeof data !== 'object') return { success: false, error: 'Dados inválidos' };
    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') return { success: false, error: 'Nome é obrigatório' };
    if (data.price === undefined || isNaN(Number(data.price)) || Number(data.price) <= 0) return { success: false, error: 'Preço inválido' };
    if (!data.category || typeof data.category !== 'string') return { success: false, error: 'Categoria é obrigatória' };
    return { success: true, data: { ...data, price: Number(data.price) } };
  },

  'catalog:update-product': (data) => {
    if (!data || typeof data !== 'object') return { success: false, error: 'Dados inválidos' };
    if (!data.id || isNaN(Number(data.id))) return { success: false, error: 'ID inválido' };
    if (!data.product || typeof data.product !== 'object') return { success: false, error: 'Produto inválido' };
    if (!data.product.name || typeof data.product.name !== 'string' || data.product.name.trim() === '') return { success: false, error: 'Nome é obrigatório' };
    if (data.product.price === undefined || isNaN(Number(data.product.price)) || Number(data.product.price) <= 0) return { success: false, error: 'Preço inválido' };
    return { success: true, data: { ...data, id: Number(data.id), product: { ...data.product, price: Number(data.product.price) } } };
  },

  'catalog:delete-product': (id) => {
    if (id === undefined || id === null || isNaN(Number(id))) return { success: false, error: 'ID inválido' };
    return { success: true, data: Number(id) };
  },

  'catalog:add-category': (name) => {
    if (!name || typeof name !== 'string' || name.trim() === '') return { success: false, error: 'Nome da categoria inválido' };
    return { success: true, data: name.trim().toUpperCase() };
  },

  'catalog:delete-category': (id) => {
    if (id === undefined || id === null || isNaN(Number(id))) return { success: false, error: 'ID inválido' };
    return { success: true, data: Number(id) };
  },

  'orders:save': (data) => {
    if (!data || typeof data !== 'object') return { success: false, error: 'Dados inválidos' };
    if (!data.orderData || typeof data.orderData !== 'object') return { success: false, error: 'Dados do pedido inválidos' };
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) return { success: false, error: 'Itens do pedido inválidos' };

    const od = data.orderData;
    const paymentMethods = ['DINHEIRO', 'PIX', 'DÉBITO', 'CRÉDITO', 'PERMUTA'];

    if (od.payments !== undefined) {
      // --- FORMATO NOVO (pagamentos mistos) ---
      if (!Array.isArray(od.payments) || od.payments.length === 0) {
        return { success: false, error: 'Adicione pelo menos uma forma de pagamento' };
      }

      let hasPermuta = false;
      let sum = 0;
      for (const p of od.payments) {
        if (!p || typeof p !== 'object') return { success: false, error: 'Pagamento inválido' };
        const method = (p.method || '').trim().toUpperCase();
        if (!method || !paymentMethods.includes(method)) {
          return { success: false, error: `Forma de pagamento inválida: ${p.method || ''}` };
        }
        if (p.amount === undefined || isNaN(Number(p.amount)) || Number(p.amount) <= 0) {
          return { success: false, error: 'Valor de pagamento inválido' };
        }
        p.method = method;
        p.amount = Number(p.amount);

        if (method === 'PERMUTA') {
          hasPermuta = true;
          if (!p.exchangeFor || typeof p.exchangeFor !== 'string' || p.exchangeFor.trim() === '') {
            return { success: false, error: 'Para permutas, descreva o que foi recebido em troca' };
          }
        }
        sum += p.amount;
      }

      // PERMUTA exclusivo: não pode combinar com outros métodos
      if (hasPermuta && od.payments.length > 1) {
        return { success: false, error: 'Permuta não pode ser combinada com outros métodos de pagamento' };
      }

      // Soma dos pagamentos deve cobrir o total (tolerância de centavos)
      if (od.total === undefined || isNaN(Number(od.total))) {
        return { success: false, error: 'Total do pedido inválido' };
      }
      const total = Number(od.total);
      if (Math.round(sum * 100) < Math.round(total * 100)) {
        return { success: false, error: `Valor dos pagamentos (R$ ${sum.toFixed(2)}) é menor que o total (R$ ${total.toFixed(2)})` };
      }

      // amountReceived é opcional (só usado se houver DINHEIRO)
      if (od.amountReceived !== undefined && od.amountReceived !== null && od.amountReceived !== '') {
        od.amountReceived = Number(od.amountReceived) || 0;
      }

      return { success: true, data };
    } else {
      // --- FORMATO LEGADO (paymentMethod string, ex: iFood) ---
      const paymentMethod = od.paymentMethod?.trim().toUpperCase();
      if (!paymentMethod || !paymentMethods.includes(paymentMethod)) {
        return { success: false, error: 'Método de pagamento inválido' };
      }
      if (paymentMethod === 'PERMUTA') {
        if (!od.exchangeFor || typeof od.exchangeFor !== 'string' || od.exchangeFor.trim() === '') {
          return { success: false, error: 'Para permutas, é obrigatório descrever o que foi recebido em troca' };
        }
      }
      return { success: true, data };
    }
  },

  'orders:get-history': (params) => {
    if (!params) return { success: true, data: null };
    if (typeof params !== 'object') return { success: false, error: 'Parâmetros inválidos' };
    if (params.startDate && typeof params.startDate !== 'string') return { success: false, error: 'Data inicial inválida' };
    if (params.endDate && typeof params.endDate !== 'string') return { success: false, error: 'Data final inválida' };
    return { success: true, data: params };
  },

  'orders:delete': (id) => {
    if (id === undefined || id === null || isNaN(Number(id))) return { success: false, error: 'ID inválido' };
    return { success: true, data: Number(id) };
  },

  'cash:register': (data) => {
    if (!data || typeof data !== 'object') return { success: false, error: 'Dados inválidos' };
    if (!data.type || !['ENTRADA', 'SAIDA'].includes(data.type)) return { success: false, error: 'Tipo de movimento inválido' };
    if (data.amount === undefined || isNaN(Number(data.amount)) || Number(data.amount) <= 0) return { success: false, error: 'Valor inválido' };
    if (!data.description || typeof data.description !== 'string' || data.description.trim() === '') return { success: false, error: 'Descrição é obrigatória' };
    return { success: true, data: { ...data, amount: Number(data.amount) } };
  },

  'reports:by-period': (data) => {
    if (!data || typeof data !== 'object') return { success: false, error: 'Dados inválidos' };
    if (!data.startDate || typeof data.startDate !== 'string') return { success: false, error: 'Data inicial inválida' };
    if (!data.endDate || typeof data.endDate !== 'string') return { success: false, error: 'Data final inválida' };
    return { success: true, data: { startDate: data.startDate, endDate: data.endDate } };
  },

  'promotions:add': (data) => {
    if (!data || typeof data !== 'object') return { success: false, error: 'Dados inválidos' };
    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') return { success: false, error: 'Nome é obrigatório' };
    if (!data.type || !['PERCENTAGE', 'FIXED_AMOUNT', 'BUY_X_GET_Y'].includes(data.type)) return { success: false, error: 'Tipo de promoção inválido' };
    if (data.value === undefined || isNaN(Number(data.value)) || Number(data.value) <= 0) return { success: false, error: 'Valor inválido' };
    if (!data.start_date || !data.end_date) return { success: false, error: 'Datas de início e fim são obrigatórias' };
    return { success: true, data: { ...data, value: Number(data.value), min_quantity: Number(data.min_quantity) || 1 } };
  },

  'promotions:update': (data) => {
    if (!data || typeof data !== 'object') return { success: false, error: 'Dados inválidos' };
    if (!data.id || isNaN(Number(data.id))) return { success: false, error: 'ID inválido' };
    if (!data.promo || typeof data.promo !== 'object') return { success: false, error: 'Promoção inválida' };
    if (!data.promo.name || typeof data.promo.name !== 'string' || data.promo.name.trim() === '') return { success: false, error: 'Nome é obrigatório' };
    if (!data.promo.type || !['PERCENTAGE', 'FIXED_AMOUNT', 'BUY_X_GET_Y'].includes(data.promo.type)) return { success: false, error: 'Tipo de promoção inválido' };
    if (data.promo.value === undefined || isNaN(Number(data.promo.value)) || Number(data.promo.value) <= 0) return { success: false, error: 'Valor inválido' };
    return { success: true, data: { ...data, id: Number(data.id), promo: { ...data.promo, value: Number(data.promo.value) } } };
  },

  'promotions:delete': (id) => {
    if (id === undefined || id === null || isNaN(Number(id))) return { success: false, error: 'ID inválido' };
    return { success: true, data: Number(id) };
  },

  'auth:login': (data) => {
    if (!data || typeof data !== 'object') return { success: false, error: 'Dados inválidos' };
    if (!data.username || typeof data.username !== 'string' || data.username.trim() === '') return { success: false, error: 'Usuário é obrigatório' };
    if (!data.password || typeof data.password !== 'string' || data.password.trim() === '') return { success: false, error: 'Senha é obrigatória' };
    return { success: true, data: { username: data.username.trim(), password: data.password } };
  },

  'auth:change-user-password': (data) => {
    if (!data || typeof data !== 'object') return { success: false, error: 'Dados inválidos' };
    if (!data.userId || isNaN(Number(data.userId))) return { success: false, error: 'ID do usuário inválido' };
    if (!data.current || typeof data.current !== 'string' || data.current.length < 4) return { success: false, error: 'Senha atual inválida' };
    if (!data.new || typeof data.new !== 'string' || data.new.length < 4) return { success: false, error: 'Nova senha deve ter no mínimo 4 caracteres' };
    return { success: true, data: { ...data, userId: Number(data.userId) } };
  },

  'users:add': (data) => {
    if (!data || typeof data !== 'object') return { success: false, error: 'Dados inválidos' };
    if (!data.username || typeof data.username !== 'string' || data.username.trim() === '') return { success: false, error: 'Usuário é obrigatório' };
    if (!data.password || typeof data.password !== 'string' || data.password.length < 4) return { success: false, error: 'Senha deve ter no mínimo 4 caracteres' };
    if (!data.full_name || typeof data.full_name !== 'string' || data.full_name.trim() === '') return { success: false, error: 'Nome completo é obrigatório' };
    if (!data.role || !['admin', 'manager', 'operator'].includes(data.role)) return { success: false, error: 'Função inválida' };
    return { success: true, data };
  },

  'users:update': (data) => {
    if (!data || typeof data !== 'object') return { success: false, error: 'Dados inválidos' };
    if (!data.id || isNaN(Number(data.id))) return { success: false, error: 'ID inválido' };
    if (!data.user || typeof data.user !== 'object') return { success: false, error: 'Dados do usuário inválidos' };
    if (!data.user.username || typeof data.user.username !== 'string' || data.user.username.trim() === '') return { success: false, error: 'Usuário é obrigatório' };
    if (!data.user.full_name || typeof data.user.full_name !== 'string' || data.user.full_name.trim() === '') return { success: false, error: 'Nome completo é obrigatório' };
    if (!data.user.role || !['admin', 'manager', 'operator'].includes(data.user.role)) return { success: false, error: 'Função inválida' };
    return { success: true, data: { ...data, id: Number(data.id) } };
  },

  'users:delete': (id) => {
    if (id === undefined || id === null || isNaN(Number(id))) return { success: false, error: 'ID inválido' };
    return { success: true, data: Number(id) };
  },

  'users:toggle-active': (id) => {
    if (id === undefined || id === null || isNaN(Number(id))) return { success: false, error: 'ID inválido' };
    return { success: true, data: Number(id) };
  },

  'inventory:add': (data) => {
    if (!data || typeof data !== 'object') return { success: false, error: 'Dados inválidos' };
    if (!data.productId || isNaN(Number(data.productId))) return { success: false, error: 'Produto inválido' };
    if (data.quantity === undefined || isNaN(Number(data.quantity)) || Number(data.quantity) < 0) return { success: false, error: 'Quantidade inválida' };
    return { success: true, data: { ...data, productId: Number(data.productId), quantity: Number(data.quantity), minQuantity: Number(data.minQuantity) || 0 } };
  },

  'inventory:adjust': (data) => {
    if (!data || typeof data !== 'object') return { success: false, error: 'Dados inválidos' };
    if (!data.inventoryId || isNaN(Number(data.inventoryId))) return { success: false, error: 'ID do estoque inválido' };
    if (data.delta === undefined || isNaN(Number(data.delta))) return { success: false, error: 'Delta inválido' };
    return { success: true, data: { ...data, inventoryId: Number(data.inventoryId), delta: Number(data.delta) } };
  },

  'inventory:update-quantity': (data) => {
    if (!data || typeof data !== 'object') return { success: false, error: 'Dados inválidos' };
    if (!data.inventoryId || isNaN(Number(data.inventoryId))) return { success: false, error: 'ID do estoque inválido' };
    if (data.newQuantity === undefined || isNaN(Number(data.newQuantity)) || Number(data.newQuantity) < 0) return { success: false, error: 'Quantidade inválida' };
    return { success: true, data: { inventoryId: Number(data.inventoryId), newQuantity: Number(data.newQuantity) } };
  },

  'inventory:get-movements': (data) => {
    if (!data || typeof data !== 'object') return { success: false, error: 'Dados inválidos' };
    if (!data.inventoryId || isNaN(Number(data.inventoryId))) return { success: false, error: 'ID do estoque inválido' };
    return { success: true, data: { inventoryId: Number(data.inventoryId), limit: data.limit || 50 } };
  },

  'financial:add-account': (data) => {
    if (!data || typeof data !== 'object') return { success: false, error: 'Dados inválidos' };
    if (!data.type || !['payable', 'receivable'].includes(data.type)) return { success: false, error: 'Tipo de conta inválido' };
    if (!data.description || typeof data.description !== 'string' || data.description.trim() === '') return { success: false, error: 'Descrição é obrigatória' };
    if (data.amount === undefined || isNaN(Number(data.amount)) || Number(data.amount) <= 0) return { success: false, error: 'Valor inválido' };
    return { success: true, data: { ...data, amount: Number(data.amount) } };
  },

  'financial:update-account': (data) => {
    if (!data || typeof data !== 'object') return { success: false, error: 'Dados inválidos' };
    if (!data.id || isNaN(Number(data.id))) return { success: false, error: 'ID inválido' };
    if (!data.account || typeof data.account !== 'object') return { success: false, error: 'Conta inválida' };
    if (!data.account.type || !['payable', 'receivable'].includes(data.account.type)) return { success: false, error: 'Tipo de conta inválido' };
    if (!data.account.description || typeof data.account.description !== 'string' || data.account.description.trim() === '') return { success: false, error: 'Descrição é obrigatória' };
    if (data.account.amount === undefined || isNaN(Number(data.account.amount)) || Number(data.account.amount) <= 0) return { success: false, error: 'Valor inválido' };
    return { success: true, data: { ...data, id: Number(data.id), account: { ...data.account, amount: Number(data.account.amount) } } };
  },

  'financial:delete-account': (id) => {
    if (id === undefined || id === null || isNaN(Number(id))) return { success: false, error: 'ID inválido' };
    return { success: true, data: Number(id) };
  },

  'financial:add-transaction': (data) => {
    if (!data || typeof data !== 'object') return { success: false, error: 'Dados inválidos' };
    if (!data.account_id || isNaN(Number(data.account_id))) return { success: false, error: 'ID da conta inválido' };
    if (!data.type || typeof data.type !== 'string' || data.type.trim() === '') return { success: false, error: 'Tipo de transação inválido' };
    if (data.amount === undefined || isNaN(Number(data.amount)) || Number(data.amount) <= 0) return { success: false, error: 'Valor inválido' };
    return { success: true, data: { ...data, account_id: Number(data.account_id), amount: Number(data.amount) } };
  },

  'financial:get-accounts': (data) => {
    if (!data || typeof data !== 'object') return { success: true, data: {} };
    if (data.type && typeof data.type !== 'string') return { success: false, error: 'Tipo inválido' };
    if (data.status && typeof data.status !== 'string') return { success: false, error: 'Status inválido' };
    return { success: true, data };
  },

  'financial:get-summary': (data) => {
    if (!data || typeof data !== 'object') return { success: true, data: {} };
    return { success: true, data };
  },

  'config:update': (data) => {
    if (!data || typeof data !== 'object') return { success: false, error: 'Dados inválidos' };
    if (!data.key || typeof data.key !== 'string' || data.key.trim() === '') return { success: false, error: 'Chave inválida' };
    if (data.value === undefined || data.value === null) return { success: false, error: 'Valor inválido' };
    if (data.key === 'manager_password') return { success: false, error: 'Alteração de senha não permitida por este canal' };
    return { success: true, data };
  },

  'clients:add': (data) => {
    if (!data || typeof data !== 'object') return { success: false, error: 'Dados inválidos' };
    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') return { success: false, error: 'Nome é obrigatório' };
    return { success: true, data };
  },

  'clients:update': (data) => {
    if (!data || typeof data !== 'object') return { success: false, error: 'Dados inválidos' };
    if (!data.id || isNaN(Number(data.id))) return { success: false, error: 'ID inválido' };
    if (!data.client || typeof data.client !== 'object') return { success: false, error: 'Cliente inválido' };
    if (!data.client.name || typeof data.client.name !== 'string' || data.client.name.trim() === '') return { success: false, error: 'Nome é obrigatório' };
    return { success: true, data: { ...data, id: Number(data.id) } };
  },

  'clients:delete': (id) => {
    if (id === undefined || id === null || isNaN(Number(id))) return { success: false, error: 'ID inválido' };
    return { success: true, data: Number(id) };
  },

  'clients:get-orders': (clientId) => {
    if (clientId === undefined || clientId === null || isNaN(Number(clientId))) return { success: false, error: 'ID do cliente inválido' };
    return { success: true, data: Number(clientId) };
  },

  'clients:add-order': (data) => {
    if (!data || typeof data !== 'object') return { success: false, error: 'Dados inválidos' };
    if (!data.clientId || isNaN(Number(data.clientId))) return { success: false, error: 'ID do cliente inválido' };
    if (!data.orderId || isNaN(Number(data.orderId))) return { success: false, error: 'ID do pedido inválido' };
    if (data.totalAmount === undefined || isNaN(Number(data.totalAmount)) || Number(data.totalAmount) < 0) return { success: false, error: 'Valor inválido' };
    return { success: true, data: { clientId: Number(data.clientId), orderId: Number(data.orderId), totalAmount: Number(data.totalAmount) } };
  },

  'audit:get-logs': (limit) => {
    if (limit !== undefined && limit !== null && (isNaN(Number(limit)) || Number(limit) < 1)) return { success: false, error: 'Limite inválido' };
    return { success: true, data: limit ? Number(limit) : 100 };
  },

  'dialog:save-pdf': (data) => {
    if (!data || typeof data !== 'object') return { success: false, error: 'Dados inválidos' };
    if (!data.data || typeof data.data !== 'string' || data.data.length === 0) return { success: false, error: 'Dados PDF inválidos' };
    if (!data.defaultName || typeof data.defaultName !== 'string') return { success: false, error: 'Nome padrão inválido' };
    return { success: true, data };
  },

  'ifood:test-connection': (data) => {
    if (!data || typeof data !== 'object') return { success: false, error: 'Dados inválidos' };
    if (!data.clientId || typeof data.clientId !== 'string' || data.clientId.trim() === '') return { success: false, error: 'Client ID é obrigatório' };
    if (!data.clientSecret || typeof data.clientSecret !== 'string' || data.clientSecret.trim() === '') return { success: false, error: 'Client Secret é obrigatório' };
    if (!data.merchantId || typeof data.merchantId !== 'string' || data.merchantId.trim() === '') return { success: false, error: 'Merchant ID é obrigatório' };
    return { success: true, data };
  },

  'ifood:poll': () => ({ success: true, data: {} }),

  'ifood:start-preparation': (data) => {
    if (!data || !data.orderId || typeof data.orderId !== 'string') return { success: false, error: 'Order ID inválido' };
    return { success: true, data };
  },

  'ifood:ready-to-pickup': (data) => {
    if (!data || !data.orderId || typeof data.orderId !== 'string') return { success: false, error: 'Order ID inválido' };
    return { success: true, data };
  },

  'ifood:dispatch': (data) => {
    if (!data || !data.orderId || typeof data.orderId !== 'string') return { success: false, error: 'Order ID inválido' };
    return { success: true, data };
  },

  'ifood:start-polling': (data) => {
    if (!data || typeof data !== 'object') return { success: false, error: 'Dados inválidos' };
    if (!data.clientId || typeof data.clientId !== 'string') return { success: false, error: 'Client ID inválido' };
    if (!data.clientSecret || typeof data.clientSecret !== 'string') return { success: false, error: 'Client Secret inválido' };
    if (!data.merchantId || typeof data.merchantId !== 'string') return { success: false, error: 'Merchant ID inválido' };
    if (typeof data.enabled !== 'boolean') return { success: false, error: 'Enabled deve ser booleano' };
    return { success: true, data };
  },

  'logging:write': (data) => {
    if (!data || typeof data !== 'object') return { success: false, error: 'Dados inválidos' };
    const validLevels = ['error', 'warn', 'info', 'debug'];
    if (!data.level || !validLevels.includes(data.level)) return { success: false, error: 'Nível de log inválido' };
    if (!data.message || typeof data.message !== 'string' || data.message.trim() === '') return { success: false, error: 'Mensagem de log inválida' };
    if (data.meta !== undefined && data.meta !== null && typeof data.meta !== 'object') return { success: false, error: 'Metadados inválidos' };
    return { success: true, data: { level: data.level, message: data.message, meta: data.meta || {} } };
  },
};

/**
 * @param {string} channel - IPC channel name
 * @param {any} data - IPC payload data
 * @returns {ValidationResult} Validation result object
 */
function validateIPC(channel, data) {
  const validator = validators[channel];
  if (!validator) return { success: true, data };
  return validator(data);
}

module.exports = { validateIPC };
