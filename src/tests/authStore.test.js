import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../store/authStore'

// Mock do window.electron para testes
const mockInvoke = vi.fn();

beforeEach(() => {
  mockInvoke.mockReset();
  // Use Object.assign to preserve jsdom's window (addEventListener, document,
  // localStorage, etc.) instead of replacing it wholesale — which breaks
  // Testing Library, event listeners, and the DOM.
  window.electron = {
    ipcRenderer: {
      invoke: mockInvoke,
      on: vi.fn(),
      once: vi.fn(),
      removeListener: vi.fn(),
    },
  };
  useAuthStore.setState({
    currentUser: null,
    isAuthenticated: false,
    authTime: 0,
  })
})

describe('useAuthStore', () => {
  it('starts unauthenticated', () => {
    const state = useAuthStore.getState()
    expect(state.currentUser).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(state.authTime).toBe(0)
  })

  it('login sets user, isAuthenticated, authTime and does NOT use localStorage', () => {
    const user = { id: 1, username: 'admin', full_name: 'Admin', role: 'admin', must_change_password: 0 }
    useAuthStore.getState().login(user)

    const state = useAuthStore.getState()
    expect(state.currentUser).toEqual(user)
    expect(state.isAuthenticated).toBe(true)
    expect(state.authTime).toBeGreaterThan(0)
    // Token NÃO deve estar em localStorage
    expect(localStorage.getItem('authToken')).toBeNull()
  })

  it('logout clears state and calls IPC', async () => {
    const user = { id: 1, username: 'admin', full_name: 'Admin', role: 'admin', must_change_password: 0 }
    mockInvoke.mockResolvedValue({ success: true }); // logout is fire-and-forget, mock the return
    useAuthStore.getState().login(user)
    await useAuthStore.getState().logout()

    const state = useAuthStore.getState()
    expect(state.currentUser).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(state.authTime).toBe(0)
    expect(mockInvoke).toHaveBeenCalledWith('auth:logout', { userId: 1 })
  })

  it('isAuthValid is false with authTime 0', () => {
    expect(useAuthStore.getState().isAuthValid()).toBe(false)
  })

  it('isAuthValid is true after login within window', () => {
    const user = { id: 1, username: 'admin', full_name: 'Admin', role: 'admin', must_change_password: 0 }
    useAuthStore.getState().login(user)
    expect(useAuthStore.getState().isAuthValid()).toBe(true)
  })

  it('isAuthValid is false after setAuthTime far in the past', () => {
    const old = Date.now() - 6 * 60 * 1000
    useAuthStore.getState().setAuthTime(old)
    expect(useAuthStore.getState().isAuthValid()).toBe(false)
  })

  it('setAuthTime updates authTime directly', () => {
    const ts = Date.now()
    useAuthStore.getState().setAuthTime(ts)
    expect(useAuthStore.getState().authTime).toBe(ts)
  })

  it('checkAuth returns true when authenticated', async () => {
    mockInvoke.mockResolvedValue({
      success: true,
      authenticated: true,
      user: { id: 1, username: 'admin', full_name: 'Admin', role: 'admin', must_change_password: 0 }
    });

    const result = await useAuthStore.getState().checkAuth()
    expect(result).toBe(true)
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().currentUser).toBeTruthy()
  })

  it('checkAuth returns false when not authenticated', async () => {
    mockInvoke.mockResolvedValue({ success: false, authenticated: false });

    const result = await useAuthStore.getState().checkAuth()
    expect(result).toBe(false)
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('refreshToken returns true on success', async () => {
    mockInvoke.mockResolvedValue({
      success: true,
      user: { id: 1, username: 'admin', full_name: 'Admin', role: 'admin', must_change_password: 0 }
    });

    const result = await useAuthStore.getState().refreshToken()
    expect(result).toBe(true)
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })

  it('refreshToken returns false on failure', async () => {
    mockInvoke.mockResolvedValue({ success: false, error: 'Token inválido' });

    const result = await useAuthStore.getState().refreshToken()
    expect(result).toBe(false)
  })
})
