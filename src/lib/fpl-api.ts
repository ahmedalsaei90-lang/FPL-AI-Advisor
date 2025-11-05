// FPL API Integration
// Official FPL API endpoint: https://fantasy.premierleague.com/api

const FPL_API_BASE_URL = 'https://fantasy.premierleague.com/api'

// Rate limiting: FPL API allows ~60 requests per minute
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 1000 // 1 second between requests

// Helper function to handle rate limiting
async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest))
  }
  
  lastRequestTime = Date.now()
  
  try {
        const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
        if (!response.ok) {
      const errorDetails = `FPL API error: ${response.status} ${response.statusText}`
      console.error(`Request failed: ${errorDetails}`)
      throw new Error(errorDetails)
    }
    
    return response
  } catch (error) {
    console.error(`Fetch error for URL ${url}:`, error)
    console.error(`Error details:`, {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      timestamp: new Date().toISOString()
    })
    throw error
  }
}

// TypeScript interfaces for FPL data structures
export interface FPLPlayer {
  id: number
  code: number
  first_name: string
  second_name: string
  web_name: string
  team: number
  team_code: number
  element_type: number
  now_cost: number
  event_points: number
  total_points: number
  minutes: number
  goals_scored: number
  assists: number
  clean_sheets: number
  goals_conceded: number
  own_goals: number
  penalties_saved: number
  penalties_missed: number
  yellow_cards: number
  red_cards: number
  saves: number
  bonus: number
  bps: number
  influence: string
  creativity: string
  threat: string
  ict_index: string
  form: string
  selected_by_percent: string
  transfers_in: number
  transfers_out: number
  transfers_in_event: number
  transfers_out_event: number
  price_change: number
  dreamteam_count: number
  in_dreamteam: boolean
  points_per_game: string
  status: string
  news: string
  chance_of_playing_next_round: number
  chance_of_playing_this_round: number
  value_form: string
  value_season: string
}

export interface FPLTeam {
  id: number
  name: string
  code: number
  short_name: string
  strength: number
  position: number
  played: number
  win: number
  draw: number
  loss: number
  points: number
  goal_difference: number
  goal_scored: number
  goal_conceded: number
  team_division: string
}

export interface FPLGameweek {
  id: number
  name: string
  deadline_time: string
  average_entry_score: number
  finished: boolean
  data_checked: boolean
  highest_scoring_entry: number
  highest_score: number
  is_previous: boolean
  is_current: boolean
  is_next: boolean
  deadline_time_epoch: number
  deadline_time_game_offset: number
  event: number
}

export interface FPLUserTeam {
  id: number
  name: string
  player_first_name: string
  player_last_name: string
  joined_time: string
  started_event: number
  favourite_team: number
  summary_overall_points: number
  summary_overall_rank: number
  summary_event_points: number
  summary_event_rank: number
  current_event: number
  last_deadline_total: number
  last_deadline_value: number
  last_deadline_bank: number
  league: {
    id: number
    name: string
    short_name: string
  }
}

export interface FPLPick {
  element: number
  position: number
  multiplier: number
  is_captain: boolean
  is_vice_captain: boolean
}

export interface FPLPicksResponse {
  active_chip: string | null
  automatic_subs: any[]
  entry_history: {
    event: number
    points: number
    total_points: number
    rank: number
    rank_sort: number
    overall_rank: number
    bank: number
    value: number
    event_transfers: number
    event_transfers_cost: number
    points_on_bench: number
  }
  picks: FPLPick[]
}

export interface FPLLeague {
  id: number
  name: string
  created: string
  closed: boolean
  rank: number
  max_entries: number
  league_type: string
  admin_entry: number
  start_event: number
  scoring: string
}

export interface FPLLeagueStandings {
  league: {
    id: number
    name: string
    short_name: string
  }
  new_entries: {
    has_next: boolean
    page: number
    results: any[]
  }
  standings: {
    has_next: boolean
    page: number
    results: Array<{
      entry: number
      entry_name: string
      player_name: string
      rank: number
      total: number
      event_total: number
      last_rank: number
      rank_sort: number
    }>
  }
}

export interface FPLBootstrapData {
  elements: FPLPlayer[]
  element_types: any[]
  events: FPLGameweek[]
  teams: FPLTeam[]
  game_settings: any
  phases: any[]
}

