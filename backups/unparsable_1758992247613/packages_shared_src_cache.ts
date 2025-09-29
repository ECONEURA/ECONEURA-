
      this.emit(
      return null;
    }

    // Update access stats
    entry.hits++;
    entry.lastAccessed = Date.now();

    this.stats.hits++;
    this.updateHitRate();

    this.emit(
    return entry.data;
  }

  /*
   * Set value in cache
   *
  async set<T = any>(
    key: string,
    value: T,
    ttl?: number
  ): Promise<void> {
    const entry: CacheEntry<T> = {;
      data: value,
      timestamp: Date.now(),
      ttl: ttl || this.config.ttl,
      hits: 0,
      lastAccessed: Date.now()
    };

    // Check size limits
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, entry);
    this.stats.sets++;
    this.stats.size = this.cache.size;

    this.emit(
  }

  /*
   * Delete value from cache
   *
  async delete(key: string): Promise<boolean> {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      this.stats.size = this.cache.size;
      this.emit(
    }
    return deleted;
  }

  /*
   * Clear all cache entries
   *
  async clear(): Promise<void> {
    this.cache.clear();
    this.stats.clears++;
    this.stats.size = 0;
    this.emit(
  }

  /*
   * Check if key exists
   *
  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.size = this.cache.size;
      return false;
    }

    return true;
  }

  /*
   * Get cache statistics
   *
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /*
   * Get all cache keys
   *
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /*
   * Get cache entry metadata
   *
  getMetadata(key: string): CacheEntry | null {
    return this.cache.get(key) || null;
  }

  /*
   * Set multiple values
   *
  async mset(entries: Record<string, any>, ttl?: number): Promise<void> {
    for (const [key, value] of Object.entries(entries)) {
      await this.set(key, value, ttl);
    }
  }

  /*
   * Get multiple values
   *
  async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    return Promise.all(keys.map(key => this.get<T>(key)));
  }

  /*
   * Increment numeric value
   *
  async incr(key: string, amount: number = 1): Promise<number> {
    const current = await this.get<number>(key) || 0;
    const newValue = current + amount;
    await this.set(key, newValue);
    return newValue;
  }

  /*
   * Decrement numeric value
   *
  async decr(key: string, amount: number = 1): Promise<number> {
    return this.incr(key, -amount);
  }

  /*
   * Set expiration time for existing key
   *
  async expire(key: string, ttl: number): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;

    entry.ttl = ttl;
    entry.timestamp = Date.now();
    return true;
  }

  /*
   * Get time to live for key
   *
  async ttl(key: string): Promise<number> {
    const entry = this.cache.get(key);
    if (!entry) return -1;

    const elapsed = Date.now() - entry.timestamp;
    const remaining = entry.ttl - elapsed;

    return remaining > 0 ? Math.ceil(remaining / 1000) : -1;
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.emit(
    }
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;/;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  private startCleanupInterval(): void {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const expiredKeys: string[] = [];

      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          expiredKeys.push(key);
        }
      }

      expiredKeys.forEach(key => {
        this.cache.delete(key);
        this.emit(
      });

      if (expiredKeys.length > 0) {
        this.stats.size = this.cache.size;
      }
    }, 60000); // 1 minute
  }

  /*
   * Stop cleanup interval (useful for testing)
   *
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }

  /*
   * Destroy cache manager
   *
  destroy(): void {
    this.stopCleanup();
    this.cache.clear();
    this.removeAllListeners();
  }
}

// Default cache instance
export const cacheManager = new CacheManager({;
  ttl: parseInt(process.env.CACHE_TTL 
  maxSize: parseInt(process.env.CACHE_MAX_SIZE 
  compression: process.env.CACHE_COMPRESSION 
  redisUrl: process.env.REDIS_URL
});
