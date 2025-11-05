import { NextRequest, NextResponse } from 'next/server'
import { serverSignUp } from '@/lib/supabase'
import { validateData, signupSchema, formatValidationErrors } from '@/lib/validation'
import { checkRateLimit, rateLimits } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Check rate limit FIRST (stricter for signup to prevent spam accounts)
    const rateLimit = checkRateLimit(rateLimits.signup, request)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many signup attempts. Please try again later.',
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

    const body = await request.json()

    // Validate input using centralized schema
    const validation = validateData(signupSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: formatValidationErrors(validation.errors!)
        },
        { status: 400 }
      )
    }

    const { email, password, displayName } = validation.data!

    // Create user with Supabase Auth
    const { user } = await serverSignUp(email, password, displayName)
    if (!user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Add rate limit headers to successful responses
    return NextResponse.json(
      {
        message: 'Account created successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.display_name || email.split('@')[0]
        }
      },
      {
        headers: {
          'X-RateLimit-Limit': rateLimit.limit.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString()
        }
      }
    )
  } catch (error: any) {
    console.error('Signup error:', error)

    // Handle Supabase auth errors
    if (error.message?.includes('User already registered')) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}