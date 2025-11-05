-- Initial schema for FPL AI Advisor application

-- Users table to extend auth.users with additional profile information
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  fpl_team_id INTEGER,
  fpl_team_name TEXT,
  is_guest BOOLEAN DEFAULT FALSE,
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User teams table to store FPL team data
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

-- User notifications table
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

-- User events table for tracking user actions
CREATE TABLE IF NOT EXISTS public.user_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leagues table
CREATE TABLE IF NOT EXISTS public.leagues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fpl_league_id INTEGER UNIQUE NOT NULL,
  league_name TEXT NOT NULL,
  league_type TEXT NOT NULL, -- 'classic' or 'h2h'
  admin_user_id UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- League memberships table
CREATE TABLE IF NOT EXISTS public.league_memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  fpl_team_id INTEGER NOT NULL,
  team_name TEXT NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(league_id, user_id)
);

-- Advisor chat history table
CREATE TABLE IF NOT EXISTS public.advisor_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  messages JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Injury data table
CREATE TABLE IF NOT EXISTS public.injury_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id INTEGER NOT NULL,
  player_name TEXT NOT NULL,
  player_team TEXT NOT NULL,
  injury_type TEXT,
  expected_return DATE,
  status TEXT NOT NULL, -- 'injured', 'doubtful', 'available'
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_fpl_team_id ON public.users(fpl_team_id);
CREATE INDEX IF NOT EXISTS idx_user_teams_user_id ON public.user_teams(user_id);
CREATE INDEX IF NOT EXISTS idx_user_teams_fpl_team_id ON public.user_teams(fpl_team_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON public.user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_user_events_user_id ON public.user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_leagues_fpl_league_id ON public.leagues(fpl_league_id);
CREATE INDEX IF NOT EXISTS idx_league_memberships_league_id ON public.league_memberships(league_id);
CREATE INDEX IF NOT EXISTS idx_league_memberships_user_id ON public.league_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_advisor_chats_user_id ON public.advisor_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_advisor_chats_session_id ON public.advisor_chats(session_id);
CREATE INDEX IF NOT EXISTS idx_injury_data_player_id ON public.injury_data(player_id);
CREATE INDEX IF NOT EXISTS idx_injury_data_status ON public.injury_data(status);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.injury_data ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_user_teams_updated_at
  BEFORE UPDATE ON public.user_teams
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_leagues_updated_at
  BEFORE UPDATE ON public.leagues
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_advisor_chats_updated_at
  BEFORE UPDATE ON public.advisor_chats
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_injury_data_updated_at
  BEFORE UPDATE ON public.injury_data
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();