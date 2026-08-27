import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import AppLayout from '../layouts/AppLayout.jsx';
import { useAuthStore } from '../store/authStore';
import { useStore } from '../store/useStore';

// Mock window.electron for getIPC
beforeEach(() => {
  globalThis.window = {
    electron: {
      ipcRenderer: {
        invoke: vi.fn().mockResolvedValue({ success: true, data: [] }),
        on: vi.fn(),
        once: vi.fn(),
        removeListener: vi.fn(),
      }
    }
  };
});

describe('AppLayout', () => {
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

  it('renders sidebar, outlet, and cart panel', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<div data-testid="child-content">Child Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Sidebar
    expect(screen.getByText('AÇAÍ WAVE')).toBeInTheDocument();

    // Outlet child
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('sidebar contains order sidebar, reports, settings, and logout buttons', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<div>Child</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTitle('Caixa e Relatórios')).toBeInTheDocument();
    expect(screen.getByTitle('Configurações')).toBeInTheDocument();
    expect(screen.getByTitle('Sair')).toBeInTheDocument();
  });

  it('renders cart panel with active table info', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<div>Child</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Cart header contains "RESUMO"
    expect(screen.getAllByText('RESUMO').length).toBeGreaterThanOrEqual(1);
  });
});
