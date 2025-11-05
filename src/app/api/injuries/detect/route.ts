import { NextRequest, NextResponse } from 'next/server'
import { getServerClient } from '@/lib/supabase'
import { 
  getFPLInjuries, 
  isInjuryNewOrUpdated, 
  getSignificantInjuries,
  InjuryInfo,
  InjurySeverity 
} from '@/lib/injury-scraper'

// Interface for database injury alert
interface InjuryAlert {
  id?: string
  playerId: number
  playerName: string
  playerTeam: number
  status: string
  news: string
  chanceOfPlayingNextRound: number
  chanceOfPlayingThisRound: number
  severity: InjurySeverity
  isActive: boolean
  resolvedAt?: string
  createdAt: string
  updatedAt: string
}

// Interface for user notification
interface UserNotification {
  id?: string
  userId: string
  type: 'injury_alert'
  title: string
  message: string
  data: any
  isRead: boolean
  createdAt: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getServerClient()
    
    // Fetch latest injuries from FPL API
    const fplInjuries = await getFPLInjuries()
    const significantInjuries = getSignificantInjuries(fplInjuries)
    
    // Get existing active injuries from database
    const { data: existingInjuries, error: fetchError } = await supabase
      .from('injury_alerts')
      .select('*')
      .eq('isActive', true)
    
    if (fetchError) {
      console.error('Error fetching existing injuries:', fetchError)
      throw fetchError
    }
    
    // Process each injury
    const newInjuries: InjuryInfo[] = []
    const updatedInjuries: InjuryInfo[] = []
    const resolvedInjuries: InjuryAlert[] = []
    
    // Find new and updated injuries
    for (const injury of significantInjuries) {
      const existingInjury = existingInjuries?.find(
        (existing: InjuryAlert) => existing.playerId === injury.playerId
      )
      
      if (!existingInjury) {
        newInjuries.push(injury)
      } else if (isInjuryNewOrUpdated(injury, existingInjuries as any)) {
        updatedInjuries.push(injury)
      }
    }
    
    // Find resolved injuries (injuries in DB but not in current FPL data)
    for (const existingInjury of existingInjuries || []) {
      const currentInjury = significantInjuries.find(
        injury => injury.playerId === existingInjury.playerId
      )
      
      if (!currentInjury) {
        resolvedInjuries.push(existingInjury)
      }
    }
    
    // Insert new injuries
    const insertedInjuries: InjuryAlert[] = []
    for (const injury of newInjuries) {
      const { data, error } = await supabase
        .from('injury_alerts')
        .insert({
          playerId: injury.playerId,
          playerName: injury.playerName,
          playerTeam: injury.playerTeam,
          status: injury.status,
          news: injury.news,
          chanceOfPlayingNextRound: injury.chanceOfPlayingNextRound,
          chanceOfPlayingThisRound: injury.chanceOfPlayingThisRound,
          severity: injury.severity,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) {
        console.error('Error inserting new injury:', error)
      } else {
        insertedInjuries.push(data)
      }
    }
    
    // Update existing injuries
    const updatedInjuryRecords: InjuryAlert[] = []
    for (const injury of updatedInjuries) {
      const { data, error } = await supabase
        .from('injury_alerts')
        .update({
          status: injury.status,
          news: injury.news,
          chanceOfPlayingNextRound: injury.chanceOfPlayingNextRound,
          chanceOfPlayingThisRound: injury.chanceOfPlayingThisRound,
          severity: injury.severity,
          updatedAt: new Date().toISOString()
        })
        .eq('playerId', injury.playerId)
        .select()
        .single()
      
      if (error) {
        console.error('Error updating injury:', error)
      } else {
        updatedInjuryRecords.push(data)
      }
    }
    
    // Mark resolved injuries as inactive
    for (const injury of resolvedInjuries) {
      await supabase
        .from('injury_alerts')
        .update({
          isActive: false,
          resolvedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .eq('id', injury.id)
    }
    
    // Notify users who own injured players
    const notificationsSent = await notifyAffectedUsers(
      [...insertedInjuries, ...updatedInjuryRecords],
      supabase
    )
    
    // Return statistics
    const stats = {
      totalInjuries: significantInjuries.length,
      newInjuries: newInjuries.length,
      updatedInjuries: updatedInjuries.length,
      resolvedInjuries: resolvedInjuries.length,
      notificationsSent
    }
    
    return NextResponse.json({
      success: true,
      message: 'Injury detection completed',
      stats
    })
  } catch (error) {
    console.error('Injury detection error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Notify users who own injured players
async function notifyAffectedUsers(
  injuries: InjuryAlert[],
  supabase: any
): Promise<number> {
  let notificationsSent = 0
  
  for (const injury of injuries) {
    try {
      // Find all users who have this player in their team
      const { data: userTeams, error: teamsError } = await supabase
        .from('user_teams')
        .select('userId, currentSquad')
        .eq('syncStatus', 'success')
      
      if (teamsError) {
        console.error('Error fetching user teams:', teamsError)
        continue
      }
      
      // Check each user's squad for the injured player
      for (const team of userTeams || []) {
        try {
          const squad = JSON.parse(team.currentSquad)
          
          // Check if player is in the squad
          if (squad.includes(injury.playerId)) {
            // Create notification for this user
            const notificationTitle = 'Injury Alert'
            const notificationMessage = `${injury.playerName} (${getSeverityLabel(injury.severity)})`
            
            await supabase
              .from('user_notifications')
              .insert({
                userId: team.userId,
                type: 'injury_alert',
                title: notificationTitle,
                message: notificationMessage,
                data: {
                  injuryId: injury.id,
                  playerId: injury.playerId,
                  playerName: injury.playerName,
                  severity: injury.severity,
                  news: injury.news,
                  chanceOfPlayingNextRound: injury.chanceOfPlayingNextRound
                },
                isRead: false,
                createdAt: new Date().toISOString()
              })
            
            notificationsSent++
          }
        } catch (parseError) {
          console.error('Error parsing squad data:', parseError)
        }
      }
    } catch (error) {
      console.error('Error notifying users for injury:', injury.playerId, error)
    }
  }
  
  return notificationsSent
}

// Get human-readable severity label
function getSeverityLabel(severity: InjurySeverity): string {
  switch (severity) {
    case InjurySeverity.LOW:
      return 'Doubtful'
    case InjurySeverity.MEDIUM:
      return '50/50'
    case InjurySeverity.HIGH:
      return 'Unlikely'
    case InjurySeverity.OUT:
      return 'Out'
    default:
      return 'Unknown'
  }
}

// GET endpoint to manually trigger injury detection
export async function GET(request: NextRequest) {
  try {
    // For manual triggering via GET request
    const response = await POST(request)
    return response
  } catch (error) {
    console.error('Manual injury detection error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}