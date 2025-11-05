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
    // Create a Supabase client with the service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Create or get guest user
    const { data: existingGuestUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', 'guest@fpl-advisor.com')
      .single()
    
    let guestUser = existingGuestUser

    if (!guestUser) {
      // Create guest user in auth
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: 'guest@fpl-advisor.com',
        password: 'guest-password-12345',
        email_confirm: true,
        user_metadata: {
          name: 'Guest User',
          is_guest: true
        }
      })

      if (authError) {
        console.error('Error creating guest auth user:', authError)
        return new Response(
          JSON.stringify({ error: 'Failed to create guest user' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Create guest user profile
      const { data: newGuestUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authUser.user.id,
          email: 'guest@fpl-advisor.com',
          name: 'Guest User',
          fpl_team_id: 999999,
          fpl_team_name: 'Guest FC',
          is_guest: true,
          last_active_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (createError) {
        console.error('Error creating guest user profile:', createError)
        return new Response(
          JSON.stringify({ error: 'Failed to create guest profile' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      guestUser = newGuestUser
    }

    // Get guest user's teams
    const { data: teams } = await supabaseAdmin
      .from('user_teams')
      .select('*')
      .eq('user_id', guestUser.id)

    // Check if guest user has team data
    if (!teams || teams.length === 0) {
      // Update user with team info
      await supabaseAdmin
        .from('users')
        .update({
          fpl_team_id: 999999,
          fpl_team_name: 'Guest FC',
          last_active_at: new Date().toISOString()
        })
        .eq('id', guestUser.id)

      // Create guest team data
      await supabaseAdmin
        .from('user_teams')
        .insert({
          user_id: guestUser.id,
          fpl_team_id: 999999,
          team_name: 'Guest FC',
          current_squad: JSON.stringify([
            { id: 1, name: "Guest Keeper", position: "GK", team: "Arsenal", cost: 4.5, points: 25, form: 5.2, selectedBy: 10.5 },
            { id: 2, name: "Guest Defender", position: "DEF", team: "Chelsea", cost: 5.5, points: 35, form: 6.1, selectedBy: 15.2 },
            { id: 3, name: "Guest Midfielder", position: "MID", team: "Liverpool", cost: 7.0, points: 45, form: 7.8, selectedBy: 25.3 },
            { id: 4, name: "Guest Forward", position: "FWD", team: "Man City", cost: 9.0, points: 55, form: 8.5, selectedBy: 35.7 },
            { id: 5, name: "Guest Player 2", position: "DEF", team: "Man United", cost: 5.0, points: 30, form: 4.5, selectedBy: 12.1 },
            { id: 6, name: "Guest Player 3", position: "MID", team: "Tottenham", cost: 6.5, points: 40, form: 5.8, selectedBy: 18.9 },
            { id: 7, name: "Guest Player 4", position: "FWD", team: "Newcastle", cost: 6.0, points: 38, form: 6.2, selectedBy: 22.4 },
            { id: 8, name: "Guest Player 5", position: "GK", team: "Brighton", cost: 4.0, points: 20, form: 3.8, selectedBy: 8.7 },
            { id: 9, name: "Guest Defender 2", position: "DEF", team: "Leicester", cost: 4.5, points: 28, form: 4.2, selectedBy: 9.8 },
            { id: 10, name: "Guest Midfielder 2", position: "MID", team: "West Ham", cost: 5.5, points: 32, form: 5.1, selectedBy: 14.3 },
            { id: 11, name: "Guest Forward 2", position: "FWD", team: "Aston Villa", cost: 6.5, points: 42, form: 6.8, selectedBy: 19.7 },
            { id: 12, name: "Guest Defender 3", position: "DEF", team: "Crystal Palace", cost: 4.0, points: 22, form: 3.5, selectedBy: 7.2 },
            { id: 13, name: "Guest Midfielder 3", position: "MID", team: "Brentford", cost: 5.0, points: 29, form: 4.8, selectedBy: 11.6 },
            { id: 14, name: "Guest Forward 3", position: "FWD", team: "Fulham", cost: 5.5, points: 31, form: 5.3, selectedBy: 13.4 },
            { id: 15, name: "Guest Keeper 2", position: "GK", team: "Everton", cost: 4.0, points: 18, form: 3.2, selectedBy: 6.9 }
          ]),
          bank_value: 1.8,
          team_value: 102.3,
          total_points: 425,
          overall_rank: 23456,
          free_transfers: 1,
          chips_used: JSON.stringify([]),
          sync_status: 'success'
        })
    } else {
      // Update last active
      await supabaseAdmin
        .from('users')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', guestUser.id)
    }

    // Create guest login event
    await supabaseAdmin
      .from('user_events')
      .insert({
        user_id: guestUser.id,
        event_type: 'guest_login',
        event_data: JSON.stringify({
          timestamp: new Date().toISOString()
        })
      })

    // Generate a guest session token
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: 'guest@fpl-advisor.com'
    })

    if (sessionError) {
      console.error('Error generating guest session:', sessionError)
      return new Response(
        JSON.stringify({ error: 'Failed to generate guest session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        message: 'Guest access granted',
        user: {
          id: guestUser.id,
          email: guestUser.email,
          name: guestUser.name,
          fpl_team_id: 999999,
          fpl_team_name: 'Guest FC',
          is_guest: true
        },
        access_token: sessionData.properties?.access_token
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Guest access error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to create guest session' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})