import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Create users table
    const { error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1)
    
    if (usersError && usersError.code === 'PGRST116') {
      // Table doesn't exist, create it
      const { error: createUsersError } = await supabase
        .from('users')
        .select('*')
        .limit(1)
      
      if (createUsersError) {
        console.error('Error creating users table:', createUsersError)
      } else {
              }
    } else if (usersError) {
      console.error('Error checking users table:', usersError)
    } else {
          }
    
    // Create user_notifications table
    const { error: notificationsError } = await supabase
      .from('user_notifications')
      .select('*')
      .limit(1)
    
    if (notificationsError && notificationsError.code === 'PGRST116') {
      // Table doesn't exist, create it
      const { error: createNotificationsError } = await supabase.rpc('sql', {
        query: `
          CREATE TABLE IF NOT EXISTS public.user_notifications (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            data JSONB,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      })
      
      if (createNotificationsError) {
        console.error('Error creating notifications table:', createNotificationsError)
      } else {
              }
    } else if (notificationsError) {
      console.error('Error checking notifications table:', notificationsError)
    } else {
          }
    
    // Create user_teams table
    const { error: teamsError } = await supabase
      .from('user_teams')
      .select('*')
      .limit(1)
    
    if (teamsError && teamsError.code === 'PGRST116') {
      // Table doesn't exist, create it
      const { error: createTeamsError } = await supabase.rpc('sql', {
        query: `
          CREATE TABLE IF NOT EXISTS public.user_teams (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
            fpl_team_id INTEGER NOT NULL,
            team_name TEXT NOT NULL,
            current_squad JSONB,
            bank_value DECIMAL(10,2) DEFAULT 0.0,
            team_value DECIMAL(10,2) DEFAULT 0.0,
            total_points INTEGER DEFAULT 0,
            overall_rank INTEGER,
            free_transfers INTEGER DEFAULT 1,
            chips_used JSONB DEFAULT '[]'::jsonb,
            sync_status TEXT DEFAULT 'pending',
            last_sync_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, fpl_team_id)
          );
        `
      })
      
      if (createTeamsError) {
        console.error('Error creating teams table:', createTeamsError)
      } else {
              }
    } else if (teamsError) {
      console.error('Error checking teams table:', teamsError)
    } else {
          }
    
    // Create user_events table
    const { error: eventsError } = await supabase
      .from('user_events')
      .select('*')
      .limit(1)
    
    if (eventsError && eventsError.code === 'PGRST116') {
      // Table doesn't exist, create it
      const { error: createEventsError } = await supabase.rpc('sql', {
        query: `
          CREATE TABLE IF NOT EXISTS public.user_events (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
            event_type TEXT NOT NULL,
            event_data JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      })
      
      if (createEventsError) {
        console.error('Error creating events table:', createEventsError)
      } else {
              }
    } else if (eventsError) {
      console.error('Error checking events table:', eventsError)
    } else {
          }
    
    // Create indexes
    await supabase.rpc('sql', {
      query: `
        CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
        CREATE INDEX IF NOT EXISTS idx_users_fpl_team_id ON public.users(fpl_team_id);
        CREATE INDEX IF NOT EXISTS idx_user_teams_user_id ON public.user_teams(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_teams_fpl_team_id ON public.user_teams(fpl_team_id);
        CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON public.user_notifications(is_read);
        CREATE INDEX IF NOT EXISTS idx_user_events_user_id ON public.user_events(user_id);
      `
    })
    
    return NextResponse.json({
      message: 'Database initialization completed',
      errors: {
        users: usersError?.message,
        notifications: notificationsError?.message,
        teams: teamsError?.message,
        events: eventsError?.message
      }
    })
  } catch (error) {
    console.error('Database initialization error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize database' },
      { status: 500 }
    )
  }
}