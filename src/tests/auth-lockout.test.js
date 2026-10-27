import { describe, it, expect } from 'vitest'

describe('auth lockout helpers — regression (clearUserLoginLockout exists)', () => {
  it('clearUserLoginLockout is exported and callable from database/db.cjs', async () => {
    const db = await import('../../database/db.cjs')
    expect(typeof db.clearUserLoginLockout).toBe('function')
    expect(typeof db.setUserFailedAttempts).toBe('function')
    expect(typeof db.setUserLockedUntil).toBe('function')
    // Must not throw '... is not a function'
    expect(() => db.clearUserLoginLockout(1)).not.toThrow()
  })
})