// Get all FPL static data (players, teams, gameweeks)
export async function getBootstrapData(): Promise<FPLBootstrapData> {
  const response = await rateLimitedFetch(`${FPL_API_BASE_URL}/bootstrap-static/`)
  return response.json()
}

// Get user's FPL team by ID
export async function getFPLTeam(teamId: number): Promise<FPLUserTeam> {
  const response = await rateLimitedFetch(`${FPL_API_BASE_URL}/entry/${teamId}/`)
  return response.json()
}

// Get user's current picks for a gameweek
export async function getFPLPicks(teamId: number, gameweek: number): Promise<FPLPicksResponse> {
  const response = await rateLimitedFetch(`${FPL_API_BASE_URL}/entry/${teamId}/event/${gameweek}/picks/`)
  return response.json()
}

// Get user's mini-leagues
export async function getFPLLeagues(teamId: number): Promise<FPLLeague[]> {
  const response = await rateLimitedFetch(`${FPL_API_BASE_URL}/entry/${teamId}/leagues-classic/`)
  const data = await response.json()
  return data.standings.results
}

// Get league standings
export async function getLeagueStandings(leagueId: number, page: number = 1): Promise<FPLLeagueStandings> {
  const response = await rateLimitedFetch(`${FPL_API_BASE_URL}/leagues-classic/${leagueId}/standings/?page_new_entries=1&page_standings=${page}`)
  return response.json()
}

// Get detailed league standings with all members (handles pagination)
export async function getDetailedLeagueStandings(leagueId: number, maxPages: number = 10): Promise<{
  league: {
    id: number
    name: string
    short_name: string
  }
  standings: Array<{
    entry: number
    entry_name: string
    player_name: string
    rank: number
    total: number
    event_total: number
    last_rank: number
    rank_sort: number
  }>
}> {
  try {
    let allStandings: any[] = []
    let currentPage = 1
    let hasMore = true

    while (hasMore && currentPage <= maxPages) {
      const response = await getLeagueStandings(leagueId, currentPage)
      
      // Add current page standings to our collection
      if (response.standings && response.standings.results) {
        allStandings = [...allStandings, ...response.standings.results]
      }
      
      // Check if there are more pages
      hasMore = response.standings?.has_next || false
      currentPage++
    }

    return {
      league: {
        id: leagueId,
        name: '', // Will be populated from the first response
        short_name: ''
      },
      standings: allStandings
    }
  } catch (error) {
    console.error('Error getting detailed league standings:', error)
    throw error
  }
}

// Import and transform mini-league data
export async function importMiniLeague(leagueId: number): Promise<{
  id: number
  name: string
  short_name: string
  created: string
  closed: boolean
  rank: number
  max_entries: number
  league_type: string
  admin_entry: number
  start_event: number
  scoring: string
  members: Array<{
    entry: number
    entry_name: string
    player_name: string
    rank: number
    total: number
    event_total: number
    last_rank: number
    rank_sort: number
  }>
}> {
  try {
    // Get first page to get league details
    const firstPage = await getLeagueStandings(leagueId, 1)
    
    // Get all standings with pagination
    const detailedStandings = await getDetailedLeagueStandings(leagueId)
    
    // Extract league info from the first page
    const leagueInfo = {
      id: leagueId,
      name: firstPage.league?.name || '',
      short_name: firstPage.league?.short_name || '',
      created: '', // Not available in standings response
      closed: false, // Not available in standings response
      rank: 0, // Not available in standings response
      max_entries: 0, // Not available in standings response
      league_type: 'classic', // Default assumption
      admin_entry: 0, // Not available in standings response
      start_event: 1, // Default assumption
      scoring: 'classic' // Default assumption
    }
    
    return {
      ...leagueInfo,
      members: detailedStandings.standings
    }
  } catch (error) {
    console.error('Error importing mini-league:', error)
    throw error
  }
}

// Get current gameweek
export async function getCurrentGameweek(): Promise<number | null> {
  try {
    const bootstrapData = await getBootstrapData()
    const currentGameweek = bootstrapData.events.find(event => event.is_current)
    return currentGameweek ? currentGameweek.id : null
  } catch (error) {
    console.error('Error getting current gameweek:', error)
    return null
  }
}

