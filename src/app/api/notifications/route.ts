import { NextRequest, NextResponse } from 'next/server'
import { getServerClient, createServerClient } from '@/lib/supabase'
import { authenticateRequest } from '@/lib/auth-middleware'
import { z } from 'zod'

// Schema for query parameters
const getNotificationsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  unreadOnly: z.coerce.boolean().default(false)
})

// Schema for marking notifications as read
const markAsReadSchema = z.object({
  notificationIds: z.array(z.string()).optional(),
  markAll: z.boolean().default(false)
})

// Schema for deleting notifications
const deleteNotificationsSchema = z.object({
  notificationIds: z.array(z.string()).optional(),
  deleteAll: z.boolean().default(false)
})

// Schema for creating notifications
const createNotificationSchema = z.object({
  type: z.string(),
  title: z.string(),
  message: z.string(),
  data: z.any().optional()
})

// GET: Fetch user notifications
export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const auth = await authenticateRequest(request)

    if (!auth.success || !auth.user) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = auth.user.id
    const isGuestUser = auth.user.isGuest

    const { searchParams } = new URL(request.url)
    const { page, limit, unreadOnly } = getNotificationsSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      unreadOnly: searchParams.get('unreadOnly')
    })

    // Use service client for guest users to bypass RLS
    const supabase = isGuestUser ? createServerClient() : getServerClient()

    // Calculate pagination
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('user_notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter for unread only if requested
    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data: notifications, error, count } = await query

    if (error) {
      // If table doesn't exist, return empty result instead of error
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          notifications: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: limit,
            hasNextPage: false,
            hasPrevPage: false
          },
          unreadCount: 0
        })
      }

      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      )
    }

    // Calculate pagination info
    const totalPages = count ? Math.ceil(count / limit) : 0
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('user_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    return NextResponse.json({
      notifications: notifications || [],
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count || 0,
        itemsPerPage: limit,
        hasNextPage,
        hasPrevPage
      },
      unreadCount: unreadCount || 0
    })
  } catch (error) {
    console.error('Notifications fetch error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Mark notifications as read
export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const auth = await authenticateRequest(request)

    if (!auth.success || !auth.user) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = auth.user.id
    const isGuestUser = auth.user.isGuest

    const body = await request.json()
    const { notificationIds, markAll } = markAsReadSchema.parse(body)

    // Use service client for guest users to bypass RLS
    const supabase = isGuestUser ? createServerClient() : getServerClient()

    let query = supabase
      .from('user_notifications')
      .update({ is_read: true })
      .eq('user_id', userId)

    // Mark specific notifications or all notifications
    if (markAll) {
      query = query.eq('is_read', false)
    } else if (notificationIds && notificationIds.length > 0) {
      query = query.in('id', notificationIds)
    } else {
      return NextResponse.json(
        { error: 'Either notificationIds or markAll must be provided' },
        { status: 400 }
      )
    }

    const { data, error } = await query.select()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to mark notifications as read' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Marked ${data?.length || 0} notifications as read`,
      markedCount: data?.length || 0
    })
  } catch (error) {
    console.error('Mark as read error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: Delete notifications
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate the request
    const auth = await authenticateRequest(request)

    if (!auth.success || !auth.user) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = auth.user.id
    const isGuestUser = auth.user.isGuest

    const body = await request.json()
    const { notificationIds, deleteAll } = deleteNotificationsSchema.parse(body)

    // Use service client for guest users to bypass RLS
    const supabase = isGuestUser ? createServerClient() : getServerClient()

    let query = supabase
      .from('user_notifications')
      .delete()
      .eq('user_id', userId)

    // Delete specific notifications or all notifications
    if (deleteAll) {
      // No additional filter needed - delete all for this user
    } else if (notificationIds && notificationIds.length > 0) {
      query = query.in('id', notificationIds)
    } else {
      return NextResponse.json(
        { error: 'Either notificationIds or deleteAll must be provided' },
        { status: 400 }
      )
    }

    const { data, error } = await query.select()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete notifications' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${data?.length || 0} notifications`,
      deletedCount: data?.length || 0
    })
  } catch (error) {
    console.error('Delete notifications error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT: Create a new notification (for system-generated notifications)
export async function PUT(request: NextRequest) {
  try {
    // Authenticate the request
    const auth = await authenticateRequest(request)

    if (!auth.success || !auth.user) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = auth.user.id
    const isGuestUser = auth.user.isGuest

    const body = await request.json()
    const { type, title, message, data } = createNotificationSchema.parse(body)

    // Use service client for guest users to bypass RLS
    const supabase = isGuestUser ? createServerClient() : getServerClient()

    const { data: notification, error } = await supabase
      .from('user_notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        data,
        is_read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create notification' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Notification created successfully',
      notification
    })
  } catch (error) {
    console.error('Create notification error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
