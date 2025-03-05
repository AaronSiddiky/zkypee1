// Map to store tokens by user ID (for server-side use only)
// In production, you'd use a more persistent and secure storage
const userTokenCache = new Map<
  string,
  {
    token: string;
    expiry: number;
  }
>();

/**
 * Get a token for a user from the server-side cache
 * @param userId The user ID to get the token for
 * @returns The token if found and not expired, null otherwise
 */
export function getTokenForUser(userId: string): string | null {
  const cachedData = userTokenCache.get(userId);

  // If no token or token expired, return null
  if (!cachedData || cachedData.expiry < Date.now()) {
    return null;
  }

  return cachedData.token;
}

/**
 * Store a token for a user in the server-side cache
 * @param userId The user ID to store the token for
 * @param token The token to store
 * @param expiryMs The expiry time in milliseconds
 */
export function storeTokenForUser(
  userId: string,
  token: string,
  expiryMs: number = 900 * 1000 // 15 minutes by default
): void {
  userTokenCache.set(userId, {
    token,
    expiry: Date.now() + expiryMs,
  });
}

/**
 * Clear a token for a user from the server-side cache
 * @param userId The user ID to clear the token for
 */
export function clearTokenForUser(userId: string): void {
  userTokenCache.delete(userId);
}

/**
 * Get all stored tokens (for debugging)
 * @returns A copy of the token cache
 */
export function getAllTokens(): Record<
  string,
  { token: string; expiry: number }
> {
  const result: Record<string, { token: string; expiry: number }> = {};

  userTokenCache.forEach((value, key) => {
    result[key] = { ...value };
  });

  return result;
}
