/**
 * Rate Limiting Middleware
 *
 * In-memory rate limiter for preventing abuse and brute force attacks.
 *
 * NOTE: This is a simple in-memory solution suitable for:
 * - Development environments
 * - Single-server deployments
 * - Quick MVP implementations
 *
 * For production with multiple servers, consider Redis-based solution.
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the time window
   */
  max: number

  /**
   * Time window in milliseconds
   */
  windowMs: number

  /**
   * Key to use for rate limiting (e.g., IP address, user ID)
   */
  keyGenerator: (request: Request) => string
}

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetTime: number
}

/**
 * Check if a request should be rate limited
 *
 * @param config - Rate limit configuration
 * @param request - The incoming request
 * @returns Rate limit result
 */
export function checkRateLimit(
  config: RateLimitConfig,
  request: Request
): RateLimitResult {
  const key = config.keyGenerator(request)
  const now = Date.now()

  let entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetTime) {
    // Create new entry or reset expired entry
    entry = {
      count: 0,
      resetTime: now + config.windowMs
    }
    rateLimitStore.set(key, entry)
  }

  entry.count++

  const allowed = entry.count <= config.max
  const remaining = Math.max(0, config.max - entry.count)

  return {
    allowed,
    limit: config.max,
    remaining,
    resetTime: entry.resetTime
  }
}

/**
 * Get client IP address from request
 * Works with Vercel, Cloudflare, and other proxies
 */
export function getClientIP(request: Request): string {
  const headers = request.headers

  // Try various headers that proxies use
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIP = headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  const cfConnectingIP = headers.get('cf-connecting-ip')
  if (cfConnectingIP) {
    return cfConnectingIP
  }

  return 'unknown'
}

/**
 * Common key generators
 */
export const keyGenerators = {
  /**
   * Rate limit by IP address
   */
  byIP: (request: Request) => {
    return `ip:${getClientIP(request)}`
  },

  /**
   * Rate limit by user ID (from auth header)
   */
  byUserID: (request: Request) => {
    const authHeader = request.headers.get('authorization')
    // Extract user ID from JWT token if needed
    // For now, use the token itself as the key
    return `user:${authHeader || 'anonymous'}`
  },

  /**
   * Rate limit by endpoint
   */
  byEndpoint: (path: string) => (request: Request) => {
    const ip = getClientIP(request)
    return `endpoint:${path}:${ip}`
  }
}

/**
 * Common rate limit configurations
 */
export const rateLimits = {
  /**
   * Strict rate limit for authentication endpoints
   * 5 requests per 15 minutes
   */
  auth: {
    max: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    keyGenerator: keyGenerators.byIP
  },

  /**
   * Very strict for signup (prevent spam accounts)
   * 3 requests per hour
   */
  signup: {
    max: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyGenerator: keyGenerators.byIP
  },

  /**
   * Moderate rate limit for API endpoints
   * 100 requests per minute
   */
  api: {
    max: 100,
    windowMs: 60 * 1000, // 1 minute
    keyGenerator: keyGenerators.byIP
  },

  /**
   * Loose rate limit for read-only endpoints
   * 200 requests per minute
   */
  readOnly: {
    max: 200,
    windowMs: 60 * 1000,
    keyGenerator: keyGenerators.byIP
  },

  /**
   * Very strict for expensive operations (AI chat)
   * 10 requests per hour
   */
  expensive: {
    max: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyGenerator: keyGenerators.byUserID
  },

  /**
   * Moderate for FPL API calls (team/league import)
   * 20 requests per hour
   */
  fplImport: {
    max: 20,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyGenerator: keyGenerators.byIP
  }
}