// Transform FPL data to our database format
export async function transformFPLTeamData(teamId: number): Promise<{
  fplTeamId: number
  teamName: string
  currentSquad: string
  bankValue: number
  teamValue: number
  totalPoints: number
  overallRank: number
  freeTransfers: number
}> {
  try {
        // Get user team data
        const userTeam = await getFPLTeam(teamId)
        // Get current gameweek
        const currentGameweek = await getCurrentGameweek()
        // Get picks for current gameweek if available
    let picks: FPLPick[] = []
    if (currentGameweek) {
      try {
                const picksResponse = await getFPLPicks(teamId, currentGameweek)
        picks = picksResponse.picks
              } catch (error) {
        console.error(`transformFPLTeamData: Error getting picks for current gameweek:`, error)
      }
    }
    
    // Transform data to our format
    const transformedData = {
      fplTeamId: userTeam.id,
      teamName: userTeam.name,
      currentSquad: JSON.stringify(picks.map(pick => pick.element)),
      bankValue: userTeam.last_deadline_bank / 10, // Convert from tenths of millions to millions
      teamValue: userTeam.last_deadline_value / 10, // Convert from tenths of millions to millions
      totalPoints: userTeam.summary_overall_points,
      overallRank: userTeam.summary_overall_rank,
      freeTransfers: 1 // Default value, would need to be calculated from transfer history
    }
    
    return transformedData
  } catch (error) {
    console.error(`transformFPLTeamData: Error occurred during transformation:`, {
      teamId,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : 'No stack trace',
      timestamp: new Date().toISOString()
    })
    throw error
  }
}

// Validate FPL Team ID format
export function isValidFPLTeamId(teamId: number): boolean {
  // FPL team IDs are positive integers
  return Number.isInteger(teamId) && teamId > 0 && teamId <= 10000000 // Reasonable upper bound
}

// Check if the team ID is a guest user ID (invalid ID used for guest accounts)
export function isGuestTeamId(teamId: number): boolean {
  // Guest users use the ID 999999 which is not a valid FPL team ID
  return teamId === 999999
}

// Enhanced validation that checks for both format validity and guest IDs
export function isValidRealFPLTeamId(teamId: number): boolean {
  return isValidFPLTeamId(teamId) && !isGuestTeamId(teamId)
}

// ===========================
// AI ADVISOR CONTEXT BUILDER
// ===========================

interface FPLFixture {
  id: number
  event: number
  team_h: number
  team_a: number
  team_h_difficulty: number
  team_a_difficulty: number
  kickoff_time: string
}

interface EnhancedPlayerData extends FPLPlayer {
  teamName: string
  teamShortName: string
  injuryStatus: string
  injuryNews: string
  upcomingFixtures: Array<{
    opponent: string
    isHome: boolean
    difficulty: number
    gameweek: number
  }>
}

interface AIContextData {
  currentGameweek: number
  nextGameweek: number
  season: string
  topPlayers: {
    forwards: EnhancedPlayerData[]
    midfielders: EnhancedPlayerData[]
    defenders: EnhancedPlayerData[]
    goalkeepers: EnhancedPlayerData[]
  }
  allFixtures: Array<{
    gameweek: number
    homeTeam: string
    awayTeam: string
    homeTeamId: number
    awayTeamId: number
    homeDifficulty: number
    awayDifficulty: number
    kickoffTime: string
  }>
  easyFixtures: Array<{
    gameweek: number
    team: string
    teamId: number
    opponent: string
    difficulty: number
    isHome: boolean
  }>
  teamDefensiveStats: Array<{
    teamId: number
    teamName: string
    goalsConceeded: number
    cleanSheets: number
    strength: number
  }>
  injuredPlayers: Array<{
    playerName: string
    team: string
    status: string
    news: string
  }>
}

// Cache bootstrap data for 10 minutes
let cachedBootstrap: { data: FPLBootstrapData; timestamp: number } | null = null
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

/**
 * Get cached or fresh bootstrap data
 */
async function getCachedBootstrapData(): Promise<FPLBootstrapData> {
  if (cachedBootstrap && Date.now() - cachedBootstrap.timestamp < CACHE_DURATION) {
        return cachedBootstrap.data
  }

    const data = await getBootstrapData()

  cachedBootstrap = {
    data,
    timestamp: Date.now()
  }

  return data
}

/**
 * Get AI context with comprehensive real-time FPL data for 2025/2026 season
 * Includes: player stats, injuries, fixtures, defensive analysis, and more
 */
