-- Add RLS policies to support guest users

-- Drop existing notification policies that block guest users
DROP POLICY IF EXISTS "Users can view own notifications" ON public.user_notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.user_notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.user_notifications;

-- Create new policies that support both authenticated and guest users
-- Users can view their own notifications (supports both authenticated and guest users)
CREATE POLICY "Users can view own notifications" ON public.user_notifications
  FOR SELECT USING (
    auth.uid() = user_id OR 
    user_id IN (SELECT id FROM public.users WHERE is_guest = true AND email = 'guest@fpl-advisor.com')
  );

-- Users can update their own notifications (supports both authenticated and guest users)
CREATE POLICY "Users can update own notifications" ON public.user_notifications
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    user_id IN (SELECT id FROM public.users WHERE is_guest = true AND email = 'guest@fpl-advisor.com')
  );

-- Users can delete their own notifications (supports both authenticated and guest users)
CREATE POLICY "Users can delete own notifications" ON public.user_notifications
  FOR DELETE USING (
    auth.uid() = user_id OR 
    user_id IN (SELECT id FROM public.users WHERE is_guest = true AND email = 'guest@fpl-advisor.com')
  );

-- System can still insert notifications for any user
CREATE POLICY "System can insert notifications" ON public.user_notifications
  FOR INSERT WITH CHECK (true);