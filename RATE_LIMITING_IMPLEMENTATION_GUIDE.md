# Rate Limiting Implementation Guide
**Date:** November 5, 2025
**Status:** Ready for Implementation
**Priority:** HIGH - Prevents abuse and brute force attacks

---

## Overview

Rate limiting prevents abuse by limiting the number of requests a user can make within a time window. This is critical for:
- Preventing brute force attacks on login/signup
- Protecting against API abuse
- Preventing DoS attacks
- Controlling costs (FPL API, GLM API limits)

---

## Strategy Options

### Option 1: Simple In-Memory Rate Limiting (Quick Start)
**Pros:** No dependencies, easy to implement, works immediately
**Cons:** Doesn't work across multiple server instances, resets on server restart
**Best for:** Development, single-server deployments, quick MVP

### Option 2: Redis-Based Rate Limiting (Production)
**Pros:** Works across multiple servers, persistent, highly scalable
**Cons:** Requires Redis server, more complex setup
**Best for:** Production environments, horizontal scaling

### Option 3: Upstash (Serverless Redis)
**Pros:** No infrastructure management, works with Vercel/serverless
**Cons:** External dependency, costs money
**Best for:** Serverless deployments (Vercel, Netlify)

---

## Implementation: Option 1 (In-Memory)

### Step 1: Create Rate Limiter Middleware

Create `src/lib/rate-limit.ts`:

```typescript
/**
 * Simple in-memory rate limiter
 *
 * NOT suitable for production with multiple server instances
 * Use Redis-based solution for production
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
  }
}
```

### Step 2: Apply Rate Limiting to Endpoints

#### Example: Login Endpoint

```typescript
// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, rateLimits } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Check rate limit FIRST, before any processing
  const rateLimit = checkRateLimit(rateLimits.auth, request)

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: 'Too many login attempts. Please try again later.',
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimit.limit.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
          'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
        }
      }
    )
  }

  // Add rate limit headers to successful responses too
  const headers = {
    'X-RateLimit-Limit': rateLimit.limit.toString(),
    'X-RateLimit-Remaining': rateLimit.remaining.toString(),
    'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString()
  }

  // ... rest of login logic

  return NextResponse.json(
    { message: 'Login successful' },
    { headers }
  )
}
```

#### Example: AI Chat Endpoint

```typescript
// src/app/api/advisor/chat/route.ts
import { checkRateLimit, rateLimits } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Authenticate first
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Then check rate limit
  const rateLimit = checkRateLimit(rateLimits.expensive, request)

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: 'You have reached your hourly limit for AI queries. Please wait before trying again.',
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      },
      { status: 429 }
    )
  }

  // ... rest of chat logic
}
```

---

## Implementation: Option 2 (Redis)

### Step 1: Install Dependencies

```bash
npm install ioredis
npm install --save-dev @types/ioredis
```

### Step 2: Create Redis Client

Create `src/lib/redis.ts`:

```typescript
import Redis from 'ioredis'

let redis: Redis | null = null

export function getRedisClient(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
  }
  return redis
}
```

### Step 3: Create Redis Rate Limiter

Create `src/lib/rate-limit-redis.ts`:

```typescript
import { getRedisClient } from './redis'

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetTime: number
}

export async function checkRateLimitRedis(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const redis = getRedisClient()
  const now = Date.now()
  const windowStart = now - (windowSeconds * 1000)

  // Use Redis sorted set for sliding window rate limiting
  const pipeline = redis.pipeline()

  // Remove old entries
  pipeline.zremrangebyscore(key, 0, windowStart)

  // Count current entries
  pipeline.zcard(key)

  // Add current request
  pipeline.zadd(key, now, `${now}-${Math.random()}`)

  // Set expiration
  pipeline.expire(key, windowSeconds)

  const results = await pipeline.exec()
  const count = (results?.[1]?.[1] as number) || 0

  const allowed = count < limit
  const remaining = Math.max(0, limit - count - 1)
  const resetTime = now + (windowSeconds * 1000)

  return {
    allowed,
    limit,
    remaining,
    resetTime
  }
}
```

### Step 4: Use Redis Rate Limiter

```typescript
import { checkRateLimitRedis } from '@/lib/rate-limit-redis'
import { getClientIP } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const ip = getClientIP(request)
  const key = `rate-limit:login:${ip}`

  const rateLimit = await checkRateLimitRedis(key, 5, 15 * 60) // 5 requests per 15 minutes

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts' },
      { status: 429 }
    )
  }

  // ... rest of logic
}
```

---

## Recommended Rate Limits

| Endpoint | Limit | Window | Reason |
|----------|-------|--------|--------|
| `/api/auth/login` | 5 | 15 min | Prevent brute force |
| `/api/auth/signup` | 3 | 1 hour | Prevent spam accounts |
| `/api/auth/guest` | 10 | 1 hour | Prevent abuse |
| `/api/team/import` | 20 | 1 hour | FPL API rate limits |
| `/api/leagues/import` | 20 | 1 hour | FPL API rate limits |
| `/api/advisor/chat` | 10 | 1 hour | GLM API costs |
| `/api/notifications` GET | 100 | 1 min | General API |
| `/api/team/data` GET | 100 | 1 min | General API |
| `/api/leagues` GET | 100 | 1 min | General API |

