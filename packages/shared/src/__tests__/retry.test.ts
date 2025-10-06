import { describe, it, expect, vi } from 'vitest';
import { withRetry, defaultRetryOptions } from '../retry.js';

describe('Retry Module', () => {
  describe('withRetry', () => {
    it('should return result on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await withRetry(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValueOnce('success');

      const result = await withRetry(fn, { maxAttempts: 3, delayMs: 1 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should fail after max attempts', async () => {
      const error = new Error('network error'); // Use error that matches default retry condition
      const fn = vi.fn().mockRejectedValue(error);

      await expect(withRetry(fn, { maxAttempts: 2, delayMs: 1 })).rejects.toThrow('network error');

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should use custom retry condition', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('custom error'))
        .mockResolvedValueOnce('success');

      const retryCondition = vi.fn((error: Error) => error.message === 'custom error');

      const result = await withRetry(fn, {
        maxAttempts: 3,
        delayMs: 1,
        retryCondition,
      });

      expect(result).toBe('success');
      expect(retryCondition).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should not retry when condition returns false', async () => {
      const error = new Error('non-retryable error');
      const fn = vi.fn().mockRejectedValue(error);

      const retryCondition = vi.fn(() => false);

      await expect(
        withRetry(fn, {
          maxAttempts: 3,
          delayMs: 1,
          retryCondition,
        })
      ).rejects.toThrow('non-retryable error');

      expect(fn).toHaveBeenCalledTimes(1);
      expect(retryCondition).toHaveBeenCalledTimes(1);
    });
  });

  describe('defaultRetryOptions', () => {
    it('should have sensible defaults', () => {
      expect(defaultRetryOptions.maxAttempts).toBe(3);
      expect(defaultRetryOptions.delayMs).toBe(1000);
      expect(defaultRetryOptions.backoffMultiplier).toBe(2);
      expect(defaultRetryOptions.maxDelayMs).toBe(30000);
      expect(typeof defaultRetryOptions.retryCondition).toBe('function');
    });

    it('should retry on network errors', () => {
      const condition = defaultRetryOptions.retryCondition!;

      expect(condition(new Error('network error'))).toBe(true);
      expect(condition(new Error('timeout occurred'))).toBe(true);
      expect(condition(new Error('ECONNRESET'))).toBe(true);
      expect(condition(new Error('ENOTFOUND'))).toBe(true);
      expect(condition(new Error('some other error'))).toBe(false);
    });
  });
});
