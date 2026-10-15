/**
 * offlineQueue - Fila de pedidos pendentes para modo offline.
 *
 * Pedidos feitos sem conexão são persistidos em localStorage.
 * Quando a conexão volta, a fila é sincronizada automaticamente.
 */

export interface PendingOrder {
  id: string;
  orderData: {
    tableName: string;
    total: number;
    originalTotal: number;
    discount: number;
    promotionId: number | null;
    promotionName: string | null;
    payments: Array<{ method: string; amount: number; exchangeFor?: string }>;
    amountReceived: number;
    isDelivery: boolean;
    address: string;
    phone: string;
  };
  items: Array<{
    id: number;
    name: string;
    price: number;
    category: string;
    ingredients?: string;
    notes?: string;
  }>;
  createdAt: number;
  synced: boolean;
}

const STORAGE_KEY = 'acaiwave_offline_queue';

function loadQueue(): PendingOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: PendingOrder[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // localStorage full or unavailable
  }
}

/**
 * Adiciona um pedido à fila offline.
 */
export function enqueueOrder(order: Omit<PendingOrder, 'id' | 'createdAt' | 'synced'>): PendingOrder {
  const queue = loadQueue();
  const newOrder: PendingOrder = {
    ...order,
    id: `offline_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    synced: false,
  };
  queue.push(newOrder);
  saveQueue(queue);
  return newOrder;
}

/**
 * Retorna todos os pedidos pendentes (não sincronizados).
 */
export function getPendingOrders(): PendingOrder[] {
  return loadQueue().filter(o => !o.synced);
}

/**
 * Retorna o count de pedidos pendentes.
 */
export function getPendingCount(): number {
  return getPendingOrders().length;
}

/**
 * Marca um pedido como sincronizado.
 */
export function markAsSynced(id: string): void {
  const queue = loadQueue();
  const updated = queue.map(o => o.id === id ? { ...o, synced: true } : o);
  saveQueue(updated);
}

/**
 * Remove um pedido da fila (após sync bem-sucedido).
 */
export function removeFromQueue(id: string): void {
  const queue = loadQueue();
  const filtered = queue.filter(o => o.id !== id);
  saveQueue(filtered);
}

/**
 * Limpa toda a fila (usado após sync completo ou logout).
 */
export function clearQueue(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Sincroniza pedidos pendentes com o backend via IPC.
 * Retorna { synced: number, failed: number }.
 */
export async function syncPendingOrders(
  ipcInvoke: (channel: string, ...args: any[]) => Promise<any>
): Promise<{ synced: number; failed: number }> {
  const pending = getPendingOrders();
  let synced = 0;
  let failed = 0;

  for (const order of pending) {
    try {
      const res = await ipcInvoke('orders:save', {
        orderData: order.orderData,
        items: order.items,
      });
      if (res && res.success) {
        removeFromQueue(order.id);
        synced++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}
