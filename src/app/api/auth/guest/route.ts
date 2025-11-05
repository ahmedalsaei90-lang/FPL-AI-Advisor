import { NextRequest, NextResponse } from 'next/server'
import { getServerClient, createServerClient } from '@/lib/supabase'
import { randomUUID } from 'crypto'
import { checkRateLimit, rateLimits } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Check rate limit FIRST
    const rateLimit = checkRateLimit(rateLimits.guest, request)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many guest login attempts. Please try again later.',
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

    // Use service client to bypass RLS for guest user creation
    const supabase = createServerClient()

    // Create or get guest user
    const { data: existingGuestUser, error: queryError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'guest@fpl-advisor.com')
      .single()

    let guestUser = existingGuestUser

    if (!guestUser) {
      // Create auth user first to satisfy foreign key constraint
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: 'guest@fpl-advisor.com',
        password: randomUUID().replace(/-/g, ''), // Random password
        email_confirm: true,
        user_metadata: {
          is_guest: true,
          display_name: 'Guest User'
        }
      })

      if (authError) {
        throw authError
      }

      // Now create the user profile
      const { data: newGuestUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: authUser.user.id,
          email: 'guest@fpl-advisor.com',
          name: 'Guest User'
        })
        .select()
        .single()

      if (createError) {
        throw createError
      }

      guestUser = newGuestUser
    }

    if (guestUser.fpl_team_id === 999999) {
      const { error: clearSampleError, data: cleanedUser } = await supabase
        .from('users')
        .update({
          fpl_team_id: null,
          fpl_team_name: null,
          last_active_at: new Date().toISOString()
        })
        .eq('id', guestUser.id)
        .select()
        .single()

      if (cleanedUser) {
        guestUser = cleanedUser
      }
    }

    // Update last active timestamp for the reusable guest account
    await supabase
      .from('users')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', guestUser.id)

    // Create guest login event
    const { error: eventError } = await supabase
      .from('user_events')
      .insert({
        user_id: guestUser.id,
        event_type: 'guest_login',
        event_data: JSON.stringify({
          timestamp: new Date().toISOString()
        })
      })
    
    if (eventError) {
      console.error('Error creating guest login event:', eventError);
      // Don't throw here - the guest user was created successfully
    }

    // Add rate limit headers to successful responses
    return NextResponse.json(
      {
        message: 'Guest access granted',
        user: {
          id: guestUser.id,
          email: guestUser.email,
          name: guestUser.name,
          fplTeamId: guestUser.fpl_team_id ?? null,
          fplTeamName: guestUser.fpl_team_name ?? null,
          isGuest: true
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
  } catch (error) {
    console.error('Guest access error:', error)
    return NextResponse.json(
      { error: 'Failed to create guest session' },
      { status: 500 }
    )
  }
}
