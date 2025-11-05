import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the user from the request
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse the request body
    const { name, fplTeamId, fplTeamName, isGuest } = await req.json()

    // Check if user profile already exists
    const { data: existingProfile } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (existingProfile) {
      return new Response(
        JSON.stringify({ error: 'User profile already exists' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create user profile
    const { data, error } = await supabaseClient
      .from('users')
      .insert({
        id: user.id,
        email: user.email,
        name: name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        fpl_team_id: fplTeamId || null,
        fpl_team_name: fplTeamName || null,
        is_guest: isGuest || false,
        last_active_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating user profile:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create user event for signup
    await supabaseClient
      .from('user_events')
      .insert({
        user_id: user.id,
        event_type: isGuest ? 'guest_signup' : 'user_signup',
        event_data: {
          timestamp: new Date().toISOString(),
          email: user.email,
        },
      })

    return new Response(
      JSON.stringify({ 
        message: 'User profile created successfully',
        user: data 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error in create-user-profile function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})