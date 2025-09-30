// Simple in-memory rate limiter
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests = 100, windowMs = 60000) { // 100 requests per minute by default
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      this.limits.set(key, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  getRemainingRequests(key: string): number {
    const entry = this.limits.get(key);
    if (!entry || Date.now() > entry.resetTime) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - entry.count);
  }

  getResetTime(key: string): number {
    const entry = this.limits.get(key);
    return entry?.resetTime || Date.now() + this.windowMs;
  }

  clear(): void {
    this.limits.clear();
  }
}

// Middleware for HTTP requests
export function createRateLimitMiddleware(limiter: RateLimiter, keyFn?: (req: any) => string) {
  return (_req: any, res: any, next: () => void) => {
    const key = keyFn ? keyFn(_req) : 'anonymous';

    if (!limiter.isAllowed(key)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Too Many Requests',
        retryAfter: Math.ceil((limiter.getResetTime(key) - Date.now()) / 1000)
      }));
      return;
    }

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', limiter['maxRequests']);
    res.setHeader('X-RateLimit-Remaining', limiter.getRemainingRequests(key));
    res.setHeader('X-RateLimit-Reset', limiter.getResetTime(key));

    next();
  };
}

// Default rate limiter instance
export const defaultRateLimiter = new RateLimiter();