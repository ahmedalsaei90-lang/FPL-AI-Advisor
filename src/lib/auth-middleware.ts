import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Types for authenticated user
export interface AuthenticatedUser {
  id: string
  email: string
}

// Authentication result
export interface AuthResult {
  success: boolean
  user?: AuthenticatedUser
  error?: string
}

/**
 * Authenticate a Next.js API request using Supabase JWT token
 *
 * @param request - Next.js request object
 * @returns AuthResult with user data or error
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const auth = await authenticateRequest(request)
 *   if (!auth.success) {
 *     return NextResponse.json({ error: auth.error }, { status: 401 })
 *   }
 *   // Use auth.user.id for queries
 * }
 * ```
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  try {
    // Get Authorization header
    const authHeader = request.headers.get('authorization')

    if (!authHeader) {
      return {
        success: false,
        error: 'Missing authorization header'
      }
    }

    // Extract Bearer token
    const token = authHeader.replace('Bearer ', '').trim()

    if (!token) {
      return {
        success: false,
        error: 'Invalid authorization header format'
      }
    }

    // Validate environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[Auth Middleware] Missing Supabase environment variables')
      return {
        success: false,
        error: 'Server configuration error'
      }
    }

    // Create Supabase client with the user's token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })

    // Validate the JWT token and get user
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return {
        success: false,
        error: 'Invalid or expired token'
      }
    }

    // Get user profile details
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', user.id)
      .single()

    if (userError) {
      console.error('[Auth Middleware] Error fetching user data:', userError)
      // Continue with basic auth if user profile fetch fails
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email || ''
        }
      }
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: userData?.email || user.email || ''
      }
    }
  } catch (error) {
    console.error('[Auth Middleware] Authentication error:', error)
    return {
      success: false,
      error: 'Authentication failed'
    }
  }
}

/**
 * Middleware wrapper for API routes that require authentication
 *
 * @param handler - The API route handler function
 * @returns Wrapped handler with authentication
 *
 * @example
 * ```typescript
 * export const GET = withAuth(async (request, { user }) => {
 *   // user is guaranteed to be authenticated
 *   const userId = user.id
 *   // ... your logic
 *   return NextResponse.json({ data })
 * })
 * ```
 */
export function withAuth(
  handler: (
    request: NextRequest,
    context: { user: AuthenticatedUser }
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const auth = await authenticateRequest(request)

    if (!auth.success || !auth.user) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      )
    }

    return handler(request, { user: auth.user })
  }
}

/**
 * Optional authentication - allows both authenticated and unauthenticated requests
 * Useful for endpoints that have different behavior for authenticated users
 *
 * @param request - Next.js request object
 * @returns AuthResult (success can be false for unauthenticated)
 */
export async function optionalAuth(request: NextRequest): Promise<AuthResult> {
  const authHeader = request.headers.get('authorization')

  // No auth header means unauthenticated request (valid for public endpoints)
  if (!authHeader) {
    return {
      success: false,
      error: 'No authentication provided'
    }
  }

  // If auth header exists, validate it
  return authenticateRequest(request)
}
