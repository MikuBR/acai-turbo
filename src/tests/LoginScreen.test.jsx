import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import LoginScreen from '../features/auth/LoginScreen.jsx';
import { useAuthStore } from '../store/authStore';

const mockInvoke = vi.fn();

beforeEach(() => {
  mockInvoke.mockReset();
  // Preserva o jsdom: em vez de sobrescrever `window` todo (que destrói
  // localStorage, document, addEventListener), injeta apenas o mock do electron.
  Object.assign(window, {
    electron: {
      ipcRenderer: {
        invoke: mockInvoke,
        on: vi.fn(),
        once: vi.fn(),
        removeListener: vi.fn(),
      },
    },
  });
  localStorage.clear();
  useAuthStore.setState({
    currentUser: null,
    isAuthenticated: false,
    authTime: 0,
  });
});

describe('LoginScreen', () => {
  it('renders login form with username and password fields', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/pdv" element={<div data-testid="pdv-page">PDV</div>} />
        </Routes>
      </MemoryRouter>
    );

    const inputs = document.querySelectorAll('input');
    expect(inputs.length).toBeGreaterThanOrEqual(2);
  });

  it('logs in successfully and populates auth store', async () => {
    mockInvoke.mockResolvedValue({
      success: true,
      user: { id: 1, username: 'admin', full_name: 'Admin', role: 'admin', must_change_password: 0 },
      // Token NÃO é mais retornado — fica em cookie httpOnly
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/pdv" element={<div data-testid="pdv-page">PDV</div>} />
        </Routes>
      </MemoryRouter>
    );

    const inputs = document.querySelectorAll('input');
    const usernameInput = Array.from(inputs).find(i => i.type === 'text');
    const passwordInput = Array.from(inputs).find(i => i.type === 'password');

    if (usernameInput && passwordInput) {
      fireEvent.change(usernameInput, { target: { value: 'admin' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const form = document.querySelector('form');
      if (form) fireEvent.submit(form);

      await vi.waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('auth:login', { username: 'admin', password: 'password123' });
      });

      await vi.waitFor(() => {
        expect(useAuthStore.getState().currentUser).toBeTruthy();
        expect(useAuthStore.getState().isAuthenticated).toBe(true);
      });
    }
  });

    it('navigates to /pdv when must_change_password is true (no forced change-password screen)', async () => {
    mockInvoke.mockResolvedValue({
      success: true,
      user: { id: 1, username: 'admin', full_name: 'Admin', role: 'admin', must_change_password: 1, must_change_manager_password: 0 },
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/pdv" element={<div data-testid="pdv-page">PDV</div>} />
        </Routes>
      </MemoryRouter>
    );

    const inputs = document.querySelectorAll('input');
    const usernameInput = Array.from(inputs).find(i => i.type === 'text');
    const passwordInput = Array.from(inputs).find(i => i.type === 'password');

    if (usernameInput && passwordInput) {
      fireEvent.change(usernameInput, { target: { value: 'admin' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const form = document.querySelector('form');
      if (form) fireEvent.submit(form);

      await vi.waitFor(() => {
        expect(screen.getByTestId('pdv-page')).toBeInTheDocument();
      });
    }
  });
});
