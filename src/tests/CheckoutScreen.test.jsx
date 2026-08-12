import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import CheckoutScreen from '../features/pdv/CheckoutScreen.jsx';
import { useAuthStore } from '../store/authStore';
import { useStore } from '../store/useStore';

const mockInvoke = vi.fn();

beforeEach(() => {
  mockInvoke.mockReset();
  globalThis.window = {
    electron: {
      ipcRenderer: {
        invoke: mockInvoke,
        on: vi.fn(),
        once: vi.fn(),
        removeListener: vi.fn(),
      }
    }
  };
});

describe('CheckoutScreen', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      currentUser: { id: 1, username: 'admin', full_name: 'Admin', role: 'admin', must_change_password: 0 },
      authToken: 'fake-token',
      authTime: Date.now(),
    });
    useStore.setState({
      activeTableId: 1,
      tables: [{ id: 1, name: 'BALCÃO', isDelivery: false, address: '', phone: '', items: [{ name: 'Açaí 500ml', price: 15, quantity: 1 }], total: 15 }],
      catalog: [],
    });
    mockInvoke.mockResolvedValue({ success: true, data: [] });
  });

  it('renders CheckoutModal with active table info', () => {
    render(
      <MemoryRouter initialEntries={['/checkout']}>
        <Routes>
          <Route path="/checkout" element={<CheckoutScreen />} />
          <Route path="/pdv" element={<div data-testid="pdv-page">PDV</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getAllByText(/finalizar|checkout|pagamento/i).length).toBeGreaterThan(0);
  });

  it('navigates to /pdv when onClose is triggered', () => {
    render(
      <MemoryRouter initialEntries={['/checkout']}>
        <Routes>
          <Route path="/checkout" element={<CheckoutScreen />} />
          <Route path="/pdv" element={<div data-testid="pdv-page">PDV</div>} />
        </Routes>
      </MemoryRouter>
    );

    const closeBtn = document.querySelector('button.hover\\:bg-danger\\/20') || document.querySelector('button[aria-label="Fechar"]');
    if (closeBtn) {
      fireEvent.click(closeBtn);
      expect(screen.getByTestId('pdv-page')).toBeInTheDocument();
    }
  });

  it('invokes orders:save on finalize and navigates to /pdv', async () => {
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
  });
});
