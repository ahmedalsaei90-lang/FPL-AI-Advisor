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

    try {
      // Use authenticated API call - userId is extracted from JWT token on server
      const fetchPromise = authenticatedGet('/api/notifications?limit=10')
      const timeoutPromise = new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error('Notifications fetch timeout')), 5000)
      )

      const response = await Promise.race([fetchPromise, timeoutPromise])

      if (response.ok) {
        const jsonPromise = response.json()
        const jsonTimeoutPromise = new Promise<any>((_, reject) =>
          setTimeout(() => reject(new Error('JSON parsing timeout')), 3000)
        )

        const data = await Promise.race([jsonPromise, jsonTimeoutPromise])
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      // Set empty state on error to prevent hanging
      setNotifications([])
      setUnreadCount(0)
    }
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
      // Use authenticated API call
      const fetchPromise = authenticatedPut('/api/notifications', notification)

      const timeoutPromise = new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error('Add notification timeout')), 5000)
      )

      const response = await Promise.race([fetchPromise, timeoutPromise])

      if (response.ok) {
        const jsonPromise = response.json()
        const jsonTimeoutPromise = new Promise<any>((_, reject) =>
          setTimeout(() => reject(new Error('JSON parsing timeout')), 3000)
        )

        const data = await Promise.race([jsonPromise, jsonTimeoutPromise])
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
      console.error('Error adding notification:', error)
    }
  }

  const markAsRead = async (notificationIds?: string[]) => {
    if (!userId) return

    try {
      // Use authenticated API call - userId no longer needed in body
      const fetchPromise = authenticatedPost('/api/notifications', {
        notificationIds,
        markAll: !notificationIds
      })

      const timeoutPromise = new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error('Mark as read timeout')), 5000)
      )

      const response = await Promise.race([fetchPromise, timeoutPromise])

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
      console.error('Error marking notifications as read:', error)
    }
  }

  const markAllAsRead = () => {
    markAsRead()
  }

  const deleteNotifications = async (notificationIds?: string[]) => {
    if (!userId) return

    try {
      // Use authenticated API call - userId no longer needed in body
      const fetchPromise = authenticatedDelete('/api/notifications', {
        notificationIds,
        deleteAll: !notificationIds
      })

      const timeoutPromise = new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error('Delete notifications timeout')), 5000)
      )

      const response = await Promise.race([fetchPromise, timeoutPromise])

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
      console.error('Error deleting notifications:', error)
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
