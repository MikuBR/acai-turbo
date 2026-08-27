import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import SettingsScreen from '../features/settings/SettingsScreen.jsx';
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

describe('SettingsScreen', () => {
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

  it('renders SettingsModal with settings content', () => {
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <Routes>
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="/pdv" element={<div data-testid="pdv-page">PDV</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Produtos')).toBeInTheDocument();
    expect(screen.getByText('Promoções')).toBeInTheDocument();
    expect(screen.getByText('Estoque')).toBeInTheDocument();
  });

  it('navigates to /pdv when onClose is triggered', () => {
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <Routes>
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="/pdv" element={<div data-testid="pdv-page">PDV</div>} />
        </Routes>
      </MemoryRouter>
    );

    const closeBtn = document.querySelector('button.hover\\:bg-danger\\/20');
    expect(closeBtn).toBeTruthy();
    fireEvent.click(closeBtn);

    expect(screen.getByTestId('pdv-page')).toBeInTheDocument();
  });
});
