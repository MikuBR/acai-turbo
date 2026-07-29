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
    return { success: true, data };
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

  'cash:register': (data) => {
    if (!data || typeof data !== 'object') return { success: false, error: 'Dados inválidos' };
    if (!data.type || !['ENTRADA', 'SAIDA'].includes(data.type)) return { success: false, error: 'Tipo de movimento inválido' };
    if (data.amount === undefined || isNaN(Number(data.amount)) || Number(data.amount) <= 0) return { success: false, error: 'Valor inválido' };
    if (!data.description || typeof data.description !== 'string' || data.description.trim() === '') return { success: false, error: 'Descrição é obrigatória' };
    return { success: true, data: { ...data, amount: Number(data.amount) } };
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
};

function validateIPC(channel, data) {
  const validator = validators[channel];
  if (!validator) return { success: true, data };
  return validator(data);
}

module.exports = { validateIPC };
