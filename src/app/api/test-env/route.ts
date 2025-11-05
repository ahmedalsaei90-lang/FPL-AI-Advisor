import { NextResponse } from 'next/server'

/**
 * Test endpoint to verify environment variables are loaded correctly
 * Access: GET /api/test-env
 *
 * This endpoint helps diagnose deployment issues by showing which
 * environment variables are properly configured.
 *
 * IMPORTANT: Remove or protect this endpoint in production!
 */
export async function GET() {
  const envCheck = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? `✓ Set (${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...)`
      : '✗ MISSING',

    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? `✓ Set (${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...)`
      : '✗ MISSING',

    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
      ? `✓ Set (${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...)`
      : '✗ MISSING',

    API_KEY: process.env.API_KEY
      ? `✓ Set (${process.env.API_KEY.substring(0, 15)}...)`
      : '✗ MISSING',

    NODE_ENV: process.env.NODE_ENV || 'undefined',

    allSet: !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.API_KEY
    )
  }

  return NextResponse.json({
    status: envCheck.allSet ? 'All environment variables configured ✓' : 'Some environment variables missing ✗',
    environment: envCheck,
    timestamp: new Date().toISOString(),
    warning: 'REMOVE THIS ENDPOINT IN PRODUCTION - it exposes partial env var values'
  })
}
