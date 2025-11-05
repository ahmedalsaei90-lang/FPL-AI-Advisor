'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider-client'

interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
}

export function AuthGuard({ children, redirectTo = '/login' }: AuthGuardProps) {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
        if (!loading) {
      if (!user) {
                // Redirect to login if not authenticated
        router.push(redirectTo)
      } else {
              }
    }
  }, [user, loading, router, redirectTo])

    if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <p className="text-sm text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    console.log('AuthGuard: No user, returning null (will redirect)');
    return null // Will redirect in the useEffect
  }
  
  // Additional validation for guest users
  if (!user.id || !user.email) {
    console.log('AuthGuard: Invalid user object (missing id or email), redirecting to', redirectTo);
        router.push(redirectTo);
    return null;
  }
  
  // Allow both regular users and guest users to access protected routes
  console.log('AuthGuard: User validated (regular or guest), rendering children');

    return <>{children}</>
}