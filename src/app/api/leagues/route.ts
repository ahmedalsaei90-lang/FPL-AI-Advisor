import { NextRequest, NextResponse } from 'next/server'
import { getServerClient } from '@/lib/supabase'
import { authenticateRequest } from '@/lib/auth-middleware'
import { z } from 'zod'

const searchParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10)
})

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

    const { searchParams } = new URL(request.url)
    const { page, limit } = searchParamsSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit')
    })

    const supabase = getServerClient()

    // Calculate pagination
    const offset = (page - 1) * limit

    // Get user's league memberships with joined league data
    const { data: memberships, error: membershipsError, count } = await supabase
      .from('league_memberships')
      .select(`
        league_id,
        joined_at,
        leagues (
          id,
          fpl_league_id,
          league_name,
          league_type,
          created_at,
          updated_at
        )
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('joined_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (membershipsError) {
      console.error('Error fetching user leagues:', membershipsError)
      return NextResponse.json(
        { error: 'Failed to fetch leagues' },
        { status: 500 }
      )
    }

    // Get member counts for each league
    const leagueIds = memberships?.map(m => m.league_id) || []
    const memberCountsPromises = leagueIds.map(async (leagueId) => {
      const { count } = await supabase
        .from('league_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('league_id', leagueId)
      return { leagueId, count: count || 0 }
    })

    const memberCountsResults = await Promise.all(memberCountsPromises)
    const memberCountMap: Record<string, number> = {}
    memberCountsResults.forEach(({ leagueId, count }) => {
      memberCountMap[leagueId] = count
    })

    // Transform leagues data with member counts
    const leaguesWithCounts = memberships?.map(membership => {
      const league = membership.leagues as any
      return {
        id: league?.fpl_league_id || 0,
        name: league?.league_name || 'Unknown League',
        type: league?.league_type || 'classic',
        memberCount: memberCountMap[membership.league_id] || 0,
        lastSyncedAt: league?.updated_at || null,
        syncStatus: 'success',
        createdAt: membership.joined_at
      }
    }) || []

    // Calculate pagination info
    const totalPages = count ? Math.ceil(count / limit) : 0
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      leagues: leaguesWithCounts,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count || 0,
        itemsPerPage: limit,
        hasNextPage,
        hasPrevPage
      }
    })
  } catch (error) {
    console.error('Leagues fetch error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST method removed - use /api/leagues/import instead for creating leagues from FPL data
