import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '../store/authStore'

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({
      currentUser: null,
      authToken: null,
      authTime: 0,
    })
  })

  it('starts unauthenticated', () => {
    const state = useAuthStore.getState()
    expect(state.currentUser).toBeNull()
    expect(state.authToken).toBeNull()
    expect(state.authTime).toBe(0)
  })

  it('login sets user, token, authTime and persists token', () => {
    const user = { id: 1, username: 'admin', full_name: 'Admin', role: 'admin', must_change_password: 0 }
    useAuthStore.getState().login(user, 'abc123')

    const state = useAuthStore.getState()
    expect(state.currentUser).toEqual(user)
    expect(state.authToken).toBe('abc123')
    expect(state.authTime).toBeGreaterThan(0)
    expect(localStorage.getItem('authToken')).toBe('abc123')
  })

  it('logout clears state and removes persisted token', () => {
    const user = { id: 1, username: 'admin', full_name: 'Admin', role: 'admin', must_change_password: 0 }
    useAuthStore.getState().login(user, 'abc123')
    useAuthStore.getState().logout()

    const state = useAuthStore.getState()
    expect(state.currentUser).toBeNull()
    expect(state.authToken).toBeNull()
    expect(state.authTime).toBe(0)
    expect(localStorage.getItem('authToken')).toBeNull()
  })

  it('isAuthValid is false with authTime 0', () => {
    expect(useAuthStore.getState().isAuthValid()).toBe(false)
  })

  it('isAuthValid is true after login within window', () => {
    const user = { id: 1, username: 'admin', full_name: 'Admin', role: 'admin', must_change_password: 0 }
    useAuthStore.getState().login(user, 'tok')
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
})
