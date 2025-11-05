'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { MessageSquare, Users, Bell, TrendingUp, Shield, Zap, Loader2 } from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleGuestAccess = async () => {
    setLoading(true)

    try {
      // Create guest session first
      const response = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Failed to create guest session')
      }

      const data = await response.json()

      // Store the actual guest user data from API response
      if (data.user && typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(data.user))

        // Dispatch storage event to trigger AuthProvider update
        try {
          window.dispatchEvent(
            new StorageEvent('storage', {
              key: 'user',
              newValue: JSON.stringify(data.user)
            })
          )
        } catch {
          // Fallback for browsers that don't support StorageEvent constructor
          window.dispatchEvent(new Event('auth:user-updated'))
        }

        // Wait for AuthProvider to process the user before navigating
        await new Promise(resolve => setTimeout(resolve, 150))

        // Use replace instead of push to prevent back button issues
        router.replace('/dashboard')
      } else {
        throw new Error('No user data received from guest API')
      }
    } catch (error) {
      console.error('Guest access error:', error)
      setLoading(false)
      alert('Failed to create guest session. Please try again.')
    }
  }

  if (!isClient) {
    return <div style={{padding:24}}></div>
  }

  return (
    <div className="min-h-screen bg-gradient-pitch relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Hero Section */}
      <header className="container mx-auto px-4 py-16 text-center relative z-10">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-glass px-6 py-3 rounded-full text-sm font-bold mb-8 shadow-glow-blue border border-primary/30">
            <Shield className="w-5 h-5 text-accent" />
            <span className="text-gradient-primary">Grand Master Fantasy - AI-Powered EPL Strategy</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-black mb-6 leading-tight">
            <span className="text-gradient-glow">Dominate Your</span>
            <br />
            <span className="text-foreground">FPL Mini-League</span>
          </h1>
          <p className="text-xl md:text-2xl text-foreground/80 mb-10 max-w-3xl mx-auto font-medium">
            Your ultimate <span className="text-accent font-bold">AI-powered</span> Fantasy Premier League companion.
            Get expert insights, player recommendations, and winning strategies.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="text-lg px-10 py-7 bg-gradient-primary hover:shadow-glow-blue transition-all duration-300 font-bold text-xl"
              onClick={handleGuestAccess}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Session...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-5 w-5" />
                  Try as Guest
                </>
              )}
            </Button>
            <Link href="/signup">
              <Button size="lg" variant="outline" className="text-lg px-10 py-7 border-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground font-bold text-xl transition-all duration-300 hover:shadow-glow-green">
                Sign Up Free
              </Button>
            </Link>
          </div>

          <div className="mt-6 text-center">
            <p className="text-base text-foreground/70 mb-2 font-semibold">
              Already have an account?{' '}
              <Link href="/login" className="text-accent hover:text-accent/80 hover:underline font-bold transition-colors">
                Sign In
              </Link>
            </p>
          </div>

          <div className="mt-8 text-center">
            <p className="text-base text-foreground/70 mb-2 font-semibold">🚀 No signup required - Start instantly!</p>
            <p className="text-sm text-foreground/60">
              Guest access lets you explore the experience; connect your real FPL data by creating an account.
            </p>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="container mx-auto px-4 py-20 relative z-10">
        <h2 className="text-4xl md:text-5xl font-black text-center mb-4">
          <span className="text-gradient-glow">Everything You Need</span>
        </h2>
        <p className="text-center text-foreground/70 text-lg mb-16">To Dominate Your League</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            icon={<MessageSquare className="w-10 h-10" />}
            title="AI Chat Advisor"
            description="Ask about transfers, captains, or strategy. Get instant, personalized advice."
          />
          <FeatureCard
            icon={<Users className="w-10 h-10" />}
            title="Mini-League Analysis"
            description="See how you stack up against rivals. Get differential picks to gain an edge."
          />
          <FeatureCard
            icon={<Bell className="w-10 h-10" />}
            title="Injury Alerts"
            description="Get notified instantly when your players are injured or doubtful."
          />
          <FeatureCard
            icon={<TrendingUp className="w-10 h-10" />}
            title="Form & Fixtures"
            description="AI analyzes upcoming fixtures and player form to maximize your points."
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 relative z-10">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-4">
            <span className="text-gradient-glow">How It Works</span>
          </h2>
          <p className="text-center text-foreground/70 text-lg mb-16">Get started in 4 simple steps</p>
          <div className="max-w-4xl mx-auto space-y-6">
            <Step
              number={1}
              title="Connect Your FPL Team"
              description="Enter your FPL Team ID. We'll import your squad, leagues, and stats instantly."
            />
            <Step
              number={2}
              title="Chat with AI Advisor"
              description="Ask questions like 'Should I transfer out Salah?' or 'Who should I captain?'"
            />
            <Step
              number={3}
              title="Get Personalized Advice"
              description="AI analyzes your team, fixtures, and rivals to give specific recommendations."
            />
            <Step
              number={4}
              title="Climb Your League"
              description="Follow the advice, track your progress, and watch your rank improve!"
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-20 relative z-10">
        <h2 className="text-4xl md:text-5xl font-black text-center mb-4">
          <span className="text-gradient-glow">What Managers Say</span>
        </h2>
        <p className="text-center text-foreground/70 text-lg mb-16">Join thousands of winning FPL managers</p>
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <TestimonialCard
            name="Alex M."
            league="Head-to-Head League"
            quote="The AI advice helped me make a crucial captain pick that won me my matchup. Game changer!"
          />
          <TestimonialCard
            name="Sarah K."
            league="Classic League"
            quote="Finally beating my brother who's won our league 3 years in a row. The AI knows its stuff!"
          />
          <TestimonialCard
            name="Mike R."
            league="Work League"
            quote="The injury alerts saved my team. Got notified before my rivals and made a smart transfer."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-accent py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvZz48L3N2Zz4=')] opacity-20"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-glass-strong rounded-full shadow-glow-green">
              <Zap className="w-16 h-16 text-accent" />
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-foreground mb-6">
            Ready to Dominate?
          </h2>
          <p className="text-xl md:text-2xl text-foreground/80 mb-10 font-semibold">
            Join thousands of FPL managers getting <span className="text-accent">AI-powered advice</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="text-lg px-12 py-7 bg-foreground text-background hover:bg-foreground/90 font-bold text-xl shadow-glow-blue"
              onClick={handleGuestAccess}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Session...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-5 w-5" />
                  Try as Guest Now
                </>
              )}
            </Button>
            <Link href="/signup">
              <Button size="lg" variant="outline" className="text-lg px-12 py-7 border-2 border-foreground text-foreground hover:bg-foreground hover:text-background font-bold text-xl transition-all duration-300">
                Sign Up Free
              </Button>
            </Link>
          </div>
          <p className="text-foreground/70 mt-6 text-base font-medium">
            ⚡ No credit card required • Free forever for basic features
          </p>
        </div>
      </section>
    </div>
  )
}

