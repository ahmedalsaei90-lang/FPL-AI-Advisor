'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useAuth } from '@/components/auth/auth-provider-client'
import { authenticatedGet, authenticatedPost, authenticatedPut, authenticatedDelete } from '@/lib/api-client'

interface Notification {
  id: string
  type: 'injury_alert' | 'system' | 'league_update'
  title: string
  message: string
  data?: any
  isRead: boolean
  createdAt: string
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void
  markAsRead: (notificationIds?: string[]) => void
  markAllAsRead: () => void
  deleteNotifications: (notificationIds?: string[]) => void
  deleteAllNotifications: () => void
  refreshNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

interface NotificationProviderProps {
  children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const { user } = useAuth()
  const userId = user?.id ?? null

  const refreshNotifications = useCallback(async () => {
    if (!userId) {
      return
    }

    // Make this completely non-blocking - don't await, just fire and forget
    authenticatedGet('/api/notifications?limit=10')
      .then(response => {
        if (response.ok) {
          return response.json()
        }
        throw new Error('Failed to fetch notifications')
      })
      .then(data => {
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      })
      .catch(() => {
        // Silently fail - notifications are optional
        // Don't log anything even in development to reduce console noise
        setNotifications([])
        setUnreadCount(0)
      })
  }, [userId])

  useEffect(() => {
    if (userId) {
      refreshNotifications()
    } else {
      setNotifications([])
      setUnreadCount(0)
    }
  }, [userId, refreshNotifications])

  const addNotification = async (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
    if (!userId) return

    try {
      const response = await authenticatedPut('/api/notifications', notification)

      if (response.ok) {
        const data = await response.json()
        const newNotification: Notification = {
          ...notification,
          id: data.notification.id,
          createdAt: data.notification.createdAt,
          isRead: false
        }

        setNotifications(prev => [newNotification, ...prev.slice(0, 9)]) // Keep only 10 most recent
        setUnreadCount(prev => prev + 1)
      }
    } catch (error) {
      // Silently fail - notifications are not critical
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to add notification:', error)
      }
    }
  }

  const markAsRead = async (notificationIds?: string[]) => {
    if (!userId) return

    try {
      const response = await authenticatedPost('/api/notifications', {
        notificationIds,
        markAll: !notificationIds
      })

      if (response.ok) {
        if (notificationIds) {
          setNotifications(prev =>
            prev.map(n =>
              notificationIds.includes(n.id) ? { ...n, isRead: true } : n
            )
          )

          // Update unread count
          const markedCount = notificationIds.length
          setUnreadCount(prev => Math.max(0, prev - markedCount))
        } else {
          setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
          setUnreadCount(0)
        }
      }
    } catch (error) {
      // Silently fail - notifications are not critical
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to mark notifications as read:', error)
      }
    }
  }

  const markAllAsRead = () => {
    markAsRead()
  }

  const deleteNotifications = async (notificationIds?: string[]) => {
    if (!userId) return

    try {
      const response = await authenticatedDelete('/api/notifications', {
        notificationIds,
        deleteAll: !notificationIds
      })

      if (response.ok) {
        if (notificationIds) {
          const deletedIds = new Set(notificationIds)
          setNotifications(prev => prev.filter(n => !deletedIds.has(n.id)))

          // Update unread count
          const deletedUnreadCount = notifications
            .filter(n => deletedIds.has(n.id) && !n.isRead)
            .length
          setUnreadCount(prev => Math.max(0, prev - deletedUnreadCount))
        } else {
          setNotifications([])
          setUnreadCount(0)
        }
      }
    } catch (error) {
      // Silently fail - notifications are not critical
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to delete notifications:', error)
      }
    }
  }

  const deleteAllNotifications = () => {
    deleteNotifications()
  }

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotifications,
    deleteAllNotifications,
    refreshNotifications
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
