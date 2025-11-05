import { NextRequest, NextResponse } from 'next/server'
import { getServerClient } from '@/lib/supabase'
import { authenticateRequest } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request - extract userId from JWT token
    const auth = await authenticateRequest(request)

    if (!auth.success || !auth.user) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = auth.user.id
    const supabase = getServerClient()

    const { data: userTeam, error } = await supabase
      .from('user_teams')
      .select('*')
      .eq('user_id', userId)
      .eq('sync_status', 'success')
      .order('last_sync_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    if (!userTeam) {
      return NextResponse.json(
        { error: 'No team data found' },
        { status: 404 }
      )
    }

    // Parse the squad data with error handling
    let currentSquad
    try {
      currentSquad = typeof userTeam.current_squad === 'string'
        ? JSON.parse(userTeam.current_squad)
        : userTeam.current_squad
    } catch (parseError) {
      console.error('Team data JSON parse error:', parseError)
      currentSquad = []
    }

    // Return formatted team data
    const teamData = {
      fplTeamId: userTeam.fpl_team_id,
      teamName: userTeam.team_name,
      currentSquad,
      bankValue: userTeam.bank_value,
      teamValue: userTeam.team_value,
      totalPoints: userTeam.total_points,
      overallRank: userTeam.overall_rank,
      freeTransfers: userTeam.free_transfers
    }

    return NextResponse.json(teamData)
  } catch (error) {
    console.error('Team data error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
