-- Row Level Security (RLS) policies for FPL AI Advisor application

-- Users table policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (triggered by signup)
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User teams table policies
-- Users can view their own teams
CREATE POLICY "Users can view own teams" ON public.user_teams
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own teams
CREATE POLICY "Users can insert own teams" ON public.user_teams
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own teams
CREATE POLICY "Users can update own teams" ON public.user_teams
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own teams
CREATE POLICY "Users can delete own teams" ON public.user_teams
  FOR DELETE USING (auth.uid() = user_id);

-- User notifications table policies
-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON public.user_notifications
  FOR SELECT USING (auth.uid() = user_id);

-- System can insert notifications for any user
CREATE POLICY "System can insert notifications" ON public.user_notifications
  FOR INSERT WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON public.user_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" ON public.user_notifications
  FOR DELETE USING (auth.uid() = user_id);

-- User events table policies
-- Users can view their own events
CREATE POLICY "Users can view own events" ON public.user_events
  FOR SELECT USING (auth.uid() = user_id);

-- System can insert events for any user
CREATE POLICY "System can insert events" ON public.user_events
  FOR INSERT WITH CHECK (true);

-- Leagues table policies
-- Everyone can view public league information
CREATE POLICY "Everyone can view leagues" ON public.leagues
  FOR SELECT USING (true);

-- Authenticated users can create leagues
CREATE POLICY "Authenticated users can create leagues" ON public.leagues
  FOR INSERT WITH CHECK (auth.uid() = admin_user_id);

-- League admins can update their leagues
CREATE POLICY "League admins can update own leagues" ON public.leagues
  FOR UPDATE USING (auth.uid() = admin_user_id);

-- League admins can delete their leagues
CREATE POLICY "League admins can delete own leagues" ON public.leagues
  FOR DELETE USING (auth.uid() = admin_user_id);

-- League memberships table policies
-- Everyone can view league memberships
CREATE POLICY "Everyone can view league memberships" ON public.league_memberships
  FOR SELECT USING (true);

-- Users can insert their own league memberships
CREATE POLICY "Users can insert own league memberships" ON public.league_memberships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own league memberships
CREATE POLICY "Users can update own league memberships" ON public.league_memberships
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own league memberships
CREATE POLICY "Users can delete own league memberships" ON public.league_memberships
  FOR DELETE USING (auth.uid() = user_id);

-- Advisor chats table policies
-- Users can view their own chat history
CREATE POLICY "Users can view own chats" ON public.advisor_chats
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own chats
CREATE POLICY "Users can insert own chats" ON public.advisor_chats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own chats
CREATE POLICY "Users can update own chats" ON public.advisor_chats
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own chats
CREATE POLICY "Users can delete own chats" ON public.advisor_chats
  FOR DELETE USING (auth.uid() = user_id);

-- Injury data table policies
-- Everyone can view injury data
CREATE POLICY "Everyone can view injury data" ON public.injury_data
  FOR SELECT USING (true);

-- Authenticated users can insert injury data
CREATE POLICY "Authenticated users can insert injury data" ON public.injury_data
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Authenticated users can update injury data
CREATE POLICY "Authenticated users can update injury data" ON public.injury_data
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Authenticated users can delete injury data
CREATE POLICY "Authenticated users can delete injury data" ON public.injury_data
  FOR DELETE USING (auth.role() = 'authenticated');