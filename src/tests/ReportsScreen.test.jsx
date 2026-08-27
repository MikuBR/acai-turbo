import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import ReportsScreen from '../features/reports/ReportsScreen.jsx';
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
});
