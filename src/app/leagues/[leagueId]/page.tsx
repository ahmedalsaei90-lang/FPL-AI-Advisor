'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Header } from '@/components/header'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { useAuth } from '@/components/auth/auth-provider-client'
import { ThemeBackground } from '@/components/layout/theme-background'
import {
  ArrowLeft,
  Trophy,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Loader2,
  Medal,
  Award,
  Star
} from 'lucide-react'

interface LeagueMember {
  entryId: number
  entryName: string
  playerName: string
  rank: number
  totalPoints: number
  eventPoints: number
  lastRank: number
  rankSort: number
}

interface LeagueData {
  league: {
    id: number
    name: string
    type: string
    memberCount: number
    lastSyncedAt: string
    syncStatus: string
  }
  members: LeagueMember[]
}

export default function LeagueDetailPage() {
  const router = useRouter()
  const params = useParams()
  const leagueId = params.leagueId as string
  
  const { user } = useAuth()
  const [leagueData, setLeagueData] = useState<LeagueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      return
    }
    
    // Load league data
    loadLeagueData(user.id)
  }, [router, leagueId, user])

  const loadLeagueData = async (userId: string) => {
    try {
      const response = await fetch(`/api/leagues/${leagueId}?userId=${userId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load league data')
      }

      setLeagueData(data)
    } catch (error: any) {
      console.error('League data error:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    if (!user) return
    
    setRefreshing(true)
    await loadLeagueData(user.id)
    setRefreshing(false)
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-500" />
    if (rank === 2) return <Medal className="h-4 w-4 text-gray-400" />
    if (rank === 3) return <Award className="h-4 w-4 text-amber-600" />
    return <span className="text-sm font-medium text-gray-600">#{rank}</span>
  }

  const getRankChange = (currentRank: number, lastRank: number) => {
    if (lastRank === 0) return <Minus className="h-4 w-4 text-gray-400" />
    
    const change = lastRank - currentRank
    if (change > 0) {
      return (
        <div className="flex items-center text-green-600">
          <TrendingUp className="h-4 w-4 mr-1" />
          <span className="text-sm">+{change}</span>
        </div>
      )
    } else if (change < 0) {
      return (
        <div className="flex items-center text-red-600">
          <TrendingDown className="h-4 w-4 mr-1" />
          <span className="text-sm">{change}</span>
        </div>
      )
    }
    return <Minus className="h-4 w-4 text-gray-400" />
  }

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <ThemeBackground contentClassName="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </ThemeBackground>
    )
  }

  if (error) {
    return (
      <ThemeBackground>
        <Header currentPage="League Details" />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/leagues">
              <Button variant="outline" size="sm" className="bg-glass border-primary/30 text-foreground">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Leagues
              </Button>
            </Link>
          </div>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </ThemeBackground>
    )
  }

  return (
    <AuthGuard>
      <ThemeBackground>
        <Header currentPage="League Details" />
        {leagueData && (
          <div className="container mx-auto px-4 py-6">
            {/* League Overview */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-glass-strong border-primary/30 shadow-glow-blue">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  {leagueData.league.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">League ID:</span>
                    <span className="font-medium">{leagueData.league.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium capitalize">{leagueData.league.type}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-glass-strong border-primary/30 shadow-glow-blue">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-medium text-lg">{leagueData.league.memberCount}</span>
                  </div>
                  <Badge variant="secondary" className="w-full justify-center">
                    Active Competition
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-glass-strong border-primary/30 shadow-glow-blue">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Sync Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge className={getSyncStatusColor(leagueData.league.syncStatus)}>
                      {leagueData.league.syncStatus}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Sync:</span>
                    <span className="font-medium text-sm">
                      {formatDate(leagueData.league.lastSyncedAt)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-glass-strong border-primary/30 shadow-glow-blue">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="h-5 w-5 text-purple-500" />
                  Top Performer
                </CardTitle>
              </CardHeader>
              <CardContent>
                {leagueData.members.length > 0 && (
                  <div className="space-y-2">
                    <div className="font-medium truncate">
                      {leagueData.members[0].entryName}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Points:</span>
                      <span className="font-medium">{leagueData.members[0].totalPoints}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* League Standings */}
          <Card className="bg-glass-strong border-primary/30 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                League Standings
              </CardTitle>
              <CardDescription>
                Current standings for {leagueData.league.memberCount} members
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leagueData.members.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No members found</h3>
                  <p className="text-gray-600">
                    This league doesn't have any members yet or the data is still being processed.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Rank</TableHead>
                        <TableHead className="w-16">Change</TableHead>
                        <TableHead>Team Name</TableHead>
                        <TableHead>Manager</TableHead>
                        <TableHead className="text-right">Total Points</TableHead>
                        <TableHead className="text-right">GW Points</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leagueData.members.map((member) => (
                        <TableRow
                          key={member.entryId}
                          className="hover:bg-accent/10 transition-colors"
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {getRankIcon(member.rank)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getRankChange(member.rank, member.lastRank)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {member.entryName}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {member.playerName}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {member.totalPoints.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className="text-green-600 border-green-200">
                              +{member.eventPoints}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        )}
      </ThemeBackground>
    </AuthGuard>
  )
}
