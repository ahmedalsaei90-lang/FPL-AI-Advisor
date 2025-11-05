-- Fix notifications table for guest users
-- This migration updates the RLS policies to allow guest users to access notifications

-- First, let's ensure the table exists with the correct structure
DO $$
BEGIN
  -- Check if table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'user_notifications' 
    AND table_schema = 'public'
  ) THEN
    -- Table doesn't exist, create it
    CREATE TABLE public.user_notifications (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      data JSONB,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON public.user_notifications(is_read);
    
    RAISE NOTICE 'Created user_notifications table';
  ELSE
    -- Table exists, check if it has the correct columns
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'user_notifications' 
      AND table_schema = 'public'
      AND column_name = 'user_id'
    ) THEN
      -- Table has correct structure, just update RLS policies
      RAISE NOTICE 'Table user_notifications already exists with correct structure';
    END IF;
  END IF;
END $$;

-- Now update RLS policies to support guest users
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own notifications" ON public.user_notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.user_notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.user_notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.user_notifications;

-- Create new policies that support both authenticated and guest users
CREATE POLICY "Users can view own notifications" ON public.user_notifications
  FOR SELECT USING (
    auth.uid() = user_id OR 
    user_id IN (SELECT id FROM public.users WHERE is_guest = true AND email = 'guest@fpl-advisor.com')
  );

CREATE POLICY "Users can update own notifications" ON public.user_notifications
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    user_id IN (SELECT id FROM public.users WHERE is_guest = true AND email = 'guest@fpl-advisor.com')
  );

CREATE POLICY "Users can delete own notifications" ON public.user_notifications
  FOR DELETE USING (
    auth.uid() = user_id OR 
    user_id IN (SELECT id FROM public.users WHERE is_guest = true AND email = 'guest@fpl-advisor.com')
  );

CREATE POLICY "System can insert notifications" ON public.user_notifications
  FOR INSERT WITH CHECK (true);