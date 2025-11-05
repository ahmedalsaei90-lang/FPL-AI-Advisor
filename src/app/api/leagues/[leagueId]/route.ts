import { NextRequest, NextResponse } from 'next/server'
import { getServerClient } from '@/lib/supabase'
import { z } from 'zod'

const leagueParamsSchema = z.object({
  leagueId: z.string().transform((val) => parseInt(val, 10))
})

const searchParamsSchema = z.object({
  userId: z.string().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { leagueId: string } }
) {
  try {
    const { leagueId } = leagueParamsSchema.parse(params)
    const { searchParams } = new URL(request.url)
    const { userId } = searchParamsSchema.parse(Object.fromEntries(searchParams))

    const supabase = getServerClient()

    // Get league details by FPL league ID
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .select('*')
      .eq('fpl_league_id', leagueId)
      .single()

    if (leagueError || !league) {
      return NextResponse.json(
        { error: 'League not found' },
        { status: 404 }
      )
    }

    // Get total member count
    const { count: memberCount } = await supabase
      .from('league_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('league_id', league.id)

    // Verify user has access to this league if userId provided
    if (userId) {
      const { data: membership } = await supabase
        .from('league_memberships')
        .select('*')
        .eq('league_id', league.id)
        .eq('user_id', userId)
        .single()

      if (!membership) {
        return NextResponse.json(
          { error: 'You are not a member of this league' },
          { status: 403 }
        )
      }
    }

    // Get all league members with their details
    const { data: memberships, error: membershipsError } = await supabase
      .from('league_memberships')
      .select('*')
      .eq('league_id', league.id)
      .order('joined_at', { ascending: true })

    if (membershipsError) {
      console.error('Error fetching league members:', membershipsError)
      return NextResponse.json(
        { error: 'Failed to fetch league members' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      league: {
        id: league.fpl_league_id,
        dbId: league.id,
        name: league.league_name,
        type: league.league_type,
        memberCount: memberCount || 0,
        createdAt: league.created_at,
        updatedAt: league.updated_at
      },
      members: (memberships || []).map(member => ({
        userId: member.user_id,
        fplTeamId: member.fpl_team_id,
        teamName: member.team_name,
        joinedAt: member.joined_at
      }))
    })
  } catch (error) {
    console.error('League fetch error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid league ID', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { leagueId: string } }
) {
  try {
    const { leagueId } = leagueParamsSchema.parse(params)
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      )
    }

    const supabase = getServerClient()

    // Get league by FPL league ID
    const { data: league } = await supabase
      .from('leagues')
      .select('*')
      .eq('fpl_league_id', leagueId)
      .single()

    if (!league) {
      return NextResponse.json(
        { error: 'League not found' },
        { status: 404 }
      )
    }

    // Check if user is a member of this league
    const { data: membership } = await supabase
      .from('league_memberships')
      .select('*')
      .eq('league_id', league.id)
      .eq('user_id', userId)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'You are not a member of this league' },
        { status: 404 }
      )
    }

    // Remove user's membership (this does not delete the league, just removes the user)
    const { error: deleteError } = await supabase
      .from('league_memberships')
      .delete()
      .eq('league_id', league.id)
      .eq('user_id', userId)

    if (deleteError) throw deleteError

    // Create event for leaving league
    await supabase
      .from('user_events')
      .insert({
        user_id: userId,
        event_type: 'league_left',
        event_data: JSON.stringify({
          league_id: leagueId,
          league_name: league.league_name,
          timestamp: new Date().toISOString()
        })
      })

    return NextResponse.json({
      message: 'Successfully left the league'
    })
  } catch (error) {
    console.error('League deletion error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid league ID', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