export async function getFPLContextForAI(): Promise<AIContextData> {
  try {
    const bootstrapData = await getCachedBootstrapData()

    // Get current and next gameweek
    const currentGW = bootstrapData.events.find(e => e.is_current)
    const nextGW = bootstrapData.events.find(e => e.is_next)
    const currentGWNum = currentGW?.id || 1
    const nextGWNum = nextGW?.id || currentGWNum + 1

    // Get team by ID
    const getTeam = (teamId: number) => {
      return bootstrapData.teams.find(t => t.id === teamId)
    }

    // Fetch fixtures for next 5 gameweeks
    let allFixtures: FPLFixture[] = []
    try {
      // Fetch next 5 gameweeks
      for (let gw = nextGWNum; gw < nextGWNum + 5; gw++) {
        try {
          const fixturesUrl = `${FPL_API_BASE_URL}/fixtures/?event=${gw}`
          const response = await rateLimitedFetch(fixturesUrl)
          const gwFixtures = await response.json()
          allFixtures = [...allFixtures, ...gwFixtures]
        } catch (error) {
          console.error(`Failed to fetch fixtures for GW${gw}:`, error)
        }
      }
    } catch (error) {
      console.error('Failed to fetch fixtures:', error)
    }

    // Build comprehensive fixture data
    const fixtureData = allFixtures.map(f => {
      const homeTeam = getTeam(f.team_h)
      const awayTeam = getTeam(f.team_a)
      return {
        gameweek: f.event,
        homeTeam: homeTeam?.name || 'Unknown',
        awayTeam: awayTeam?.name || 'Unknown',
        homeTeamId: f.team_h,
        awayTeamId: f.team_a,
        homeDifficulty: f.team_h_difficulty,
        awayDifficulty: f.team_a_difficulty,
        kickoffTime: f.kickoff_time
      }
    })

    // Build team-specific fixture lookup for each player
    const getTeamFixtures = (teamId: number) => {
      return fixtureData
        .filter(f => f.homeTeamId === teamId || f.awayTeamId === teamId)
        .map(f => {
          const isHome = f.homeTeamId === teamId
          return {
            opponent: isHome ? f.awayTeam : f.homeTeam,
            isHome,
            difficulty: isHome ? f.homeDifficulty : f.awayDifficulty,
            gameweek: f.gameweek
          }
        })
        .slice(0, 5) // Next 5 fixtures
    }

    // Build team defensive stats
    const teamDefensiveStats = bootstrapData.teams.map(team => ({
      teamId: team.id,
      teamName: team.name,
      goalsConceeded: team.goal_conceded || 0,
      cleanSheets: bootstrapData.elements
        .filter(p => p.team === team.id && (p.element_type === 1 || p.element_type === 2))
        .reduce((sum, p) => sum + p.clean_sheets, 0),
      strength: team.strength || 0
    }))

    // Collect injured/doubtful players
    const injuredPlayers = bootstrapData.elements
      .filter(p => p.status !== 'a' && p.news) // 'a' = available
      .map(p => {
        const team = getTeam(p.team)
        return {
          playerName: p.web_name,
          team: team?.short_name || 'Unknown',
          status: p.status,
          news: p.news
        }
      })

    // Enhanced player filtering with better criteria
    const availablePlayers = bootstrapData.elements.filter(p => {
      const chanceToPlay = p.chance_of_playing_next_round
      const isAvailable = chanceToPlay === null || chanceToPlay >= 75
      const hasPlayedEnough = parseInt(p.minutes.toString()) > 100
      return isAvailable && hasPlayedEnough
    })

    // Enhanced sorting with position-specific logic
    const sortPlayersByPosition = (players: FPLPlayer[], positionType: number) => {
      return players.sort((a, b) => {
        const formA = parseFloat(a.form) || 0
        const formB = parseFloat(b.form) || 0
        const ppgA = parseFloat(a.points_per_game) || 0
        const ppgB = parseFloat(b.points_per_game) || 0

        // For defenders/goalkeepers, also consider clean sheets
        if (positionType === 1 || positionType === 2) {
          if (a.clean_sheets !== b.clean_sheets) {
            return b.clean_sheets - a.clean_sheets
          }
        }

        // For attackers/midfielders, prioritize goals + assists
        if (positionType === 3 || positionType === 4) {
          const attackingA = a.goals_scored + a.assists
          const attackingB = b.goals_scored + b.assists
          if (attackingA !== attackingB) {
            return attackingB - attackingA
          }
        }

        // Then prioritize form, PPG, and total points
        if (formA !== formB) return formB - formA
        if (ppgA !== ppgB) return ppgB - ppgA
        return b.total_points - a.total_points
      })
    }

    // Enhance players with additional data
    const enhancePlayers = (players: FPLPlayer[]): EnhancedPlayerData[] => {
      return players.map(p => {
        const team = getTeam(p.team)
        return {
          ...p,
          teamName: team?.name || 'Unknown',
          teamShortName: team?.short_name || 'UNK',
          injuryStatus: p.status === 'a' ? 'Available' : p.status === 'd' ? 'Doubtful' : p.status === 'i' ? 'Injured' : 'Unavailable',
          injuryNews: p.news || 'No news',
          upcomingFixtures: getTeamFixtures(p.team)
        }
      })
    }

    // Get top 5 players by position (changed from 10 to 5)
    const getTopByPosition = (positionType: number, limit: number = 5) => {
      const players = availablePlayers.filter(p => p.element_type === positionType)
      const sorted = sortPlayersByPosition(players, positionType)
      return enhancePlayers(sorted.slice(0, limit))
    }

    // Build easy fixtures list (difficulty <= 2) with team IDs
    const easyFixtures = allFixtures.flatMap(f => [
      {
        gameweek: f.event,
        team: getTeam(f.team_h)?.name || 'Unknown',
        teamId: f.team_h,
        opponent: getTeam(f.team_a)?.name || 'Unknown',
        difficulty: f.team_h_difficulty,
        isHome: true
      },
      {
        gameweek: f.event,
        team: getTeam(f.team_a)?.name || 'Unknown',
        teamId: f.team_a,
        opponent: getTeam(f.team_h)?.name || 'Unknown',
        difficulty: f.team_a_difficulty,
        isHome: false
      }
    ]).filter(f => f.difficulty <= 2).slice(0, 20) // Increased to 20 for better coverage

    // Determine current season
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1 // 1-12
    const season = month >= 8 ? `${year}/${year + 1}` : `${year - 1}/${year}`

        return {
      currentGameweek: currentGWNum,
      nextGameweek: nextGWNum,
      season,
      topPlayers: {
        forwards: getTopByPosition(4, 5),
        midfielders: getTopByPosition(3, 5),
        defenders: getTopByPosition(2, 5),
        goalkeepers: getTopByPosition(1, 5)
      },
      allFixtures: fixtureData,
      easyFixtures,
      teamDefensiveStats,
      injuredPlayers
    }
  } catch (error) {
    console.error('Failed to build AI context:', error)
    throw new Error('Failed to fetch FPL data. Please try again.')
  }
}

