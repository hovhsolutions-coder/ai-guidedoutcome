/**
 * Minimal in-process rate limiter for AI endpoints.
 * Uses a sliding window approach with per-client IP tracking.
 * No external dependencies (Redis, etc.) - pure in-memory for simplicity.
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute window
  maxRequests: 10, // 10 requests per minute per IP
};

// In-memory store - will reset on server restart (acceptable for minimal hardening)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically (every 5 minutes)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

function cleanupOldEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.windowStart > DEFAULT_RATE_LIMIT.windowMs) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup periodically - unref so it doesn't keep process alive
if (typeof setInterval !== 'undefined') {
  const interval = setInterval(cleanupOldEntries, CLEANUP_INTERVAL_MS);
  // @ts-ignore - unref might not be available in all environments
  if (interval.unref) {
    interval.unref();
  }
}

/**
 * Get client identifier from request (IP-based with fallback)
 */
function getClientIdentifier(request: Request): string {
  // Try to get IP from headers (works with most reverse proxies)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwarded) {
    // Take the first IP if multiple are present
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp.trim();
  }

  // Fallback to a default for local development
  // In production, this should be enhanced with actual IP detection
  return 'unknown-client';
}

/**
 * Check if request is within rate limit
 * Returns { allowed, remaining, resetTime }
 */
export function checkRateLimit(
  request: Request,
  config: Partial<RateLimitConfig> = {}
): { allowed: boolean; remaining: number; resetTime: number; retryAfter: number } {
  const clientId = getClientIdentifier(request);
  const key = `${request.url}:${clientId}`;
  const now = Date.now();

  const windowMs = config.windowMs ?? DEFAULT_RATE_LIMIT.windowMs;
  const maxRequests = config.maxRequests ?? DEFAULT_RATE_LIMIT.maxRequests;

  const existing = rateLimitStore.get(key);

  if (!existing || now - existing.windowStart > windowMs) {
    // New window or expired window
    rateLimitStore.set(key, {
      count: 1,
      windowStart: now,
    });

    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
      retryAfter: 0,
    };
  }

  // Within existing window
  if (existing.count >= maxRequests) {
    const resetTime = existing.windowStart + windowMs;
    const retryAfter = Math.ceil((resetTime - now) / 1000);

    return {
      allowed: false,
      remaining: 0,
      resetTime,
      retryAfter,
    };
  }

  // Increment count
  existing.count++;
  rateLimitStore.set(key, existing);

  return {
    allowed: true,
    remaining: maxRequests - existing.count,
    resetTime: existing.windowStart + windowMs,
    retryAfter: 0,
  };
}

/**
 * Get rate limit info without incrementing (for logging/debugging)
 */
export function getRateLimitInfo(
  request: Request,
  config: Partial<RateLimitConfig> = {}
): { remaining: number; resetTime: number; windowMs: number; maxRequests: number } {
  const clientId = getClientIdentifier(request);
  const key = `${request.url}:${clientId}`;
  const now = Date.now();

  const windowMs = config.windowMs ?? DEFAULT_RATE_LIMIT.windowMs;
  const maxRequests = config.maxRequests ?? DEFAULT_RATE_LIMIT.maxRequests;

  const existing = rateLimitStore.get(key);

  if (!existing || now - existing.windowStart > windowMs) {
    return {
      remaining: maxRequests,
      resetTime: now + windowMs,
      windowMs,
      maxRequests,
    };
  }

  return {
    remaining: Math.max(0, maxRequests - existing.count),
    resetTime: existing.windowStart + windowMs,
    windowMs,
    maxRequests,
  };
}
