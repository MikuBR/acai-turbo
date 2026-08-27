import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import PdvScreen from '../features/pdv/PdvScreen.jsx';
import { useAuthStore } from '../store/authStore';
import { useStore } from '../store/useStore';

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

describe('PdvScreen', () => {
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
      catalog: [
        { id: 1, name: 'Açaí 500ml', price: 15, category: 'COPOS DE AÇAÍ' },
        { id: 2, name: 'Água', price: 5, category: 'BEBIDAS' },
      ],
    });
  });

  it('renders search input and Montagem button', () => {
    render(
      <MemoryRouter initialEntries={['/pdv']}>
        <Routes>
          <Route path="/pdv" element={<PdvScreen />} />
          <Route path="/pdv/builder/acai" element={<div data-testid="acai-builder">Builder</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText('Pesquisar...')).toBeInTheDocument();
    expect(screen.getByText('Montagem')).toBeInTheDocument();
  });

  it('renders ProductCard for each product in catalog', () => {
    render(
      <MemoryRouter initialEntries={['/pdv']}>
        <Routes>
          <Route path="/pdv" element={<PdvScreen />} />
          <Route path="/pdv/builder/acai" element={<div data-testid="acai-builder">Builder</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Açaí 500ml')).toBeInTheDocument();
    expect(screen.getByText('Água')).toBeInTheDocument();
  });

  it('navigates to /pdv/builder/acai when Montagem button is clicked', () => {
    render(
      <MemoryRouter initialEntries={['/pdv']}>
        <Routes>
          <Route path="/pdv" element={<PdvScreen />} />
          <Route path="/pdv/builder/acai" element={<div data-testid="acai-builder">Builder</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Montagem'));
    expect(screen.getByTestId('acai-builder')).toBeInTheDocument();
  });
});
