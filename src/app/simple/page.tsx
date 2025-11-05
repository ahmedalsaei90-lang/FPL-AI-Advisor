'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ThemeBackground } from '@/components/layout/theme-background'

export default function SimpleLandingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleGuestAccess = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Failed to create guest session')
      }

      const data = await response.json()

      if (!data.user) {
        throw new Error('No user data received from guest API')
      }

      localStorage.setItem('user', JSON.stringify(data.user))
      router.push('/dashboard')
    } catch (error) {
      console.error('Guest access error:', error)
      setLoading(false)
      alert('Guest mode is currently unavailable. Please try again or create an account for full access.')
    }
  }

  return (
    <ThemeBackground contentClassName="min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-2xl space-y-8 bg-glass-strong border border-primary/30 rounded-3xl p-10 backdrop-blur-xl shadow-lg">
        <div>
          <h1 className="text-5xl font-black text-gradient-glow mb-4">
            Win Your FPL Mini-League with AI
          </h1>
          <p className="text-xl text-foreground/80">
            Get personalized Fantasy Premier League advice powered by real-time analytics and AI insight.
          </p>
        </div>
        
        <Button
          onClick={handleGuestAccess}
          disabled={loading}
          size="lg"
          className="w-full sm:w-auto px-10 py-6 text-lg font-bold bg-gradient-primary hover:shadow-glow-blue disabled:opacity-70"
        >
          {loading ? 'Creating Session...' : 'Try as Guest'}
        </Button>
        
        <div className="text-sm text-foreground/70">
          Curious how the flow works?{' '}
          <Link href="/test-guest" className="text-accent font-semibold hover:text-accent/80 underline">
            Test guest access tools
          </Link>
        </div>
      </div>
    </ThemeBackground>
  )
}
