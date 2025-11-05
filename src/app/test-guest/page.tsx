'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ThemeBackground } from '@/components/layout/theme-background'

export default function TestPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const testGuestAccess = async () => {
    setMessage('Requesting guest session...')
    setLoading(true)
    
    try {
      const response = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create guest session')
      }

      if (!data.user) {
        throw new Error('No user data returned from guest API')
      }

      localStorage.setItem('user', JSON.stringify(data.user))
      setMessage('Guest session created. Redirecting to dashboard...')

      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 1500)
    } catch (error: any) {
      setMessage('Error: ' + error.message)
      setLoading(false)
    }
  }

  return (
    <ThemeBackground contentClassName="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6 bg-glass-strong border border-primary/30 rounded-3xl p-8 shadow-lg backdrop-blur-xl">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-black text-gradient-glow">Guest Access Test</h1>
          <p className="text-sm text-foreground/70">
            Utilities to debug the guest authentication flow quickly.
          </p>
        </div>
        
        <div className="p-4 bg-glass border border-primary/20 rounded-2xl text-left">
          <p className="text-xs font-mono text-foreground/80 break-all">
            Status: {message || 'No events yet'}
          </p>
        </div>
        
        <div className="space-y-3">
          <Button
            onClick={testGuestAccess}
            disabled={loading}
            className="w-full bg-gradient-primary hover:shadow-glow-blue text-lg font-semibold py-6 disabled:opacity-70"
          >
            {loading ? 'Loading...' : 'Test Guest Access'}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => {
              const user = localStorage.getItem('user')
              setMessage('Current user: ' + (user ? JSON.stringify(user) : 'No user found'))
            }}
            className="w-full border-primary/30 text-foreground/80 hover:bg-accent/10"
          >
            Check localStorage
          </Button>
          
          <Button
            variant="destructive"
            onClick={() => {
              localStorage.removeItem('user')
              setMessage('localStorage cleared')
            }}
            className="w-full"
          >
            Clear localStorage
          </Button>
        </div>
      </div>
    </ThemeBackground>
  )
}
