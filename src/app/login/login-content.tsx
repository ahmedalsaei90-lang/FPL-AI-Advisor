'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { getBrowserClient } from '@/lib/supabase'
import { useAuth } from '@/components/auth/auth-provider-client'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading, refreshUser } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const msg = searchParams.get('message')
    if (msg) {
      setMessage(msg)
    }
  }, [searchParams])

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard')
    }
  }, [authLoading, user, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Invalid credentials')
      }

      // DEBUG: Log what we received from login API
      console.log('=== LOGIN DEBUG ===')
      console.log('Login API response:', data)

      // Clear ALL localStorage to ensure a clean state
      localStorage.clear()
      console.log('Cleared localStorage')

      try {
        const supabase = getBrowserClient()

        // Sign out any existing session first to ensure a clean Supabase state
        await supabase.auth.signOut()
        console.log('Signed out existing Supabase session')

        // Set the new authenticated session
        if (data.session) {
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token
          })
          console.log('Set new Supabase session')
        }
      } catch (sessionError) {
        console.error('Supabase session handling failed:', sessionError)
      }

      // Store authenticated user info
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user))
        try {
          window.dispatchEvent(new Event('auth:user-updated'))
        } catch (eventError) {
          console.warn('Dispatch auth:user-updated event failed:', eventError)
        }
      }
      console.log('Stored user in localStorage:', localStorage.getItem('user'))
      console.log('=== END LOGIN DEBUG ===')

      refreshUser().catch((refreshError) => {
        console.error('Failed to refresh user after login:', refreshError)
      })

      router.replace('/dashboard')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-pitch relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <Card className="w-full max-w-md bg-glass-strong border-primary/30 shadow-glow-blue relative z-10">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-black mb-2">
            <span className="text-gradient-glow">Welcome Back</span>
          </CardTitle>
          <CardDescription className="text-foreground/70 text-base">
            Sign in to get AI-powered FPL advice
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">{message}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                <AlertDescription className="text-destructive">{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full bg-gradient-primary hover:shadow-glow-blue transition-all duration-300 font-bold text-lg py-6" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-foreground/70">Don't have an account? </span>
            <Link href="/signup" className="text-accent hover:text-accent/80 hover:underline font-bold transition-colors">
              Sign up
            </Link>
          </div>

          <div className="mt-4 text-center">
            <Link href="/forgot-password" className="text-sm text-accent hover:text-accent/80 hover:underline transition-colors">
              Forgot your password?
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

