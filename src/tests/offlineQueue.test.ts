import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  enqueueOrder,
  getPendingOrders,
  getPendingCount,
  markAsSynced,
  removeFromQueue,
  clearQueue,
  syncPendingOrders,
} from '../services/offlineQueue';

const mockOrder = {
  orderData: {
    tableName: 'Mesa 1',
    total: 25,
    originalTotal: 30,
    discount: 5,
    promotionId: null,
    promotionName: null,
    payments: [{ method: 'DINHEIRO', amount: 25 }],
    amountReceived: 30,
    isDelivery: false,
    address: '',
    phone: '',
  },
  items: [{ id: 1, name: 'Açaí 500ml', price: 15, category: 'AÇAÍ' }],
};

describe('offlineQueue', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('enqueues an order and returns it with id and createdAt', () => {
    const order = enqueueOrder(mockOrder);
    expect(order.id).toMatch(/^offline_/);
    expect(order.createdAt).toBeGreaterThan(0);
    expect(order.synced).toBe(false);
  });

  it('returns pending orders', () => {
    enqueueOrder(mockOrder);
    enqueueOrder(mockOrder);
    const pending = getPendingOrders();
    expect(pending).toHaveLength(2);
  });

  it('returns correct pending count', () => {
    expect(getPendingCount()).toBe(0);
    enqueueOrder(mockOrder);
    expect(getPendingCount()).toBe(1);
    enqueueOrder(mockOrder);
    expect(getPendingCount()).toBe(2);
  });

  it('marks order as synced', () => {
    const order = enqueueOrder(mockOrder);
    markAsSynced(order.id);
    expect(getPendingCount()).toBe(0);
  });

  it('removes order from queue', () => {
    const order = enqueueOrder(mockOrder);
    removeFromQueue(order.id);
    expect(getPendingCount()).toBe(0);
  });

  it('clears entire queue', () => {
    enqueueOrder(mockOrder);
    enqueueOrder(mockOrder);
    clearQueue();
    expect(getPendingCount()).toBe(0);
  });

  it('persists queue across reloads (localStorage)', () => {
    enqueueOrder(mockOrder);
    // Simula reload: lê do localStorage diretamente
    const raw = localStorage.getItem('acaiwave_offline_queue');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].orderData.tableName).toBe('Mesa 1');
  });

  it('syncs pending orders via IPC and removes synced ones', async () => {
    const order1 = enqueueOrder(mockOrder);
    const order2 = enqueueOrder(mockOrder);

    const mockInvoke = vi.fn().mockResolvedValue({ success: true });
    const result = await syncPendingOrders(mockInvoke);

    expect(result.synced).toBe(2);
    expect(result.failed).toBe(0);
    expect(mockInvoke).toHaveBeenCalledTimes(2);
    expect(getPendingCount()).toBe(0);
  });

  it('handles sync failures gracefully', async () => {
    enqueueOrder(mockOrder);

    const mockInvoke = vi.fn().mockResolvedValue({ success: false, error: 'Network error' });
    const result = await syncPendingOrders(mockInvoke);

    expect(result.synced).toBe(0);
    expect(result.failed).toBe(1);
    expect(getPendingCount()).toBe(1);
  });

  it('handles sync exceptions gracefully', async () => {
    enqueueOrder(mockOrder);

    const mockInvoke = vi.fn().mockRejectedValue(new Error('IPC error'));
    const result = await syncPendingOrders(mockInvoke);

    expect(result.synced).toBe(0);
    expect(result.failed).toBe(1);
    expect(getPendingCount()).toBe(1);
  });

  it('does not sync already synced orders', async () => {
    const order = enqueueOrder(mockOrder);
    markAsSynced(order.id);

    const mockInvoke = vi.fn().mockResolvedValue({ success: true });
    const result = await syncPendingOrders(mockInvoke);

    expect(result.synced).toBe(0);
    expect(result.failed).toBe(0);
    expect(mockInvoke).not.toHaveBeenCalled();
  });
});
