import { describe, test, expect, vi } from 'vitest'
import { withRetry, retryable } from '../retry'

describe('retry', () => {
  test('withRetry succeeds without retries', async () => {
    const fn = vi.fn(async () => 'ok')
    const res = await withRetry(fn, { maxAttempts: 3, delayMs: 1, backoffMultiplier: 1 })
    expect(res).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  test('withRetry retries on error and eventually throws', async () => {
    let calls = 0
    const fn = vi.fn(async () => {
      calls++
      throw new Error('network error')
    })
    await expect(withRetry(fn, { maxAttempts: 2, delayMs: 1, backoffMultiplier: 1 })).rejects.toThrow('network error')
    expect(calls).toBe(2)
  })

  test('retryable decorator wraps method with retry', async () => {
    class C {
      count = 0
      async unstable() {
        this.count++
        if (this.count < 2) throw new Error('timeout')
        return 'done'
      }
    }

    // apply decorator manually to avoid TS decorator syntax
    const proto = C.prototype as any
    const desc = Object.getOwnPropertyDescriptor(proto, 'unstable')!
    const newDesc = retryable({ maxAttempts: 2, delayMs: 1, backoffMultiplier: 1 })(proto, 'unstable', desc)
    if (newDesc) Object.defineProperty(proto, 'unstable', newDesc)

    const c = new C()
    const res = await c.unstable()
    expect(res).toBe('done')
    expect(c.count).toBe(2)
  })
})
