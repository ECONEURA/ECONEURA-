import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RateLimiter, createRateLimitMiddleware } from '../rate-limiter.js';

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter(3, 1000); // 3 requests per second for testing
  });

  describe('constructor', () => {
    it('should create with default values', () => {
      const defaultLimiter = new RateLimiter();
      expect(defaultLimiter['maxRequests']).toBe(100);
      expect(defaultLimiter['windowMs']).toBe(60000);
    });

    it('should create with custom values', () => {
      expect(limiter['maxRequests']).toBe(3);
      expect(limiter['windowMs']).toBe(1000);
    });
  });

  describe('isAllowed', () => {
    it('should allow first request', () => {
      expect(limiter.isAllowed('user1')).toBe(true);
    });

    it('should allow requests within limit', () => {
      limiter.isAllowed('user1');
      limiter.isAllowed('user1');
      expect(limiter.isAllowed('user1')).toBe(true);
    });

    it('should block requests over limit', () => {
      limiter.isAllowed('user1');
      limiter.isAllowed('user1');
      limiter.isAllowed('user1');
      expect(limiter.isAllowed('user1')).toBe(false);
    });

    it('should reset after window expires', () => {
      limiter.isAllowed('user1');
      limiter.isAllowed('user1');
      limiter.isAllowed('user1');

      // Wait for window to expire
      vi.useFakeTimers();
      vi.advanceTimersByTime(1001);

      expect(limiter.isAllowed('user1')).toBe(true);
      vi.useRealTimers();
    });

    it('should handle different keys independently', () => {
      limiter.isAllowed('user1');
      limiter.isAllowed('user1');
      limiter.isAllowed('user1');
      expect(limiter.isAllowed('user1')).toBe(false);

      // user2 should still be allowed
      expect(limiter.isAllowed('user2')).toBe(true);
    });
  });

  describe('getRemainingRequests', () => {
    it('should return max requests for new key', () => {
      expect(limiter.getRemainingRequests('user1')).toBe(3);
    });

    it('should decrease remaining requests', () => {
      limiter.isAllowed('user1');
      expect(limiter.getRemainingRequests('user1')).toBe(2);

      limiter.isAllowed('user1');
      expect(limiter.getRemainingRequests('user1')).toBe(1);
    });

    it('should not go below zero', () => {
      limiter.isAllowed('user1');
      limiter.isAllowed('user1');
      limiter.isAllowed('user1');
      limiter.isAllowed('user1'); // over limit
      expect(limiter.getRemainingRequests('user1')).toBe(0);
    });
  });

  describe('getResetTime', () => {
    it('should return future time for new key', () => {
      const resetTime = limiter.getResetTime('user1');
      expect(resetTime).toBeGreaterThan(Date.now());
    });

    it('should return same reset time for existing key', () => {
      limiter.isAllowed('user1');
      const resetTime1 = limiter.getResetTime('user1');
      limiter.isAllowed('user1');
      const resetTime2 = limiter.getResetTime('user1');
      expect(resetTime1).toBe(resetTime2);
    });
  });

  describe('clear', () => {
    it('should clear all entries', () => {
      limiter.isAllowed('user1');
      limiter.isAllowed('user2');
      expect(limiter.getRemainingRequests('user1')).toBe(2);
      expect(limiter.getRemainingRequests('user2')).toBe(2);

      limiter.clear();

      expect(limiter.getRemainingRequests('user1')).toBe(3);
      expect(limiter.getRemainingRequests('user2')).toBe(3);
    });
  });
});

describe('createRateLimitMiddleware', () => {
  let limiter: RateLimiter;
  let mockReq: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let mockRes: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let next: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  beforeEach(() => {
    limiter = new RateLimiter(2, 1000);
    mockReq = { ip: '127.0.0.1' };
    mockRes = {
      writeHead: vi.fn(),
      end: vi.fn(),
      setHeader: vi.fn()
    };
    next = vi.fn();
  });

  it('should allow requests within limit', () => {
    const middleware = createRateLimitMiddleware(limiter);

    middleware(mockReq, mockRes, next);

    expect(next).toHaveBeenCalled();
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 2);
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 1);
  });

  it('should block requests over limit', () => {
    const middleware = createRateLimitMiddleware(limiter);

    // Use up the limit
    middleware(mockReq, mockRes, next);
    middleware(mockReq, mockRes, next);
    next.mockClear();

    // This should be blocked
    middleware(mockReq, mockRes, next);

    expect(next).not.toHaveBeenCalled();
    expect(mockRes.writeHead).toHaveBeenCalledWith(429, { 'Content-Type': 'application/json' });
    expect(mockRes.end).toHaveBeenCalledWith(
      expect.stringContaining('Too Many Requests')
    );
  });

  it('should use custom key function', () => {
    const keyFn = vi.fn((req) => req.ip);
    const middleware = createRateLimitMiddleware(limiter, keyFn);

    middleware(mockReq, mockRes, next);

    expect(keyFn).toHaveBeenCalledWith(mockReq);
  });

  it('should use anonymous key by default', () => {
    const middleware = createRateLimitMiddleware(limiter);

    middleware({}, mockRes, next);

    expect(next).toHaveBeenCalled();
  });
});