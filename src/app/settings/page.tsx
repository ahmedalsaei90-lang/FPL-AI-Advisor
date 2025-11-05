'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/header'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { useAuth } from '@/components/auth/auth-provider-client'
import { ThemeBackground } from '@/components/layout/theme-background'
import {
  User,
  Shield,
  Bell,
  Trash2,
  Save,
  AlertCircle,
  CheckCircle2,
  LogOut,
  UserCircle,
  Link2,
  Unlink,
  RefreshCw
} from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // Profile settings
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [fplTeamId, setFplTeamId] = useState('')

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [injuryAlerts, setInjuryAlerts] = useState(true)
  const [priceChangeAlerts, setPriceChangeAlerts] = useState(true)
  const [deadlineReminders, setDeadlineReminders] = useState(true)

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
      setFplTeamId(user.fplTeamId?.toString() || '')
    }
  }, [user])

  const handleSaveProfile = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // In a real implementation, this would call an API to update user profile
      await new Promise(resolve => setTimeout(resolve, 1000))

      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnectTeam = async () => {
    if (!confirm('Are you sure you want to disconnect your FPL team? This will remove all your team data.')) {
      return
    }

    setLoading(true)
    setError('')

    try {
      // In a real implementation, this would call an API to disconnect FPL team
      await new Promise(resolve => setTimeout(resolve, 1000))

      setFplTeamId('')
      setSuccess('FPL team disconnected successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect FPL team')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmation = prompt('Type "DELETE" to confirm account deletion:')
    if (confirmation !== 'DELETE') {
      return
    }

    setLoading(true)
    setError('')

    try {
      // In a real implementation, this would call an API to delete account
      await new Promise(resolve => setTimeout(resolve, 1000))

      await signOut()
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Failed to delete account')
      setLoading(false)
    }
  }

  const handleSaveNotifications = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // In a real implementation, this would call an API to update notification preferences
      await new Promise(resolve => setTimeout(resolve, 1000))

      setSuccess('Notification preferences saved!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save notification preferences')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthGuard>
      <ThemeBackground>
        <Header currentPage="Settings" />

        <div className="container mx-auto py-8 px-4 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gradient-glow mb-2">Settings</h1>
            <p className="text-muted-foreground">Manage your account and preferences</p>
          </div>

          {/* Status Messages */}
          {success && (
            <Alert className="mb-6 border-green-500/20 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-500">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="mb-6 border-red-500/20 bg-red-500/10">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-500">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Guest User Notice */}
          {user?.isGuest && (
            <Alert className="mb-6 border-blue-500/20 bg-blue-500/10">
              <UserCircle className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-500">
                <strong>Guest Account:</strong> Create a full account to access all features and save your preferences permanently.
                <Button
                  variant="link"
                  className="ml-2 text-blue-400 hover:text-blue-300"
                  onClick={() => router.push('/signup')}
                >
                  Create Account
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-glass">
              <TabsTrigger value="profile">
                <User className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="team">
                <Link2 className="h-4 w-4 mr-2" />
                FPL Team
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="security">
                <Shield className="h-4 w-4 mr-2" />
                Security
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card className="bg-glass border-white/10">
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information and account details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="bg-background/50"
                      disabled={user?.isGuest}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      readOnly
                      className="bg-background/50 opacity-60 cursor-not-allowed"
                    />
                    <p className="text-sm text-muted-foreground">
                      Email address cannot be changed
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Account Type</Label>
                    <div>
                      <Badge variant={user?.isGuest ? "secondary" : "default"}>
                        {user?.isGuest ? "Guest User" : "Full Account"}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  <Button
                    onClick={handleSaveProfile}
                    disabled={loading || user?.isGuest}
                    className="w-full bg-gradient-primary hover:opacity-90"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* FPL Team Tab */}
            <TabsContent value="team">
              <Card className="bg-glass border-white/10">
                <CardHeader>
                  <CardTitle>FPL Team Connection</CardTitle>
                  <CardDescription>
                    Manage your Fantasy Premier League team connection
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {user?.isGuest ? (
                    <Alert className="border-yellow-500/20 bg-yellow-500/10">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <AlertDescription className="text-yellow-500">
                        Guest users cannot import FPL teams. Please create a full account to use this feature.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label>FPL Team ID</Label>
                        {fplTeamId ? (
                          <div className="flex items-center gap-3">
                            <Input
                              type="text"
                              value={fplTeamId}
                              readOnly
                              className="bg-background/50 opacity-60 cursor-not-allowed flex-1"
                            />
                            <Badge variant="default" className="bg-green-500/20 text-green-400">
                              Connected
                            </Badge>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <p className="text-sm text-muted-foreground">
                              No FPL team connected
                            </p>
                            <Badge variant="secondary">
                              Not Connected
                            </Badge>
                          </div>
                        )}
                      </div>

                      {fplTeamId && (
                        <>
                          <Separator />
                          <div className="space-y-3">
                            <Label className="text-red-400">Danger Zone</Label>
                            <p className="text-sm text-muted-foreground">
                              Disconnecting your FPL team will remove all associated data including squad, points, and rank information.
                            </p>
                            <Button
                              variant="destructive"
                              onClick={handleDisconnectTeam}
                              disabled={loading}
                              className="w-full"
                            >
                              <Unlink className="mr-2 h-4 w-4" />
                              Disconnect FPL Team
                            </Button>
                          </div>
                        </>
                      )}

                      {!fplTeamId && (
                        <Button
                          variant="default"
                          onClick={() => router.push('/dashboard')}
                          className="w-full bg-gradient-primary hover:opacity-90"
                        >
                          <Link2 className="mr-2 h-4 w-4" />
                          Connect FPL Team
                        </Button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <Card className="bg-glass border-white/10">
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Choose what notifications you want to receive
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {user?.isGuest && (
                    <Alert className="border-yellow-500/20 bg-yellow-500/10 mb-4">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <AlertDescription className="text-yellow-500">
                        Notification preferences are not saved for guest users
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email-notifications">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive email updates about your FPL team
                        </p>
                      </div>
                      <Switch
                        id="email-notifications"
                        checked={emailNotifications}
                        onCheckedChange={setEmailNotifications}
                        disabled={user?.isGuest}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="injury-alerts">Injury Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when your players are injured
                        </p>
                      </div>
                      <Switch
                        id="injury-alerts"
                        checked={injuryAlerts}
                        onCheckedChange={setInjuryAlerts}
                        disabled={user?.isGuest}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="price-change-alerts">Price Change Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Be alerted when player prices change
                        </p>
                      </div>
                      <Switch
                        id="price-change-alerts"
                        checked={priceChangeAlerts}
                        onCheckedChange={setPriceChangeAlerts}
                        disabled={user?.isGuest}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="deadline-reminders">Deadline Reminders</Label>
                        <p className="text-sm text-muted-foreground">
                          Reminders before gameweek deadlines
                        </p>
                      </div>
                      <Switch
                        id="deadline-reminders"
                        checked={deadlineReminders}
                        onCheckedChange={setDeadlineReminders}
                        disabled={user?.isGuest}
                      />
                    </div>
                  </div>

                  <Separator />

                  <Button
                    onClick={handleSaveNotifications}
                    disabled={loading || user?.isGuest}
                    className="w-full bg-gradient-primary hover:opacity-90"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Preferences
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <Card className="bg-glass border-white/10">
                <CardHeader>
                  <CardTitle>Security & Account</CardTitle>
                  <CardDescription>
                    Manage your account security and data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {user?.isGuest ? (
                    <Alert className="border-blue-500/20 bg-blue-500/10">
                      <UserCircle className="h-4 w-4 text-blue-500" />
                      <AlertDescription className="text-blue-500">
                        Guest accounts have limited security options. Create a full account for enhanced security features.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      <div className="space-y-3">
                        <Label>Password</Label>
                        <p className="text-sm text-muted-foreground">
                          Change your password to keep your account secure
                        </p>
                        <Button
                          variant="outline"
                          className="w-full border-white/10"
                          onClick={() => {
                            alert('Password change functionality coming soon!')
                          }}
                        >
                          Change Password
                        </Button>
                      </div>

                      <Separator />
                    </>
                  )}

                  <div className="space-y-3">
                    <Label>Sign Out</Label>
                    <p className="text-sm text-muted-foreground">
                      Sign out from your account on this device
                    </p>
                    <Button
                      variant="outline"
                      onClick={signOut}
                      className="w-full border-white/10"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </Button>
                  </div>

                  {!user?.isGuest && (
                    <>
                      <Separator className="bg-red-500/20" />

                      <div className="space-y-3">
                        <Label className="text-red-400">Danger Zone</Label>
                        <p className="text-sm text-muted-foreground">
                          Permanently delete your account and all associated data. This action cannot be undone.
                        </p>
                        <Button
                          variant="destructive"
                          onClick={handleDeleteAccount}
                          disabled={loading}
                          className="w-full"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Account
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ThemeBackground>
    </AuthGuard>
  )
}
