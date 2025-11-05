import { NextRequest, NextResponse } from 'next/server'
import { getServerClient } from '@/lib/supabase'
import { validateData, uuidSchema, fplLeagueIdSchema, formatValidationErrors } from '@/lib/validation'
import { checkRateLimit, rateLimits } from '@/lib/rate-limit'
import { z } from 'zod'
import {
  importMiniLeague,
  getLeagueStandings
} from '@/lib/fpl-api'

// Schema for league import endpoint
const importLeagueSchema = z.object({
  userId: uuidSchema,
  leagueId: fplLeagueIdSchema
})

export async function POST(request: NextRequest) {
  try {
    // Check rate limit FIRST (protect FPL API quota)
    const rateLimit = checkRateLimit(rateLimits.fplImport, request)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many import requests. Please try again later.',
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

    // Validate input using centralized validators
    const validation = validateData(importLeagueSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: formatValidationErrors(validation.errors!)
        },
        { status: 400 }
      )
    }

    const { userId, leagueId } = validation.data!

    const supabase = getServerClient()

    try {
      // Fetch league data from FPL API
      const leagueData = await importMiniLeague(leagueId)

      // Get additional league details from first page
      const firstPageData = await getLeagueStandings(leagueId, 1)

      // Check if league already exists in database
      let dbLeague
      const { data: existingLeague, error: findError } = await supabase
        .from('leagues')
        .select('*')
        .eq('fpl_league_id', leagueId)
        .single()

      if (existingLeague) {
        // League exists, update it
        const { data: updated, error: updateError } = await supabase
          .from('leagues')
          .update({
            league_name: leagueData.name,
            league_type: leagueData.league_type,
            updated_at: new Date().toISOString()
          })
          .eq('fpl_league_id', leagueId)
          .select()
          .single()

        if (updateError) throw updateError
        dbLeague = updated
      } else {
        // League doesn't exist, create it
        const { data: created, error: createError } = await supabase
          .from('leagues')
          .insert({
            fpl_league_id: leagueId,
            league_name: leagueData.name,
            league_type: leagueData.league_type,
            admin_user_id: userId
          })
          .select()
          .single()

        if (createError) throw createError
        dbLeague = created
      }

      // Check if user is already a member of this league
      const { data: existingMembership } = await supabase
        .from('league_memberships')
        .select('*')
        .eq('league_id', dbLeague.id)
        .eq('user_id', userId)
        .single()

      if (existingMembership) {
        return NextResponse.json(
          { error: 'You have already imported this league' },
          { status: 409 }
        )
      }

      // Get user's FPL team info
      const { data: userData } = await supabase
        .from('users')
        .select('fpl_team_id, name')
        .eq('id', userId)
        .single()

      // Add user to league memberships
      const { error: membershipError } = await supabase
        .from('league_memberships')
        .insert({
          league_id: dbLeague.id,
          user_id: userId,
          fpl_team_id: userData?.fpl_team_id || 0,
          team_name: userData?.name || 'Unknown Team'
        })

      if (membershipError) throw membershipError

      // Create league imported event
      await supabase
        .from('user_events')
        .insert({
          user_id: userId,
          event_type: 'league_imported',
          event_data: JSON.stringify({
            league_id: leagueId,
            league_name: leagueData.name,
            member_count: leagueData.members.length,
            timestamp: new Date().toISOString(),
            source: 'fpl_api'
          })
        })

      // Add rate limit headers to successful responses
      return NextResponse.json(
        {
          message: 'League imported successfully from FPL',
          league: {
            id: dbLeague.fpl_league_id,
            dbId: dbLeague.id,
            userId,
            leagueId: dbLeague.fpl_league_id,
            leagueName: dbLeague.league_name,
            leagueType: dbLeague.league_type,
            memberCount: leagueData.members.length,
            createdAt: dbLeague.created_at
          },
          leagueData: {
            leagueId: leagueData.id,
            leagueName: leagueData.name,
            memberCount: leagueData.members.length,
            leagueType: leagueData.league_type
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
    } catch (fplError) {
      console.error('FPL API error:', fplError)

      // Create sync failure event
      await supabase
        .from('user_events')
        .insert({
          user_id: userId,
          event_type: 'league_sync_failed',
          event_data: JSON.stringify({
            league_id: leagueId,
            error: fplError instanceof Error ? fplError.message : 'Unknown error',
            timestamp: new Date().toISOString()
          })
        })

      // Check if this is an invalid league ID error
      if (fplError instanceof Error &&
          (fplError.message.includes('404') ||
           fplError.message.includes('Not Found'))) {
        return NextResponse.json(
          { error: 'League ID not found. Please check your league ID and try again.' },
          { status: 404 }
        )
      }

      // Handle rate limiting errors
      if (fplError instanceof Error &&
          fplError.message.includes('429')) {
        return NextResponse.json(
          { error: 'Too many requests to FPL API. Please try again later.' },
          { status: 429 }
        )
      }

      // Generic FPL API error
      return NextResponse.json(
        { error: 'Failed to fetch league data from FPL API. Please try again later.' },
        { status: 502 }
      )
    }
  } catch (error) {
    console.error('League import error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
