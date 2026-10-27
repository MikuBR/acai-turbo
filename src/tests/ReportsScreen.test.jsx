import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import ReportsScreen from '../features/reports/ReportsScreen.jsx';
import { useAuthStore } from '../store/authStore';
import { useStore } from '../store/useStore';

beforeEach(() => {
  // Preserva o jsdom: em vez de sobrescrever `window` todo (que destrói
  // localStorage, document, addEventListener), injeta apenas o mock do electron.
  Object.assign(window, {
    electron: {
      ipcRenderer: {
        invoke: vi.fn().mockResolvedValue({ success: true, data: [] }),
        on: vi.fn(),
        once: vi.fn(),
        removeListener: vi.fn(),
      },
    },
  });
});

describe('ReportsScreen', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      currentUser: { id: 1, username: 'admin', full_name: 'Admin', role: 'admin', must_change_password: 0 },
      authToken: 'fake-token',
      authTime: Date.now(),
    });
    useStore.setState({
      activeTableId: 1,
      tables: [{ id: 1, name: 'BALCÃO', isDelivery: false, address: '', phone: '', items: [], total: 0 }],
      catalog: [],
    });
  });

  it('renders ReportsModal with report content', () => {
    render(
      <MemoryRouter initialEntries={['/reports']}>
        <Routes>
          <Route path="/reports" element={<ReportsScreen />} />
          <Route path="/pdv" element={<div data-testid="pdv-page">PDV</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getAllByText(/relat/i).length).toBeGreaterThan(0);
  });

  it('switches to promotions tab and shows promotions table with columns', () => {
    render(
      <MemoryRouter initialEntries={['/reports']}>
        <Routes>
          <Route path="/reports" element={<ReportsScreen />} />
          <Route path="/pdv" element={<div data-testid="pdv-page">PDV</div>} />
        </Routes>
      </MemoryRouter>
    );

    const promoTab = screen.getByRole('button', { name: /promotions/i });
    fireEvent.click(promoTab);

    expect(screen.getByText('Nome')).toBeInTheDocument();
    expect(screen.getByText('Tipo')).toBeInTheDocument();
    expect(screen.getByText('Valor')).toBeInTheDocument();
    expect(screen.getByText('Vigência')).toBeInTheDocument();
  });

  it('dry run: renderiza, troca para aba delivery, verifica KPIs e tabela', async () => {
    render(
      <MemoryRouter initialEntries={['/reports']}>
        <Routes>
          <Route path="/reports" element={<ReportsScreen />} />
          <Route path="/pdv" element={<div data-testid="pdv-page">PDV</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('delivery'));
    expect(screen.getByText('Pedidos Delivery')).toBeInTheDocument();
    expect(screen.getByText('Total Delivery')).toBeInTheDocument();
    expect(screen.getByText(/Nenhum pedido delivery/i)).toBeInTheDocument();
  });

  it('shows Sales tab KPIs and top products table', async () => {
    window.electron.ipcRenderer.invoke.mockImplementation((channel) => {
      if (channel === 'reports:daily') return Promise.resolve({ success: true, data: { sales: [{ payment_method: 'Dinheiro', order_count: 2, total_amount: 50 }], topProducts: [{ product_name: 'Açaí', qty: 3, total_revenue: 30, avg_price: 10 }] } });
      if (channel === 'orders:get-history') return Promise.resolve({ success: true, data: [] });
      if (channel === 'financial:get-summary') return Promise.resolve({ success: true, data: { payable: { pending: 0, paid: 0, total: 0 }, receivable: { pending: 0, paid: 0, total: 0 } } });
      return Promise.resolve({ success: true, data: [] });
    });

    render(
      <MemoryRouter initialEntries={['/reports']}>
        <Routes>
          <Route path="/reports" element={<ReportsScreen />} />
          <Route path="/pdv" element={<div data-testid="pdv-page">PDV</div>} />
        </Routes>
      </MemoryRouter>
    );

    const salesTab = screen.getByRole('button', { name: /sales/i });
    fireEvent.click(salesTab);

    expect(await screen.findByText(/Total Vendas/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Pedidos/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Ticket Médio/i)).toBeInTheDocument();
    expect(screen.getByText(/Itens Mais Vendidos/i)).toBeInTheDocument();
    expect(screen.getByText('Açaí')).toBeInTheDocument();
  });

  it('switches to financial tab and shows KPIs', async () => {
    render(
      <MemoryRouter initialEntries={['/reports']}>
        <Routes>
          <Route path="/reports" element={<ReportsScreen />} />
          <Route path="/pdv" element={<div data-testid="pdv-page">PDV</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('financial'));
    expect(await screen.findByText(/A Pagar \(Total\)/i)).toBeInTheDocument();
    expect(screen.getByText(/A Pagar \(Pendente\)/i)).toBeInTheDocument();
    expect(screen.getByText(/A Receber \(Total\)/i)).toBeInTheDocument();
    expect(screen.getByText(/A Receber \(Pendente\)/i)).toBeInTheDocument();
  });

  it('dry run: renderiza, troca para aba catalog, verifica total de produtos e tabela', () => {
    render(
      <MemoryRouter initialEntries={['/reports']}>
        <Routes>
          <Route path="/reports" element={<ReportsScreen />} />
          <Route path="/pdv" element={<div data-testid="pdv-page">PDV</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('catalog'));
    expect(screen.getByText(/Total de produtos:/i)).toBeInTheDocument();
    expect(screen.getByText(/Total de produtos: 0/i)).toBeInTheDocument();
    expect(screen.getByText('Nenhum produto cadastrado.')).toBeInTheDocument();
  });

  it('navigates to /pdv when onClose is triggered', () => {
    render(
      <MemoryRouter initialEntries={['/reports']}>
        <Routes>
          <Route path="/reports" element={<ReportsScreen />} />
          <Route path="/pdv" element={<div data-testid="pdv-page">PDV</div>} />
        </Routes>
      </MemoryRouter>
    );

    const closeBtn = document.querySelector('button.hover\\:bg-danger\\/20');
    expect(closeBtn).toBeTruthy();
    fireEvent.click(closeBtn);

    expect(screen.getByTestId('pdv-page')).toBeInTheDocument();
  });

  it('populates products state via catalog:get-products (catalog tab shows product)', async () => {
    window.electron.ipcRenderer.invoke.mockImplementation((channel) => {
      if (channel === 'catalog:get-products') return Promise.resolve({ success: true, data: [{ id: 1, name: 'Açaí 300ml', price: 12 }] });
      if (channel === 'reports:daily') return Promise.resolve({ success: true, data: { sales: [], topProducts: [] } });
      if (channel === 'orders:get-history') return Promise.resolve({ success: true, data: [] });
      if (channel === 'promotions:get') return Promise.resolve({ success: true, data: [] });
      if (channel === 'financial:get-summary') return Promise.resolve({ success: true, data: { payable: { pending: 0, paid: 0, total: 0 }, receivable: { pending: 0, paid: 0, total: 0 } } });
      return Promise.resolve({ success: true, data: [] });
    });
    render(
      <MemoryRouter initialEntries={['/reports']}>
        <Routes>
          <Route path="/reports" element={<ReportsScreen />} />
          <Route path="/pdv" element={<div data-testid="pdv-page">PDV</div>} />
        </Routes>
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('catalog'));
    expect(await screen.findByText('Açaí 300ml')).toBeInTheDocument();
  });

  it('populates promotions state via promotions:get (promotions tab shows promotion)', async () => {
    window.electron.ipcRenderer.invoke.mockImplementation((channel) => {
      if (channel === 'promotions:get') return Promise.resolve({ success: true, data: [{ id: 1, name: 'Promo Verão', type: 'percent', value: 10 }] });
      if (channel === 'reports:daily') return Promise.resolve({ success: true, data: { sales: [], topProducts: [], promotions: [] } });
      if (channel === 'orders:get-history') return Promise.resolve({ success: true, data: [] });
      if (channel === 'catalog:get-products') return Promise.resolve({ success: true, data: [] });
      if (channel === 'financial:get-summary') return Promise.resolve({ success: true, data: { payable: { pending: 0, paid: 0, total: 0 }, receivable: { pending: 0, paid: 0, total: 0 } } });
      return Promise.resolve({ success: true, data: [] });
    });
    render(
      <MemoryRouter initialEntries={['/reports']}>
        <Routes>
          <Route path="/reports" element={<ReportsScreen />} />
          <Route path="/pdv" element={<div data-testid="pdv-page">PDV</div>} />
        </Routes>
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /promotions/i }));
    expect(await screen.findByText('Promo Verão')).toBeInTheDocument();
  });

  it('financialSummary has {payable, receivable} with non-zero values when accounts exist', async () => {
    window.electron.ipcRenderer.invoke.mockImplementation((channel) => {
      if (channel === 'financial:get-summary') return Promise.resolve({ success: true, data: { payable: { pending: 5, paid: 2, total: 7 }, receivable: { pending: 3, paid: 1, total: 4 } } });
      if (channel === 'reports:daily') return Promise.resolve({ success: true, data: { sales: [], topProducts: [] } });
      if (channel === 'orders:get-history') return Promise.resolve({ success: true, data: [] });
      if (channel === 'catalog:get-products') return Promise.resolve({ success: true, data: [] });
      if (channel === 'promotions:get') return Promise.resolve({ success: true, data: [] });
      return Promise.resolve({ success: true, data: [] });
    });
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(
      <MemoryRouter initialEntries={['/reports']}>
        <Routes>
          <Route path="/reports" element={<ReportsScreen />} />
          <Route path="/pdv" element={<div data-testid="pdv-page">PDV</div>} />
        </Routes>
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('financial'));
    expect(await screen.findByText(/7/)).toBeInTheDocument();
    printSpy.mockRestore();
  });

  it('onExportPDF is not a no-op (calls window.print)', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(
      <MemoryRouter initialEntries={['/reports']}>
        <Routes>
          <Route path="/reports" element={<ReportsScreen />} />
          <Route path="/pdv" element={<div data-testid="pdv-page">PDV</div>} />
        </Routes>
      </MemoryRouter>
    );
    const btn = screen.getByRole('button', { name: /Exportar PDF/i });
    fireEvent.click(btn);
    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });
});
