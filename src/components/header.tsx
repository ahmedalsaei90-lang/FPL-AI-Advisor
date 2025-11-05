'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { NotificationDropdown } from '@/components/ui/notification-dropdown'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider-client'

interface User {
  id: string
  email: string
  name: string
  fplTeamId?: number
  fplTeamName?: string
  isGuest?: boolean
}

interface HeaderProps {
  title?: string
  showUserMenu?: boolean
  currentPage?: string
}

export function Header({ title, showUserMenu = true, currentPage }: HeaderProps) {
  const router = useRouter()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <header className="bg-glass-strong border-b border-primary/30 shadow-glow-blue backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl md:text-3xl font-black">
              <span className="text-gradient-glow">Grand Master Fantasy</span>
            </Link>
            {currentPage && (
              <Badge className="hidden sm:inline-flex bg-accent text-accent-foreground font-bold">
                {currentPage}
              </Badge>
            )}
          </div>

          {showUserMenu && user && (
            <div className="flex items-center gap-4">
              <NotificationDropdown />
              <span className="text-sm md:text-base text-foreground/80 hidden sm:inline font-medium">
                {user.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="hover:bg-destructive/20 hover:text-destructive transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}