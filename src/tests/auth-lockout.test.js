import { describe, it, expect } from 'vitest'

describe('auth lockout helpers — regression (clearUserLoginLockout exists)', () => {
  it('clearUserLoginLockout is exported from database/db.cjs', async () => {
    const db = await import('../../database/db.cjs')
    expect(typeof db.clearUserLoginLockout).toBe('function')
    expect(typeof db.setUserFailedAttempts).toBe('function')
    expect(typeof db.setUserLockedUntil).toBe('function')
  })
})
