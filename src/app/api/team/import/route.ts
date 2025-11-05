import { NextRequest, NextResponse } from 'next/server'
import { getServerClient } from '@/lib/supabase'
import { validateData, uuidSchema, fplTeamIdSchema, formatValidationErrors } from '@/lib/validation'
import { checkRateLimit, rateLimits } from '@/lib/rate-limit'
import { z } from 'zod'
import {
  transformFPLTeamData,
  isValidFPLTeamId,
  isGuestTeamId,
  isValidRealFPLTeamId,
  getFPLTeam,
  getCurrentGameweek
} from '@/lib/fpl-api'

// Schema for team import endpoint
const importTeamSchema = z.object({
  userId: uuidSchema,
  fplTeamId: fplTeamIdSchema
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
    const validation = validateData(importTeamSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: formatValidationErrors(validation.errors!)
        },
        { status: 400 }
      )
    }

    const { userId, fplTeamId } = validation.data!

    const supabase = getServerClient()
    
    if (isGuestTeamId(fplTeamId)) {
            return NextResponse.json(
        { error: 'Guest sessions cannot import or sync FPL data. Create an account to connect your real team.' },
        { status: 403 }
      )
    }

    // Validate FPL Team ID format for regular users
    if (!isValidRealFPLTeamId(fplTeamId)) {
      return NextResponse.json(
        { error: 'Invalid FPL Team ID. Please enter a valid FPL team ID.' },
        { status: 400 }
      )
    }
    
    try {
            // Fetch data from FPL API
            const fplTeamData = await transformFPLTeamData(fplTeamId)
      
      // Get additional team details
            const fplTeamDetails = await getFPLTeam(fplTeamId)
      
      // Get current gameweek for additional context
            const currentGameweek = await getCurrentGameweek()
      
            // Update user with FPL team info
      await supabase
        .from('users')
        .update({
          fpl_team_id: fplTeamId,
          fpl_team_name: fplTeamData.teamName,
          last_active_at: new Date().toISOString()
        })
        .eq('id', userId)

      // Check if user team already exists
      const { data: existingTeam } = await supabase
        .from('user_teams')
        .select('*')
        .eq('user_id', userId)
        .eq('fpl_team_id', fplTeamId)
        .single()

      let userTeam
      if (existingTeam) {
        // Update existing team
        const { data: updatedTeam, error: updateError } = await supabase
          .from('user_teams')
          .update({
            team_name: fplTeamData.teamName,
            current_squad: fplTeamData.currentSquad,
            bank_value: fplTeamData.bankValue,
            team_value: fplTeamData.teamValue,
            total_points: fplTeamData.totalPoints,
            overall_rank: fplTeamData.overallRank,
            free_transfers: fplTeamData.freeTransfers,
            last_sync_at: new Date().toISOString(),
            sync_status: 'success',
          })
          .eq('id', existingTeam.id)
          .select()
          .single()

        if (updateError) throw updateError
        userTeam = updatedTeam
      } else {
        // Create new team
        const { data: newTeam, error: createError } = await supabase
          .from('user_teams')
          .insert({
            user_id: userId,
            fpl_team_id: fplTeamId,
            team_name: fplTeamData.teamName,
            current_squad: fplTeamData.currentSquad,
            bank_value: fplTeamData.bankValue,
            team_value: fplTeamData.teamValue,
            total_points: fplTeamData.totalPoints,
            overall_rank: fplTeamData.overallRank,
            free_transfers: fplTeamData.freeTransfers,
            sync_status: 'success',
          })
          .select()
          .single()

        if (createError) throw createError
        userTeam = newTeam
      }

      // Create team imported event
      await supabase
        .from('user_events')
        .insert({
          user_id: userId,
          event_type: 'team_imported',
          event_data: JSON.stringify({
            fplTeamId,
            teamName: fplTeamData.teamName,
            timestamp: new Date().toISOString(),
            source: 'fpl_api'
          })
        })

      // Add rate limit headers to successful responses
      return NextResponse.json(
        {
          message: 'Team imported successfully from FPL',
          team: userTeam,
          fplData: {
            teamName: fplTeamData.teamName,
            totalPoints: fplTeamData.totalPoints,
            overallRank: fplTeamData.overallRank,
            currentGameweek
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
      console.error(`[TEAM IMPORT] FPL API error occurred:`, {
        teamId: fplTeamId,
        userId: userId,
        errorMessage: fplError instanceof Error ? fplError.message : 'Unknown error',
        errorStack: fplError instanceof Error ? fplError.stack : 'No stack trace',
        timestamp: new Date().toISOString()
      })
      
      // Create sync failure event
      await supabase
        .from('user_events')
        .insert({
          user_id: userId,
          event_type: 'team_sync_failed',
          event_data: JSON.stringify({
            fplTeamId,
            error: fplError instanceof Error ? fplError.message : 'Unknown error',
            timestamp: new Date().toISOString()
          })
        })
      
      // Check if this is an invalid team ID error
      if (fplError instanceof Error &&
          (fplError.message.includes('404') ||
           fplError.message.includes('Not Found'))) {
        return NextResponse.json(
          { error: 'FPL Team ID not found. Please check your team ID and try again.' },
          { status: 404 }
        )
      }
      
      // Check if this is specifically an invalid team ID (not just API unavailability)
      if (fplError instanceof Error &&
          (fplError.message.includes('Invalid FPL Team ID') ||
           fplError.message.includes('team ID not found'))) {
        return NextResponse.json(
          { error: 'Invalid FPL Team ID. Please verify your team ID is correct.' },
          { status: 400 }
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
        { error: 'Failed to fetch data from FPL API. Please try again later.' },
        { status: 502 }
      )
    }
  } catch (error) {
    console.error('Team import error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