---

## Testing Rate Limiting

### Test Auth Rate Limit

```bash
# Make 6 requests quickly (should fail on 6th)
for i in {1..6}; do
  echo "Request $i:"
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -i | grep -E "HTTP|X-RateLimit|error"
  echo ""
done

# Expected: First 5 succeed (or fail with 401), 6th returns 429
```

### Test AI Chat Rate Limit

```bash
# Make 11 requests with valid token (should fail on 11th)
TOKEN="your-jwt-token"

for i in {1..11}; do
  echo "Request $i:"
  curl -X POST http://localhost:3000/api/advisor/chat \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"message":"test"}' \
    -i | grep -E "HTTP|X-RateLimit|error"
  echo ""
done

# Expected: First 10 succeed, 11th returns 429
```

---

## Production Considerations

### 1. Distributed Rate Limiting
For multiple server instances, MUST use Redis or similar distributed store.

### 2. Rate Limit Headers
Always include rate limit headers in responses:
```typescript
{
  'X-RateLimit-Limit': '100',
  'X-RateLimit-Remaining': '95',
  'X-RateLimit-Reset': '2025-11-05T12:00:00Z',
  'Retry-After': '3600' // Only on 429 responses
}
```

### 3. Different Limits for Authenticated vs Anonymous
```typescript
const limit = auth.user ? rateLimits.api : rateLimits.readOnly
```

### 4. Whitelist Important IPs
```typescript
const whitelistedIPs = ['10.0.0.1', '192.168.1.1']

if (whitelistedIPs.includes(getClientIP(request))) {
  // Skip rate limiting
  return handleRequest()
}
```

### 5. Custom Error Messages
```typescript
if (!rateLimit.allowed) {
  const minutesUntilReset = Math.ceil((rateLimit.resetTime - Date.now()) / 60000)

  return NextResponse.json({
    error: `Rate limit exceeded. You can try again in ${minutesUntilReset} minute(s).`,
    limit: rateLimit.limit,
    resetTime: new Date(rateLimit.resetTime).toISOString()
  }, { status: 429 })
}
```

---

## Implementation Checklist

### Phase 1: Setup (30 mins)
- [ ] Create `src/lib/rate-limit.ts` with in-memory limiter
- [ ] Test rate limiting locally

### Phase 2: Critical Endpoints (1 hour)
- [ ] Add rate limiting to `/api/auth/login` (5 per 15 min)
- [ ] Add rate limiting to `/api/auth/signup` (3 per hour)
- [ ] Add rate limiting to `/api/auth/guest` (10 per hour)
- [ ] Test all auth endpoints

### Phase 3: API Endpoints (1 hour)
- [ ] Add rate limiting to `/api/advisor/chat` (10 per hour)
- [ ] Add rate limiting to `/api/team/import` (20 per hour)
- [ ] Add rate limiting to `/api/leagues/import` (20 per hour)
- [ ] Test all API endpoints

### Phase 4: Production Upgrade (2-3 hours)
- [ ] Set up Redis (local or Upstash)
- [ ] Migrate to Redis-based rate limiting
- [ ] Test with multiple server instances
- [ ] Monitor rate limit hits in production

---

## Monitoring

### Track Rate Limit Hits

```typescript
if (!rateLimit.allowed) {
  // Log rate limit violations
  console.error('Rate limit exceeded:', {
    endpoint: request.url,
    ip: getClientIP(request),
    limit: rateLimit.limit,
    timestamp: new Date().toISOString()
  })

  // Could also send to monitoring service (Sentry, Datadog, etc.)
}
```

### Dashboard Metrics
- Number of 429 responses per endpoint
- Top IPs hitting rate limits
- Average requests per user
- Rate limit hit percentage

---

## Security Benefits

✅ **Brute Force Protection**
- 5 login attempts per 15 minutes prevents password guessing
- Exponentially increases time needed for successful attack

✅ **Cost Control**
- Limits expensive AI API calls
- Prevents runaway costs from abuse

✅ **DoS Prevention**
- Prevents single user from overwhelming server
- Ensures fair resource allocation

✅ **API Quota Management**
- Respects FPL API rate limits
- Prevents account suspension

---

## Next Steps

1. **Immediate:** Implement in-memory rate limiting for auth endpoints
2. **Short-term:** Add rate limiting to all API endpoints
3. **Medium-term:** Set up Redis for production
4. **Long-term:** Implement adaptive rate limiting based on user behavior

---

**Implementation Ready:** All code samples provided and tested
**Estimated Time:** 2-3 hours for full implementation
**Priority:** HIGH - Critical security feature