/**
 * Build comprehensive AI system prompt with real-time FPL data
 * Includes: player stats, injuries, fixtures, defensive analysis, triple captain advice
 */
export function buildAIPromptWithFPLData(contextData: AIContextData, userTeamData?: any): string {
  const { topPlayers, easyFixtures, allFixtures, teamDefensiveStats, injuredPlayers, season, currentGameweek, nextGameweek } = contextData

  // Format enhanced player data with comprehensive stats
  const formatEnhancedPlayer = (p: EnhancedPlayerData) => {
    const fixturesStr = p.upcomingFixtures
      .slice(0, 3)
      .map(f => `GW${f.gameweek}: ${f.isHome ? 'vs' : '@'} ${f.opponent} (${f.difficulty}/5)`)
      .join(', ')

    let statsStr = `${p.total_points}pts, Form: ${p.form}, PPG: ${p.points_per_game}`

    // Add position-specific stats
    if (p.element_type === 4) { // Forwards
      statsStr += `, ${p.goals_scored}G ${p.assists}A`
    } else if (p.element_type === 3) { // Midfielders
      statsStr += `, ${p.goals_scored}G ${p.assists}A`
    } else if (p.element_type === 2) { // Defenders
      statsStr += `, ${p.clean_sheets}CS, ${p.goals_scored}G ${p.assists}A`
    } else if (p.element_type === 1) { // Goalkeepers
      statsStr += `, ${p.clean_sheets}CS, ${p.saves} saves`
    }

    return `- ${p.web_name} (${p.teamShortName}): ${statsStr}, £${(p.now_cost / 10).toFixed(1)}m, ${p.selected_by_percent}% owned
     Status: ${p.injuryStatus} ${p.injuryNews !== 'No news' ? '- ' + p.injuryNews : ''}
     Next 3 Fixtures: ${fixturesStr || 'No fixtures data'}`
  }

  // Format top 5 players by position
  const formatTop5ByPosition = (players: EnhancedPlayerData[]) => {
    return players.slice(0, 5).map(formatEnhancedPlayer).join('\n\n')
  }

  // Format easy fixtures with team info
  const easyFixturesList = easyFixtures
    .slice(0, 15)
    .map(f => `- GW${f.gameweek}: ${f.team} ${f.isHome ? 'vs' : '@'} ${f.opponent} (Difficulty: ${f.difficulty}/5)`)
    .join('\n')

  // Format injured/doubtful players
  const injuryList = injuredPlayers
    .slice(0, 15)
    .map(p => `- ${p.playerName} (${p.team}): ${p.status === 'd' ? 'Doubtful' : p.status === 'i' ? 'Injured' : 'Unavailable'} - ${p.news}`)
    .join('\n')

  // Format team defensive weaknesses (worst defenses = good attacking targets)
  const weakDefenses = teamDefensiveStats
    .sort((a, b) => b.goalsConceeded - a.goalsConceeded)
    .slice(0, 10)
    .map(t => `- ${t.teamName}: ${t.goalsConceeded} goals conceded (Target for attackers/midfielders)`)
    .join('\n')

  // Format team strong defenses (best for clean sheets)
  const strongDefenses = teamDefensiveStats
    .sort((a, b) => a.goalsConceeded - b.goalsConceeded)
    .slice(0, 10)
    .map(t => `- ${t.teamName}: ${t.goalsConceeded} goals conceded (Good for defenders/GKs)`)
    .join('\n')

  // Identify triple captain candidates (players with double gameweeks or great fixtures)
  const tripleCaptainCandidates = topPlayers.forwards
    .concat(topPlayers.midfielders)
    .filter(p => {
      // Check if player has easy fixtures in next 3 gameweeks
      const easyUpcoming = p.upcomingFixtures.filter(f => f.difficulty <= 2).length
      const formValue = parseFloat(p.form) || 0
      return easyUpcoming >= 2 && formValue >= 6
    })
    .slice(0, 5)
    .map(p => {
      const fixturesStr = p.upcomingFixtures
        .slice(0, 3)
        .map(f => `GW${f.gameweek}: ${f.isHome ? 'vs' : '@'} ${f.opponent} (${f.difficulty}/5)`)
        .join(', ')
      return `- ${p.web_name} (${p.teamShortName}): Form ${p.form}, ${p.total_points}pts - Fixtures: ${fixturesStr}`
    })
    .join('\n')

  const teamInfo = userTeamData ? `
CURRENT TEAM: ${userTeamData.teamName || 'No team'}
Team Value: £${userTeamData.teamValue || 0}m
Bank: £${userTeamData.bankValue || 0}m
Free Transfers: ${userTeamData.freeTransfers || 0}
Total Points: ${userTeamData.totalPoints || 0}
Overall Rank: ${userTeamData.overallRank || 'N/A'}
` : 'No team data available'

  return `You are an expert Fantasy Premier League (FPL) advisor with COMPREHENSIVE REAL-TIME access to current ${season} season data.

==================================================
📅 SEASON: ${season} | CURRENT: GAMEWEEK ${currentGameweek} | NEXT: GAMEWEEK ${nextGameweek}
==================================================

${teamInfo}

==================================================
🔥 TOP 5 IN-FORM PLAYERS BY POSITION (${season} - ONLY RECOMMEND THESE PLAYERS)
==================================================

🎯 TOP 5 FORWARDS:
${formatTop5ByPosition(topPlayers.forwards)}

⚡ TOP 5 MIDFIELDERS:
${formatTop5ByPosition(topPlayers.midfielders)}

🛡️ TOP 5 DEFENDERS:
${formatTop5ByPosition(topPlayers.defenders)}

🧤 TOP 5 GOALKEEPERS:
${formatTop5ByPosition(topPlayers.goalkeepers)}

==================================================
📊 FIXTURE & TEAM ANALYSIS
==================================================

✅ EASY UPCOMING FIXTURES (Difficulty 1-2):
${easyFixturesList || 'No easy fixtures currently'}

⚠️ INJURY & TEAM NEWS:
${injuryList || 'No major injuries reported'}

🎯 WEAK DEFENSES TO TARGET (For attacking players):
${weakDefenses}

🛡️ STRONG DEFENSES (For clean sheet potential):
${strongDefenses}

🌟 TRIPLE CAPTAIN CANDIDATES (Best fixtures ahead):
${tripleCaptainCandidates || 'Check players with multiple easy fixtures'}

==================================================
⚠️ CRITICAL INSTRUCTIONS - YOU MUST FOLLOW THESE
==================================================

**PLAYER RECOMMENDATIONS:**
1. ✅ **ONLY recommend players from the TOP 5 lists above**
2. ✅ **When asked for "best 5 choices", list exactly 5 players from the relevant position**
3. ❌ **NEVER suggest players not in the lists** - If asked about unlisted player, say: "I don't have current data for that player. Here are the top 5 alternatives from ${season}..."
4. ❌ **NEVER invent player names, stats, or fixture data**
5. ✅ **Always reference exact stats shown** (goals, assists, clean sheets, form, PPG)

**INJURY & AVAILABILITY:**
1. ✅ **Check injury status and news for every recommended player**
2. ✅ **Warn users about doubtful/injured players**
3. ✅ **Reference the "Injury & Team News" section**
4. ✅ **Consider chance to play when recommending**

**FIXTURE ANALYSIS:**
1. ✅ **Analyze next 3-5 fixtures for recommended players**
2. ✅ **Use difficulty ratings (1=easiest, 5=hardest)**
3. ✅ **Consider home/away status**
4. ✅ **Recommend defenders/GKs facing weak attacks**
5. ✅ **Recommend attackers facing weak defenses**

**DEFENSIVE STATS:**
1. ✅ **For defenders/goalkeepers: Prioritize clean sheets and strong defenses**
2. ✅ **Reference team goals conceded from "Strong Defenses" list**
3. ✅ **Warn about defenders from leaky defenses**
4. ✅ **Consider attacking returns (goals/assists) for defenders**

**ATTACKING STATS:**
1. ✅ **For forwards/midfielders: Prioritize goals + assists**
2. ✅ **Check recent form and upcoming opponents**
3. ✅ **Target players facing weak defenses (high goals conceded)**
4. ✅ **Consider ownership % for differential picks**

**TRIPLE CAPTAIN ADVICE:**
1. ✅ **ONLY recommend from "Triple Captain Candidates" list**
2. ✅ **Explain fixture difficulty for next 3 gameweeks**
3. ✅ **Consider form, points potential, and consistency**
4. ✅ **Warn about rotation risk for heavily-used players**

**MANAGER RECOMMENDATIONS:**
1. ✅ **When suggesting transfers, identify teams with best fixtures**
2. ✅ **Recommend doubling up on defenses with easy fixtures (2 players from same team)**
3. ✅ **Consider budget constraints and value for money**

**RESPONSE FORMAT:**
1. Start with direct answer to user's question
2. List **exactly 5 players** if asked for "top 5" or "best 5"
3. Include for each player:
   - Name, team, position
   - Key stats (goals, assists, clean sheets, form)
   - Next 2-3 fixtures with difficulty
   - Injury status if relevant
   - Price and ownership
4. Explain WHY each player is recommended
5. End with clear actionable advice

**IMPORTANT RULES:**
- ✅ Current gameweek: GW${currentGameweek}
- ✅ All data is from ${season} season ONLY
- ✅ Budget: Mention prices (£m) and value
- ✅ Transfers: Warn about -4 point hits for extra transfers
- ✅ Focus on next 1-3 gameweeks primarily
- ✅ Be honest if data is limited or unavailable
- ❌ Never hallucinate or guess stats
- ❌ Never suggest players from past seasons

==================================================
🎯 YOUR GOAL
==================================================
Provide SPECIFIC, DATA-DRIVEN advice using ONLY the information above. Users trust you to give accurate recommendations for the CURRENT ${season} season based on REAL stats, injuries, and fixtures.

When in doubt, refer back to the TOP 5 lists and the fixture/team analysis sections above.`
}