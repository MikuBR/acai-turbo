import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import CheckoutScreen from '../features/pdv/CheckoutScreen.jsx';
import { useAuthStore } from '../store/authStore';
import { useStore } from '../store/useStore';
import { getPendingCount } from '../services/offlineQueue';

const mockInvoke = vi.fn();

beforeEach(() => {
  mockInvoke.mockReset();
  localStorage.clear();
  // Use Object.assign-style assignment to preserve jsdom's window
  window.electron = {
    ipcRenderer: {
      invoke: mockInvoke,
      on: vi.fn(),
      once: vi.fn(),
      removeListener: vi.fn(),
    },
  };
  useAuthStore.setState({
    currentUser: { id: 1, username: 'admin', full_name: 'Admin', role: 'admin', must_change_password: 0 },
    isAuthenticated: true,
    authTime: Date.now(),
  });
  useStore.setState({
    activeTableId: 1,
    tables: [{ id: 1, name: 'BALCÃO', isDelivery: false, address: '', phone: '', items: [{ name: 'Açaí 500ml', price: 15, quantity: 1 }], total: 15 }],
    catalog: [],
  });
  mockInvoke.mockResolvedValue({ success: true, data: [] });
});

describe('CheckoutScreen - Offline Mode', () => {
  it('enqueues order when offline instead of invoking orders:save', async () => {
    // Simula offline: define navigator.onLine ANTES do render (o hook lê no estado inicial)
    Object.defineProperty(globalThis, 'navigator', {
      value: { onLine: false },
      writable: true,
      configurable: true,
    });

    mockInvoke.mockImplementation((channel) => {
      if (channel === 'promotions:get') return Promise.resolve({ success: true, data: [] });
      return Promise.resolve({ success: true, data: [] });
    });

    render(
      <MemoryRouter initialEntries={['/checkout']}>
        <Routes>
          <Route path="/checkout" element={<CheckoutScreen />} />
          <Route path="/pdv" element={<div data-testid="pdv-page">PDV</div>} />
        </Routes>
      </MemoryRouter>
    );

    await vi.waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('promotions:get');
    });

    // Simula o fluxo de finalização: adiciona pagamento e confirma
    const addPaymentBtn = await screen.findByText(/Adicionar Pagamento/);
    fireEvent.click(addPaymentBtn);

    const dinheiroBtn = await screen.findByText('DINHEIRO');
    fireEvent.click(dinheiroBtn);

    const amountInput = await screen.findByPlaceholderText('0.00');
    fireEvent.change(amountInput, { target: { value: '15.00' } });

    const addBtn = await screen.findByText('Adicionar');
    fireEvent.click(addBtn);

    const confirmBtn = await screen.findByText('Confirmar & Imprimir');
    fireEvent.click(confirmBtn);

    // Verifica que o pedido foi enfileirado
    await vi.waitFor(() => {
      expect(getPendingCount()).toBe(1);
    });
  });

  it('does not enqueue order when online', async () => {
    // Simula online: define navigator.onLine ANTES do render (o hook lê no estado inicial)
    Object.defineProperty(globalThis, 'navigator', {
      value: { onLine: true },
      writable: true,
      configurable: true,
    });

    mockInvoke.mockImplementation((channel) => {
      if (channel === 'promotions:get') return Promise.resolve({ success: true, data: [] });
      if (channel === 'orders:save') return Promise.resolve({ success: true });
      return Promise.resolve({ success: true, data: [] });
    });

    render(
      <MemoryRouter initialEntries={['/checkout']}>
        <Routes>
          <Route path="/checkout" element={<CheckoutScreen />} />
          <Route path="/pdv" element={<div data-testid="pdv-page">PDV</div>} />
        </Routes>
      </MemoryRouter>
    );

    await vi.waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('promotions:get');
    });

    // Verifica que nenhum pedido foi enfileirado
    expect(getPendingCount()).toBe(0);
  });
});
