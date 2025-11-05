'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Header } from '@/components/header'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { useAuth } from '@/components/auth/auth-provider-client'
import { ThemeBackground } from '@/components/layout/theme-background'
import { authenticatedGet, authenticatedPost } from '@/lib/api-client'
import {
  Users,
  Trophy,
  Plus,
  RefreshCw,
  Loader2,
  Import,
  ExternalLink
} from 'lucide-react'

interface League {
  id: number
  name: string
  type: string
  memberCount: number
  lastSyncedAt: string
  syncStatus: string
  createdAt: string
}

interface LeaguesResponse {
  leagues: League[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export default function LeaguesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [leagues, setLeagues] = useState<League[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [leagueId, setLeagueId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false
  })

  useEffect(() => {
    if (!user) {
      return
    }
    
    // Load leagues data
    loadLeaguesData(user.id)
  }, [router, user])

  const loadLeaguesData = async (userId: string, page: number = 1) => {
    try {
      // Use authenticated API call - userId is extracted from JWT token on server
      const response = await authenticatedGet(`/api/leagues?page=${page}&limit=10`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load leagues data')
      }

      const leaguesData: LeaguesResponse = data
      setLeagues(leaguesData.leagues)
      setPagination(leaguesData.pagination)
    } catch (error: any) {
      console.error('Leagues data error:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleImportLeague = async () => {
    if (!leagueId || !/^\d+$/.test(leagueId)) {
      setError('Please enter a valid League ID')
      return
    }

    setImporting(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/leagues/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          leagueId: parseInt(leagueId)
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import league')
      }

      setSuccess('League imported successfully!')
      setLeagueId('')
      
      // Refresh leagues list
      await loadLeaguesData(user.id, pagination.currentPage)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setImporting(false)
    }
  }

  const handleRefresh = async () => {
    if (!user) return
    
    setRefreshing(true)
    await loadLeaguesData(user.id, pagination.currentPage)
    setRefreshing(false)
  }

  const handlePageChange = (newPage: number) => {
    if (user) {
      loadLeaguesData(user.id, newPage)
    }
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

  return (
    <AuthGuard>
      <ThemeBackground>
        <Header currentPage="Mini-Leagues" />

        <div className="container mx-auto px-4 py-8">
          {/* Import League Section */}
          <Card className="mb-8 bg-glass-strong border-primary/30 shadow-glow-blue">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Import className="h-5 w-5" />
                Import Mini-League
              </CardTitle>
              <CardDescription>
                Enter your FPL mini-league ID to import and analyze your league standings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="leagueId">FPL League ID</Label>
                  <Input
                    id="leagueId"
                    placeholder="Enter league ID"
                    value={leagueId}
                    onChange={(e) => setLeagueId(e.target.value)}
                    disabled={importing}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleImportLeague} 
                    disabled={importing}
                    className="bg-gradient-primary hover:shadow-glow-blue transition-all duration-300"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Import className="mr-2 h-4 w-4" />
                        Import League
                      </>
                    )}
                  </Button>
                </div>
              </div>
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className="mt-4 bg-green-50 border-green-200">
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}
              <p className="text-sm text-gray-600 mt-4">
                Find your league ID in your FPL mini-league page URL or in the league settings
              </p>
            </CardContent>
          </Card>

          {/* Leagues List */}
          <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Your Imported Leagues</h2>
            <Badge variant="outline">
              {pagination.totalItems} {pagination.totalItems === 1 ? 'League' : 'Leagues'}
            </Badge>
          </div>

          {leagues.length === 0 ? (
            <Card className="bg-glass-strong border-primary/20 shadow-md">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No leagues imported yet</h3>
                <p className="text-gray-600 text-center mb-4">
                  Import your first mini-league to start tracking standings and analyzing performance
                </p>
                <Button 
                  onClick={() => document.getElementById('leagueId')?.focus()}
                  className="bg-gradient-primary hover:shadow-glow-blue transition-all duration-300"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Import Your First League
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {leagues.map((league) => (
                <Card key={league.id} className="bg-glass border-primary/20 hover:shadow-glow-blue transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-yellow-500" />
                          {league.name}
                        </CardTitle>
                        <CardDescription>
                          {league.type === 'classic' ? 'Classic' : 'Head-to-Head'} League • {league.memberCount} members
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getSyncStatusColor(league.syncStatus)}>
                          {league.syncStatus}
                        </Badge>
                        <Link href={`/leagues/${league.id}`}>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">League ID:</span>
                        <span className="ml-2 font-medium">{league.id}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Last Synced:</span>
                        <span className="ml-2 font-medium">{formatDate(league.lastSyncedAt)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Imported:</span>
                        <span className="ml-2 font-medium">{formatDate(league.createdAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
              >
                Next
              </Button>
            </div>
          )}
        </div>
        </div>
      </ThemeBackground>
    </AuthGuard>
  )
}
