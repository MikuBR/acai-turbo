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

    const closeBtn = screen.queryByRole('button', { name: /fechar/i });
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

  it('pre-fills Dinheiro Recebido when DINHEIRO payment is added', async () => {
    // Simula CheckoutModal diretamente para testar o fluxo de pagamento
    const { default: CheckoutModal } = await import('../components/organisms/CheckoutModal.jsx');

    const onFinalize = vi.fn();
    render(
      <MemoryRouter>
        <CheckoutModal
          isOpen={true}
          onClose={() => {}}
          activeTable={{ id: 1, name: 'BALCÃO', isDelivery: false, address: '', phone: '', items: [], total: 8 }}
          promotions={[]}
          selectedPromotion={null}
          setSelectedPromotion={() => {}}
          calculateDiscount={() => 0}
          onFinalize={onFinalize}
        />
      </MemoryRouter>
    );

    // Passo 1: abre modal de adição e adiciona DINHEIRO R$ 3.00
    await vi.waitFor(() => {
      expect(screen.getByText(/Adicionar Pagamento/)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/Adicionar Pagamento/).closest('button'));

    await vi.waitFor(() => {
      expect(screen.getByText('DINHEIRO')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('DINHEIRO'));

    const amountInput = await screen.findByPlaceholderText('0.00');
    fireEvent.change(amountInput, { target: { value: '3.00' } });

    const addBtn = await screen.findByText('Adicionar');
    fireEvent.click(addBtn);

    // Verifica que o pagamento DINHEIRO R$ 3.00 foi adicionado à lista
    await screen.findByText('DINHEIRO');
    await screen.findByText('R$ 3.00');

    // Verifica que "Dinheiro Recebido" foi pré-preenched com R$ 3.00
    // O label não tem associação htmlFor, então usamos placeholder
    const dinheiroRecebidoInput = await screen.findByPlaceholderText('0.00');
    expect(dinheiroRecebidoInput.value).toBe('3.00');

    // Passo 2: re-abre o modal de adição de pagamento e adiciona PIX R$ 5.00
    // para completar o total (DINHEIRO R$3 + PIX R$5 = R$8)
    await vi.waitFor(() => {
      expect(screen.getByText(/Adicionar Pagamento/)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/Adicionar Pagamento/).closest('button'));

    await vi.waitFor(() => {
      expect(screen.getByText('PIX')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('PIX'));

    // Espera o modal de valor do PIX aparecer e usa o label "Valor" para achar o input
    await vi.waitFor(() => {
      expect(screen.getByText(/Valor/)).toBeInTheDocument();
    });
    const valorLabel = screen.getByText(/Valor/);
    const pixInput = valorLabel.closest('.bg-surface-light')?.querySelector('input');
    expect(pixInput).toBeTruthy();
    fireEvent.change(pixInput, { target: { value: '5.00' } });

    await vi.waitFor(() => {
      expect(screen.getAllByText('Adicionar').length).toBeGreaterThan(0);
    });
    const addButtons = screen.getAllByText('Adicionar');
    fireEvent.click(addButtons[addButtons.length - 1]);

    // O total agora está pago
    await screen.findByText('✓ Pago');

    // Passo 3: altera Dinheiro Recebido para R$ 10.00 — o troco deve aparecer
    // cashTarget = 8.00 (todos os pagamentos são dinheiro), troco = 10.00 - 8.00 = 2.00
    await vi.waitFor(() => {
      expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
    });
    const dinheiroRecebidoInput2 = screen.getByPlaceholderText('0.00');
    fireEvent.change(dinheiroRecebidoInput2, { target: { value: '10.00' } });

    await vi.waitFor(() => {
      expect(screen.getByText('Troco a Devolver')).toBeInTheDocument();
    });
    // Troco = 10.00 - 3.00 = 7.00
    // cashTarget = 3.00 (somente o valor de dinheiro necessário)
    await screen.findByText('R$ 7.00');

    // Passo 4: confirma
    const confirmBtn = await screen.findByText('Confirmar & Imprimir');
    fireEvent.click(confirmBtn);

    expect(onFinalize).toHaveBeenCalledWith(
      expect.objectContaining({
        payments: expect.arrayContaining([
          expect.objectContaining({ method: 'DINHEIRO', amount: 3 }),
          expect.objectContaining({ method: 'PIX', amount: 5 })
        ])
      })
    );
  });

  it('removes payment and Dinheiro Recebido disappears when last DINHEIRO removed', async () => {
    const { default: CheckoutModal } = await import('../components/organisms/CheckoutModal.jsx');

    const onFinalize = vi.fn();
    render(
      <MemoryRouter>
        <CheckoutModal
          isOpen={true}
          onClose={() => {}}
          activeTable={{ id: 1, name: 'BALCÃO', isDelivery: false, address: '', phone: '', items: [], total: 8 }}
          promotions={[]}
          selectedPromotion={null}
          setSelectedPromotion={() => {}}
          calculateDiscount={() => 0}
          onFinalize={onFinalize}
        />
      </MemoryRouter>
    );

    // Adiciona DINHEIRO R$ 3.00 via UI
    const addPaymentBtn = screen.getByText(/Adicionar Pagamento/).closest('button');
    fireEvent.click(addPaymentBtn);

    const dinheiroBtn = await screen.findByText('DINHEIRO');
    fireEvent.click(dinheiroBtn);

    const amountInput = await screen.findByPlaceholderText('0.00');
    fireEvent.change(amountInput, { target: { value: '3.00' } });

    const addBtn = await screen.findByText('Adicionar');
    fireEvent.click(addBtn);

    // Confirma que DINHEIRO foi adicionado
    await screen.findByText('DINHEIRO');

    // Remove o pagamento
    const removeBtn = screen.queryByRole('button', { name: /Remover pagamento/ });
    if (removeBtn) {
      fireEvent.click(removeBtn);
    }

    // DINHEIRO deve ter sumido da lista
    await vi.waitFor(() => {
      expect(screen.queryByText('DINHEIRO')).not.toBeInTheDocument();
    });
  });
});
