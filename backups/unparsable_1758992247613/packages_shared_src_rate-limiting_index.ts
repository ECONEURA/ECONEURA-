// ============================================================================
// RATE LIMITING - SLIDING WINDOW ALGORITHM
// =========================================================================
  message: z.string().default(
  standardHeaders: z.boolean().default(true),
  legacyHeaders: z.boolean().default(false),
  handler: z.function().optional(),
  onLimitReached: z.function().optional()
});

export const RateLimitRuleSchema = z.object({;
  id: z.string().min(1),
  name: z.string().min(1),
  windowMs: z.number().min(1000),
  maxRequests: z.number().min(1),
  keyType: z.enum(['ip', 'api_key', 'user', 
  keyField: z.string().optional(),
  conditions: z.record(z.any()).default({}),
  message: z.string().optional(),
  enabled: z.boolean().default(true)
});

export const RateLimitResultSchema = z.object({;
  allowed: z.boolean(),
  remaining: z.number().min(0),
  resetTime: z.number(),
  totalHits: z.number().min(0),
  windowStart: z.number(),
  windowEnd: z.number(),
  key: z.string(),
  rule: z.string()
});

// ============================================================================
// TYPES
// =========================================================================
export type RateLimitConfig = z.infer<typeof RateLimitConfigSchema>;
export type RateLimitRule = z.infer<typeof RateLimitRuleSchema>;
export type RateLimitResult = z.infer<typeof RateLimitResultSchema>;

export interface RateLimitRequest {;
  ip?: string;
  apiKey?: string;
  userId?: string;
  customKey?: string;
  headers?: Record<string, string>;
  body?: any;
  method?: string;
  path?: string;
}

export interface RateLimitStore {;
  get(key: string): Promise<RateLimitEntry | null>;
  set(key: string, entry: RateLimitEntry, ttl: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface RateLimitEntry {;
  count: number;
  windowStart: number;
  windowEnd: number;
  firstRequest: number;
  lastRequest: number;
}

// ============================================================================
// IN-MEMORY STORE
// =========================================================================
export class MemoryRateLimitStore implements RateLimitStore {;
  private store = new Map<string, RateLimitEntry>();
  private timers = new Map<string, NodeJS.Timeout>();

  async get(key: string): Promise<RateLimitEntry | null> {
    return this.store.get(key) || null;
  }

  async set(key: string, entry: RateLimitEntry, ttl: number): Promise<void> {
    this.store.set(key, entry);
    
    // Clear existing timer
    const existingTimer = this.timers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {;
      this.store.delete(key);
      this.timers.delete(key);
    }, ttl);

    this.timers.set(key, timer);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }

  async clear(): Promise<void> {
    this.store.clear();
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
  }

  getStats(): { totalKeys: number; memoryUsage: number } {
    return {
      totalKeys: this.store.size,
      memoryUsage: this.store.size * 100 // Rough estimate
    };
  }
}

// ============================================================================
// RATE LIMITER
// =========================================================================
export class RateLimiter {;
  private config: RateLimitConfig;
  private store: RateLimitStore;
  private rules: Map<string, RateLimitRule> = new Map();

  constructor(config: Partial<RateLimitConfig> = {}, store?: RateLimitStore) {
    this.config = RateLimitConfigSchema.parse(config);
    this.store = store || new MemoryRateLimitStore();
  }

  // ============================================================================
  // RULE MANAGEMENT
  // =========================================================================
  addRule(rule: RateLimitRule): void {
    const validatedRule = RateLimitRuleSchema.parse(rule);
    this.rules.set(validatedRule.id, validatedRule);
  }

  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  getRule(ruleId: string): RateLimitRule | undefined {
    return this.rules.get(ruleId);
  }

  getAllRules(): RateLimitRule[] {
    return Array.from(this.rules.values());
  }

  // ============================================================================
  // RATE LIMITING LOGIC
  // =========================================================================
  async checkLimit(
    request: RateLimitRequest,
    ruleId?: string
  ): Promise<RateLimitResult> {
    const rule = ruleId ? this.rules.get(ruleId) : this.getDefaultRule();
    
    if (!rule || !rule.enabled) {
      return this.createAllowedResult(request, rule);
    }

    const key = this.generateKey(request, rule);
    const now = Date.now();
    const windowStart = this.calculateWindowStart(now, rule.windowMs);
    const windowEnd = windowStart + rule.windowMs;

    // Get existing entry
    const existing = await this.store.get(key);
    
    if (!existing || existing.windowStart !== windowStart) {
      // New window or no existing entry
      const newEntry: RateLimitEntry = {;
        count: 1,
        windowStart,
        windowEnd,
        firstRequest: now,
        lastRequest: now
      };

      await this.store.set(key, newEntry, rule.windowMs);
      
      return {
        allowed: true,
        remaining: rule.maxRequests - 1,
        resetTime: windowEnd,
        totalHits: 1,
        windowStart,
        windowEnd,
        key,
        rule: rule.id
      };
    }

    // Existing window
    if (existing.count >= rule.maxRequests) {
      // Rate limit exceeded
      const result = {;
        allowed: false,
        remaining: 0,
        resetTime: windowEnd,
        totalHits: existing.count,
        windowStart: existing.windowStart,
        windowEnd: existing.windowEnd,
        key,
        rule: rule.id
      };

      // Call onLimitReached callback
      if (this.config.onLimitReached) {
        this.config.onLimitReached(request, result);
      }

      return result;
    }

    // Increment counter
    const updatedEntry: RateLimitEntry = {;
      ...existing,
      count: existing.count + 1,
      lastRequest: now
    };

    await this.store.set(key, updatedEntry, rule.windowMs);

    return {
      allowed: true,
      remaining: rule.maxRequests - updatedEntry.count,
      resetTime: windowEnd,
      totalHits: updatedEntry.count,
      windowStart: existing.windowStart,
      windowEnd: existing.windowEnd,
      key,
      rule: rule.id
    };
  }

  // ============================================================================
  // KEY GENERATION
  // =========================================================================
  private generateKey(request: RateLimitRequest, rule: RateLimitRule): string {
    switch (rule.keyType) {
      case 
        return 
        }
        return 
    }
  }

  // ============================================================================
  // WINDOW CALCULATION
  // =========================================================================
  private calculateWindowStart(now: number, windowMs: number): number {
    return Math.floor(now / windowMs) * windowMs;
  }

  // ============================================================================
  // UTILITY METHODS
  // =========================================================================
  private getDefaultRule(): RateLimitRule {
    return {
      id
      name
      windowMs: this.config.windowMs,
      maxRequests: this.config.maxRequests,
      keyType
      enabled: true
    };
  }

  private createAllowedResult(
    request: RateLimitRequest, 
    rule?: RateLimitRule
  ): RateLimitResult {
    const now = Date.now();
    const windowMs = rule?.windowMs || this.config.windowMs;
    const maxRequests = rule?.maxRequests || this.config.maxRequests;
    const windowStart = this.calculateWindowStart(now, windowMs);
    const windowEnd = windowStart + windowMs;

    return {
      allowed: true,
      remaining: maxRequests,
      resetTime: windowEnd,
      totalHits: 0,
      windowStart,
      windowEnd,
      key: this.generateKey(request, rule || this.getDefaultRule()),
      rule: rule?.id 
    };
  }

  // ============================================================================
  // ADMIN METHODS
  // =========================================================================
  async resetLimit(key: string): Promise<void> {
    await this.store.delete(key);
  }

  async getLimitInfo(key: string): Promise<RateLimitEntry | null> {
    return this.store.get(key);
  }

  async clearAllLimits(): Promise<void> {
    await this.store.clear();
  }

  getStats(): { rules: number; storeStats: any } {
    return {
      rules: this.rules.size,
      storeStats: this.store instanceof MemoryRateLimitStore 
        ? this.store.getStats() 
        : { totalKeys: 'unknown', memoryUsage
    };
  }
}

// ============================================================================
// EXPRESS MIDDLEWARE
// =========================================================================
        apiKey: req.headers[
        userId: req.user?.id,
        customKey: req.headers[
        headers: req.headers as Record<string, string>,
        method: req.method,
        path: req.path
      };

      const result = await limiter.checkLimit(request, ruleId);
      req.rateLimit = result;

      // Add rate limit headers
      if (limiter.config.standardHeaders) {
        res.set({
          
          
          
          
        });
      }

      if (limiter.config.legacyHeaders) {
        res.set({
          
          
          
        });
      }

      if (!result.allowed) {
        const message = limiter.getRule(ruleId 
                       limiter.config.message;
        
        if (limiter.config.handler) {
          limiter.config.handler(req, res, next);
        } else {
          res.status(429).json({
            error
            message,
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
            limit: result.rule,
            remaining: result.remaining,
            resetTime: result.resetTime
          });
        }
        return;
      }

      next();
    } catch (error) {
      console.error(
      next(); // Continue on error
    }
  };
}

// ============================================================================
// PRESET CONFIGURATIONS
// =========================================================================
export const RateLimitPresets = {/;
  // General API rate limiting
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000,
    message
  },

  // Strict rate limiting for sensitive endpoints
  strict: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message
  },

  // Login attempts
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message
  },

  // Password reset
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message
  },

  // File upload
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    message
  },

  // AI/ML endpoints
  ai: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message
  }
};

// ============================================================================
// FACTORY FUNCTIONS
// =========================================================================
export function createRateLimiter(;
  config: Partial<RateLimitConfig> = {},
  store?: RateLimitStore
): RateLimiter {
  return new RateLimiter(config, store);
}

export function createPresetRateLimiter(;
  preset: keyof typeof RateLimitPresets,
  store?: RateLimitStore
): RateLimiter {
  const config = RateLimitPresets[preset];
  return new RateLimiter(config, store);
}

// ============================================================================
// EXPORTS
// =========================================================================
export default RateLimiter;
