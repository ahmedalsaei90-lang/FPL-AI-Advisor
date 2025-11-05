import { getBrowserClient } from './supabase'

/**
 * Get the current user's JWT token from Supabase
 * @returns JWT token or null if not authenticated
 */
export async function getAuthToken(): Promise<string | null> {
  const supabase = getBrowserClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

/**
 * Make an authenticated API request
 * Automatically includes the JWT token in Authorization header
 *
 * @param url - API endpoint URL
 * @param options - Fetch options (method, body, etc.)
 * @returns Fetch response
 *
 * @example
 * ```typescript
 * const response = await authenticatedFetch('/api/team/data')
 * const data = await response.json()
 * ```
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken()

  const headers = new Headers(options.headers || {})

  // Add Authorization header with JWT token
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  // Add Content-Type for JSON requests
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(url, {
    ...options,
    headers
  })
}

/**
 * Helper for GET requests
 */
export async function authenticatedGet(url: string): Promise<Response> {
  return authenticatedFetch(url, { method: 'GET' })
}

/**
 * Helper for POST requests
 */
export async function authenticatedPost(
  url: string,
  body?: any
): Promise<Response> {
  return authenticatedFetch(url, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined
  })
}

/**
 * Helper for PUT requests
 */
export async function authenticatedPut(
  url: string,
  body?: any
): Promise<Response> {
  return authenticatedFetch(url, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined
  })
}

/**
 * Helper for DELETE requests
 */
export async function authenticatedDelete(
  url: string,
  body?: any
): Promise<Response> {
  return authenticatedFetch(url, {
    method: 'DELETE',
    body: body ? JSON.stringify(body) : undefined
  })
}