function FeatureCard({ icon, title, description }: any) {
  return (
    <div className="bg-glass-strong p-8 rounded-2xl shadow-lg hover:shadow-glow-blue transition-all duration-300 border border-primary/20 group hover:scale-105">
      <div className="text-accent mb-6 transform group-hover:scale-110 transition-transform duration-300">{icon}</div>
      <h3 className="text-2xl font-bold mb-3 text-foreground">{title}</h3>
      <p className="text-foreground/70 leading-relaxed">{description}</p>
    </div>
  )
}

function Step({ number, title, description }: any) {
  return (
    <div className="flex gap-6 items-start bg-glass p-6 rounded-2xl hover:bg-glass-strong transition-all duration-300 border border-primary/20">
      <div className="flex-shrink-0 w-16 h-16 bg-gradient-primary text-primary-foreground rounded-full flex items-center justify-center font-black text-2xl shadow-glow-blue">
        {number}
      </div>
      <div className="flex-1">
        <h3 className="text-2xl font-bold mb-2 text-foreground">{title}</h3>
        <p className="text-foreground/70 text-lg leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

function TestimonialCard({ name, league, quote }: any) {
  return (
    <div className="bg-glass-strong p-8 rounded-2xl shadow-lg hover:shadow-glow-green transition-all duration-300 border border-secondary/20 hover:scale-105">
      <div className="flex items-center gap-1 mb-6">
        {[...Array(5)].map((_, i) => (
          <span key={i} className="text-accent text-2xl">★</span>
        ))}
      </div>
      <p className="text-foreground/90 mb-6 italic text-lg leading-relaxed">"{quote}"</p>
      <div className="border-t border-foreground/10 pt-4">
        <p className="font-bold text-foreground text-lg">{name}</p>
        <p className="text-sm text-foreground/60 font-medium">{league}</p>
      </div>
    </div>
  )
}
