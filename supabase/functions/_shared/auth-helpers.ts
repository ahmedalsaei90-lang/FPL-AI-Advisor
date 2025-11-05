import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to create a user profile in the database after authentication
export async function createUserProfile(supabaseClient: any, user: any, additionalData: any = {}) {
  try {
    const { data, error } = await supabaseClient
      .from('users')
      .insert({
        id: user.id,
        email: user.email,
        name: additionalData.name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        fpl_team_id: additionalData.fpl_team_id || null,
        fpl_team_name: additionalData.fpl_team_name || null,
        is_guest: false,
        last_active_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating user profile:', error)
      return { data: null, error }
    }

    // Create user event for signup
    await supabaseClient
      .from('user_events')
      .insert({
        user_id: user.id,
        event_type: 'user_signup',
        event_data: {
          timestamp: new Date().toISOString(),
          email: user.email,
        },
      })

    return { data, error: null }
  } catch (error) {
    console.error('Error in createUserProfile:', error)
    return { data: null, error }
  }
}

// Helper function to handle CORS
export function handleCors(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
}

// Helper function to create Supabase client
export function createSupabaseClient(req: Request) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    global: {
      headers: { Authorization: req.headers.get('Authorization')! },
    },
  })
}

// Helper function to get user from request
export async function getUserFromRequest(supabaseClient: any, req: Request) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return { user: null, error: 'No authorization header' }
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabaseClient.auth.getUser(token)

    if (error) {
      return { user: null, error: error.message }
    }

    return { user, error: null }
  } catch (error) {
    return { user: null, error: error.message }
  }
}

