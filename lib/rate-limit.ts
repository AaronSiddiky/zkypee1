// A lightweight rate limiter based on LRU cache
// Adapted from Next.js examples

interface RateLimitOptions {
  interval: number;
  tokensPerInterval: number;
  uniqueTokenPerInterval: number;
}

class RateLimiter {
  private tokens: Map<string, number>;
  private lastReset: number;
  private options: RateLimitOptions;

  constructor(options: RateLimitOptions) {
    this.tokens = new Map();
    this.lastReset = Date.now();
    this.options = options;
  }

  async check(key: string): Promise<boolean> {
    const now = Date.now();

    // Reset tokens if interval has passed
    if (now - this.lastReset > this.options.interval) {
      this.tokens.clear();
      this.lastReset = now;
    }

    // Get current token count for this key
    const currentTokens = this.tokens.get(key) || 0;

    // If we've exceeded the limit, return false
    if (currentTokens >= this.options.tokensPerInterval) {
      return false;
    }

    // Increment token count
    this.tokens.set(key, currentTokens + 1);

    // Clean up old tokens if we have too many
    if (this.tokens.size > this.options.uniqueTokenPerInterval) {
      const oldestKey = this.tokens.keys().next().value;
      this.tokens.delete(oldestKey);
    }

    return true;
  }
}

export default function rateLimit(options: RateLimitOptions): RateLimiter {
  return new RateLimiter(options);
}
