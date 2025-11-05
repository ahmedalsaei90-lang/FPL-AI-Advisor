import { NextRequest, NextResponse } from 'next/server'
import { serverSignIn, createServerAuthClient } from '@/lib/supabase'
import { validateData, loginSchema, formatValidationErrors } from '@/lib/validation'
import { checkRateLimit, rateLimits } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json()

    // Validate input using centralized schema
    const validation = validateData(loginSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: formatValidationErrors(validation.errors!)
        },
        { status: 400 }
      )
    }

    const { email, password } = validation.data!
        // Sign in with Supabase Auth
        const { user, session } = await serverSignIn(email, password)
        if (!user || !session) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Get user profile from database
    const supabase = createServerAuthClient()
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    // Add rate limit headers to successful responses
    return NextResponse.json(
      {
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.display_name || profile?.name || email.split('@')[0],
          fplTeamId: profile?.fpl_team_id,
          fplTeamName: profile?.fpl_team_name,
          isGuest: profile?.is_guest || false
        },
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at
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
    console.error('Login error:', error)

    // Handle Supabase auth errors
    if (error.message?.includes('Invalid login credentials')) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}