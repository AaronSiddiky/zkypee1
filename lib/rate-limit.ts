// A lightweight rate limiter based on LRU cache
// Adapted from Next.js examples

export interface Options {
  interval: number;
  tokensPerInterval: number;
  uniqueTokenPerInterval: number;
}

// In-memory store for rate limits
// For production, consider using Redis or another distributed store
const tokenCache = new Map();

export default function rateLimit(options: Options) {
  const { interval, tokensPerInterval, uniqueTokenPerInterval } = options;

  return {
    /**
     * Check if the current request is within rate limits
     * @param limit Number of requests allowed per interval
     * @param token Unique token to identify the request (e.g. IP address)
     */
    check: async (limit: number, token: string): Promise<void> => {
      // Create timestamp for current interval
      const now = Date.now();
      const intervalStart = now - (now % interval);

      // Create cache key for this interval
      const intervalKey = `${token}:${intervalStart}`;

      // Clean up old interval caches to prevent memory leaks
      if (tokenCache.size > uniqueTokenPerInterval) {
        // Get keys for cleanup - use Array.from instead of spread operator
        const keys = Array.from(tokenCache.keys());

        // Remove the oldest entries (25% of max size)
        const cleanupCount = Math.floor(uniqueTokenPerInterval * 0.25);
        for (let i = 0; i < cleanupCount && i < keys.length; i++) {
          tokenCache.delete(keys[i]);
        }
      }

      // Current count for this interval
      let currentCount = (tokenCache.get(intervalKey) || 0) as number;

      // Check if limit exceeded
      if (currentCount >= limit) {
        throw new Error("Rate limit exceeded");
      }

      // Increment counter
      tokenCache.set(intervalKey, currentCount + 1);

      return Promise.resolve();
    },
  };
}
