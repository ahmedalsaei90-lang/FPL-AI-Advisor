import { getBootstrapData, FPLPlayer } from './fpl-api'

// Injury severity levels
export enum InjurySeverity {
  LOW = 'low',      // 75-100% chance of playing
  MEDIUM = 'medium', // 50-75% chance of playing
  HIGH = 'high',    // 25-50% chance of playing
  OUT = 'out'       // 0-25% chance of playing
}

// Injury information structure
export interface InjuryInfo {
  playerId: number
  playerName: string
  playerTeam: number
  status: string
  news: string
  chanceOfPlayingNextRound: number
  chanceOfPlayingThisRound: number
  severity: InjurySeverity
  timestamp: Date
}

// Get injury data from official FPL API
export async function getFPLInjuries(): Promise<InjuryInfo[]> {
  try {
    const bootstrapData = await getBootstrapData()
    const injuries: InjuryInfo[] = []
    
    // Process all players to find injured ones
    for (const player of bootstrapData.elements) {
      // Check if player has any injury concerns
      if (player.status !== 'a' || player.news || 
          player.chance_of_playing_next_round < 100 || 
          player.chance_of_playing_this_round < 100) {
        
        const injuryInfo: InjuryInfo = {
          playerId: player.id,
          playerName: `${player.first_name} ${player.second_name}`,
          playerTeam: player.team,
          status: player.status,
          news: player.news || '',
          chanceOfPlayingNextRound: player.chance_of_playing_next_round || 100,
          chanceOfPlayingThisRound: player.chance_of_playing_this_round || 100,
          severity: getSeverityFromChance(
            player.chance_of_playing_next_round || 100,
            player.chance_of_playing_this_round || 100
          ),
          timestamp: new Date()
        }
        
        injuries.push(injuryInfo)
      }
    }
    
    return injuries
  } catch (error) {
    console.error('Error fetching FPL injury data:', error)
    throw error
  }
}

// Match player name to FPL ID
export async function matchPlayerToFPLId(playerName: string): Promise<number | null> {
  try {
    const bootstrapData = await getBootstrapData()
    
    // Try exact match first
    let player = bootstrapData.elements.find(p => 
      p.web_name.toLowerCase() === playerName.toLowerCase() ||
      `${p.first_name} ${p.second_name}`.toLowerCase() === playerName.toLowerCase()
    )
    
    // If no exact match, try partial match
    if (!player) {
      const searchName = playerName.toLowerCase()
      player = bootstrapData.elements.find(p => 
        p.web_name.toLowerCase().includes(searchName) ||
        `${p.first_name} ${p.second_name}`.toLowerCase().includes(searchName) ||
        p.first_name.toLowerCase().includes(searchName) ||
        p.second_name.toLowerCase().includes(searchName)
      )
    }
    
    return player ? player.id : null
  } catch (error) {
    console.error('Error matching player to FPL ID:', error)
    return null
  }
}

// Convert chance of playing to severity level
export function getSeverityFromChance(chanceNextRound: number, chanceThisRound: number): InjurySeverity {
  // Use the lower of the two chances as the primary indicator
  const lowerChance = Math.min(chanceNextRound, chanceThisRound)
  
  if (lowerChance >= 75) {
    return InjurySeverity.LOW
  } else if (lowerChance >= 50) {
    return InjurySeverity.MEDIUM
  } else if (lowerChance >= 25) {
    return InjurySeverity.HIGH
  } else {
    return InjurySeverity.OUT
  }
}

// Check if an injury is new or updated compared to existing data
export function isInjuryNewOrUpdated(newInjury: InjuryInfo, existingInjuries: InjuryInfo[]): boolean {
  const existingInjury = existingInjuries.find(injury => injury.playerId === newInjury.playerId)
  
  if (!existingInjury) {
    return true // New injury
  }
  
  // Check if injury status has changed
  return (
    existingInjury.status !== newInjury.status ||
    existingInjury.news !== newInjury.news ||
    existingInjury.chanceOfPlayingNextRound !== newInjury.chanceOfPlayingNextRound ||
    existingInjury.chanceOfPlayingThisRound !== newInjury.chanceOfPlayingThisRound ||
    existingInjury.severity !== newInjury.severity
  )
}

// Filter injuries by severity
export function filterInjuriesBySeverity(injuries: InjuryInfo[], severity: InjurySeverity): InjuryInfo[] {
  return injuries.filter(injury => injury.severity === severity)
}

// Get only significant injuries (medium severity or higher)
export function getSignificantInjuries(injuries: InjuryInfo[]): InjuryInfo[] {
  return injuries.filter(injury => 
    injury.severity === InjurySeverity.MEDIUM ||
    injury.severity === InjurySeverity.HIGH ||
    injury.severity === InjurySeverity.OUT
  )
}