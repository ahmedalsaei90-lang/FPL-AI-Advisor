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
import {
  MessageSquare,
  Users,
  Bell,
  TrendingUp,
  Settings,
  Trophy,
  Target,
  Loader2,
  Plus
} from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  fplTeamId?: number
  fplTeamName?: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [teamLoading, setTeamLoading] = useState(false)
  const [fplId, setFplId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Debug logging to identify the source of the TypeError
        const handleImportTeam = async () => {
    if (!fplId || !/^\d{6,7}$/.test(fplId)) {
      setError('Please enter a valid FPL Team ID (6-7 digits)')
      return
    }

    setTeamLoading(true)
    setError('')
    setSuccess('')

    try {
      if (!user?.id) {
        throw new Error('You need to be signed in to import a team.')
      }

      const parsedTeamId = Number.parseInt(fplId, 10)
      const response = await fetch('/api/team/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          fplTeamId: parsedTeamId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import team')
      }

      // Update user state in localStorage for backward compatibility
      const updatedUser = {
        ...user,
        fplTeamId: parsedTeamId,
        fplTeamName: data?.fplData?.teamName || data?.team?.team_name || user.fplTeamName
      }

      localStorage.setItem('user', JSON.stringify(updatedUser))

      if (typeof window !== 'undefined') {
        try {
          window.dispatchEvent(
            new StorageEvent('storage', { key: 'user', newValue: JSON.stringify(updatedUser) })
          )
        } catch {
          // StorageEvent construction fails in some browsers; fall back to a custom event.
          window.dispatchEvent(new Event('auth:user-updated'))
        }
      }

      setSuccess('Team imported successfully! Your squad will stay synced with live FPL data.')
      setFplId('')
    } catch (error: any) {
      setError(error?.message || 'Failed to import team')
    } finally {
      setTeamLoading(false)
    }
  }


  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-pitch relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <Header currentPage="Dashboard" />

        <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black mb-3">
            <span className="text-gradient-glow">Welcome back,</span> <span className="text-foreground">{user?.name || 'User'}!</span>
          </h1>
          <p className="text-foreground/70 text-lg">
            Get AI-powered advice to dominate your FPL mini-league
          </p>
        </div>

        {/* Team Import Section */}
        {!user?.fplTeamId && (
          <Card className="mb-8 bg-glass-strong border-primary/30 shadow-glow-blue">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Plus className="h-6 w-6 text-accent" />
                <span className="text-gradient-primary">Connect Your FPL Team</span>
              </CardTitle>
              <CardDescription className="text-foreground/70 text-base">
                Enter your FPL Team ID to import your squad and get personalized advice
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="fplId" className="text-foreground font-bold">FPL Team ID</Label>
                  <Input
                    id="fplId"
                    placeholder="Enter 6-7 digit team ID"
                    value={fplId}
                    onChange={(e) => setFplId(e.target.value)}
                    disabled={teamLoading}
                    className="mt-2 bg-input/50 border-primary/20"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleImportTeam}
                    disabled={teamLoading}
                    className="bg-gradient-primary hover:shadow-glow-blue transition-all duration-300 font-bold"
                  >
                    {teamLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      'Import Team'
                    )}
                  </Button>
                </div>
              </div>
              {error && (
                <Alert variant="destructive" className="mt-4 border-destructive/50 bg-destructive/10">
                  <AlertDescription className="text-destructive">{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className="mt-4 bg-secondary/20 border-secondary/50">
                  <AlertDescription className="text-secondary-foreground font-bold">{success}</AlertDescription>
                </Alert>
              )}
              <p className="text-sm text-foreground/60 mt-4">
                Don't know your Team ID? Find it in your FPL profile URL or team page
              </p>
            </CardContent>
          </Card>
        )}

        {/* Team Overview */}
        {user?.fplTeamId && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-glass-strong border-primary/30 shadow-lg hover:shadow-glow-blue transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center gap-2 font-black">
                  <Trophy className="h-6 w-6 text-accent" />
                  <span className="text-gradient-primary">{user?.fplTeamName || 'Your Team'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-foreground/70 font-medium">Team ID:</span>
                    <span className="font-bold text-foreground">{user?.fplTeamId}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-foreground/70 font-medium">Total Points:</span>
                    <span className="font-bold text-accent">245</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-foreground/70 font-medium">Overall Rank:</span>
                    <span className="font-bold text-primary">123,456</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-glass-strong border-secondary/30 shadow-lg hover:shadow-glow-green transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center gap-2 font-black">
                  <Target className="h-6 w-6 text-accent" />
                  <span className="text-gradient-glow">Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/advisor">
                  <Button className="w-full justify-start bg-glass border-primary/30 hover:bg-gradient-primary hover:shadow-glow-blue transition-all duration-300 font-bold">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Ask AI Advisor
                  </Button>
                </Link>
                <Link href="/team">
                  <Button className="w-full justify-start bg-glass border-secondary/30 hover:bg-gradient-secondary hover:shadow-glow-green transition-all duration-300 font-bold">
                    <TrendingUp className="mr-2 h-5 w-5" />
                    View Team
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-glass-strong border-accent/30 shadow-lg hover:shadow-glow-green transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center gap-2 font-black">
                  <Bell className="h-6 w-6 text-accent" />
                  <span className="text-gradient-primary">Notifications</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base text-foreground/70 mb-3 font-medium">
                  Stay updated with injury alerts and deadline reminders
                </p>
                <Badge className="bg-accent text-accent-foreground font-bold">3 New</Badge>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-glass-strong border-primary/30 shadow-lg hover:shadow-glow-blue hover:scale-105 transition-all duration-300 cursor-pointer group">
            <Link href="/advisor">
              <CardHeader>
                <div className="text-accent mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  <MessageSquare className="h-10 w-10" />
                </div>
                <CardTitle className="text-2xl font-bold mb-2 text-foreground">AI Advisor</CardTitle>
                <CardDescription className="text-foreground/70 leading-relaxed">
                  Chat with AI for personalized FPL advice
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="bg-glass-strong border-secondary/30 shadow-lg hover:shadow-glow-green hover:scale-105 transition-all duration-300 cursor-pointer group">
            <Link href="/team">
              <CardHeader>
                <div className="text-accent mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-10 w-10" />
                </div>
                <CardTitle className="text-2xl font-bold mb-2 text-foreground">My Team</CardTitle>
                <CardDescription className="text-foreground/70 leading-relaxed">
                  View your squad and analyze performance
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="bg-glass-strong border-accent/30 shadow-lg hover:shadow-glow-blue hover:scale-105 transition-all duration-300 cursor-pointer group">
            <Link href="/leagues">
              <CardHeader>
                <div className="text-accent mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-10 w-10" />
                </div>
                <CardTitle className="text-2xl font-bold mb-2 text-foreground">Leagues</CardTitle>
                <CardDescription className="text-foreground/70 leading-relaxed">
                  Track your mini-league performance
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="bg-glass-strong border-primary/20 shadow-lg hover:shadow-glow-green hover:scale-105 transition-all duration-300 cursor-pointer group">
            <Link href="/settings">
              <CardHeader>
                <div className="text-accent mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  <Settings className="h-10 w-10" />
                </div>
                <CardTitle className="text-2xl font-bold mb-2 text-foreground">Settings</CardTitle>
                <CardDescription className="text-foreground/70 leading-relaxed">
                  Manage your account and preferences
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>
        </div>
        </div>
      </div>
    </AuthGuard>
  )
}
