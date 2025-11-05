import { NextRequest, NextResponse } from 'next/server'
import { getServerClient, createServerClient } from '@/lib/supabase'
import { randomUUID } from 'crypto'
import { checkRateLimit, rateLimits } from '@/lib/rate-limit'

/**
 * Generate unique guest user number
 * Returns next available guest number (e.g., 1, 2, 3...)
 */
async function getNextGuestNumber(supabase: any): Promise<number> {
  const { data: guestUsers, error } = await supabase
    .from('users')
    .select('email')
    .like('email', 'guest_%@fpl-advisor.com')
    .order('email', { ascending: false })
    .limit(1)

  if (error || !guestUsers || guestUsers.length === 0) {
    return 1
  }

  // Extract number from email (e.g., guest_00001@fpl-advisor.com -> 1)
  const lastEmail = guestUsers[0].email
  const match = lastEmail.match(/guest_(\d+)@/)
  const lastNumber = match ? parseInt(match[1], 10) : 0

  return lastNumber + 1
}

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

    // Generate unique guest number
    const guestNumber = await getNextGuestNumber(supabase)
    const guestCode = guestNumber.toString().padStart(5, '0') // e.g., 00001
    const guestEmail = `guest_${guestCode}@fpl-advisor.com`
    const guestName = `Guest #${guestNumber}`

    // Create auth user first to satisfy foreign key constraint
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: guestEmail,
      password: randomUUID().replace(/-/g, ''), // Random password
      email_confirm: true,
      user_metadata: {
        is_guest: true,
        guest_number: guestNumber,
        display_name: guestName
      }
    })

    if (authError) {
      console.error('Auth user creation error:', authError)
      throw authError
    }

    // Now create the user profile
    const { data: guestUser, error: createError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        email: guestEmail,
        name: guestName,
        last_active_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.error('User profile creation error:', createError)
      throw createError
    }

    // Create guest login event (optional - fail silently if table doesn't exist)
    await supabase
      .from('user_events')
      .insert({
        user_id: guestUser.id,
        event_type: 'guest_login',
        event_data: JSON.stringify({
          timestamp: new Date().toISOString(),
          guest_number: guestNumber
        })
      })
      .then(null, () => {}) // Ignore errors

    // Add rate limit headers to successful responses
    return NextResponse.json(
      {
        message: 'Guest access granted',
        user: {
          id: guestUser.id,
          email: guestUser.email,
          name: guestUser.name,
          guestNumber: guestNumber,
          fplTeamId: guestUser.fpl_team_id ?? null,
          fplTeamName: guestUser.fpl_team_name ?? null,
          isGuest: true
        }
      },
      {
        status: 201,
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
