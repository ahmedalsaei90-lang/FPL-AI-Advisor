'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Header } from '@/components/header'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { useAuth } from '@/components/auth/auth-provider-client'
import { ThemeBackground } from '@/components/layout/theme-background'
import { authenticatedGet } from '@/lib/api-client'
import {
  Users,
  Target,
  RefreshCw,
  Loader2,
  Shirt
} from 'lucide-react'

interface Player {
  id: number
  name: string
  position: string
  team: string
  cost: number
  points: number
  form: number
  selectedBy: number
}

interface TeamData {
  fplTeamId: number
  teamName: string
  currentSquad: Player[]
  bankValue: number
  teamValue: number
  totalPoints: number
  overallRank: number
  freeTransfers: number
}

export default function TeamPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [teamData, setTeamData] = useState<TeamData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (!user) {
      return
    }

    // Load team data (will show empty state if no team connected)
    loadTeamData(user.id)
  }, [router, user])

  const loadTeamData = async (userId: string) => {
    try {
      // Use authenticated API call - userId is extracted from JWT token on server
      const response = await authenticatedGet('/api/team/data')
      const data = await response.json()

      if (!response.ok) {
        // If no team data found (404), set teamData to null but don't throw error
        // This allows us to show a helpful message instead of crashing
        if (response.status === 404) {
          setTeamData(null)
          return
        }
        throw new Error(data.error || 'Failed to load team data')
      }

      setTeamData(data)
    } catch (error: any) {
      console.error('Team data error:', error)
      setTeamData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    if (!user) return
    
    setRefreshing(true)
    await loadTeamData(user.id)
    setRefreshing(false)
  }

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'GK': return 'bg-green-100 text-green-800'
      case 'DEF': return 'bg-blue-100 text-blue-800'
      case 'MID': return 'bg-yellow-100 text-yellow-800'
      case 'FWD': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getFormColor = (form: number) => {
    if (form >= 7) return 'text-green-600'
    if (form >= 4) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <ThemeBackground contentClassName="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </ThemeBackground>
    )
  }

  return (
    <AuthGuard>
      <ThemeBackground>
        <Header currentPage="My Team" />

      {!teamData ? (
        <div className="container mx-auto px-4 py-6">
          <Card className="bg-glass-strong border-primary/30 shadow-glow-blue max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-black text-center">
                <span className="text-gradient-primary">No Team Data Found</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-foreground/80 text-lg">
                {user?.isGuest
                  ? "Guest users don't have FPL team data. Create an account and import your team to view detailed statistics."
                  : "You haven't imported your FPL team yet. Import your team to view detailed statistics and get personalized advice."}
              </p>
              <div className="flex gap-4 justify-center mt-6">
                <Link href="/dashboard">
                  <Button className="bg-gradient-primary hover:shadow-glow-blue transition-all duration-300 font-bold">
                    <Shirt className="mr-2 h-5 w-5" />
                    {user?.isGuest ? 'Go to Dashboard' : 'Import Team'}
                  </Button>
                </Link>
                {!user?.isGuest && (
                  <Link href="/advisor">
                    <Button variant="outline" className="border-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground transition-all duration-300 font-bold">
                      Get AI Advice
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-6">
          {/* Team Overview */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-glass-strong border-primary/30 shadow-glow-blue">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{teamData.teamName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Team ID:</span>
                    <span className="font-medium">{teamData.fplTeamId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Points:</span>
                    <span className="font-medium text-lg">{teamData.totalPoints}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-glass-strong border-primary/30 shadow-glow-blue">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Finances</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Team Value</span>
                      <span>£{teamData.teamValue}m</span>
                    </div>
                    <Progress value={(teamData.teamValue / 105) * 100} className="h-2" />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bank:</span>
                    <span className="font-medium">£{teamData.bankValue}m</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-glass-strong border-primary/30 shadow-glow-blue">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Rank</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Overall:</span>
                    <span className="font-medium">#{teamData.overallRank.toLocaleString()}</span>
                  </div>
                  <Badge variant="secondary" className="w-full justify-center">
                    Top {Math.round((teamData.overallRank / 8000000) * 100)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-glass-strong border-primary/30 shadow-glow-blue">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Transfers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Free:</span>
                    <span className="font-medium">{teamData.freeTransfers}</span>
                  </div>
                  <Link href="/advisor">
                    <Button className="w-full" size="sm">
                      <Target className="mr-2 h-4 w-4" />
                      Get Advice
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Squad */}
          <Card className="bg-glass-strong border-primary/30 shadow-glow-blue">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Current Squad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {teamData.currentSquad.map((player) => (
                  <div
                    key={player.id}
                    className="bg-glass border border-primary/20 rounded-xl p-4 hover:shadow-glow-blue transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{player.name}</h3>
                        <p className="text-sm text-gray-600">{player.team}</p>
                      </div>
                      <Badge className={getPositionColor(player.position)}>
                        {player.position}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Cost:</span>
                        <span className="ml-1 font-medium">£{player.cost}m</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Points:</span>
                        <span className="ml-1 font-medium">{player.points}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Form:</span>
                        <span className={`ml-1 font-medium ${getFormColor(player.form)}`}>
                          {player.form}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Owned:</span>
                        <span className="ml-1 font-medium">{player.selectedBy}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      </ThemeBackground>
    </AuthGuard>
  )
}
