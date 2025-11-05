-- Final fix for guest user functionality
-- This migration properly handles the guest user setup without breaking the primary key

-- First, let's create a function to handle guest user creation
CREATE OR REPLACE FUNCTION create_guest_user_if_not_exists()
RETURNS void AS $$
DECLARE
  guest_user_id UUID;
BEGIN
  -- Check if guest user already exists
  SELECT id INTO guest_user_id 
  FROM public.users 
  WHERE email = 'guest@fpl-advisor.com' AND is_guest = true;
  
  -- If guest user doesn't exist, create it
  IF guest_user_id IS NULL THEN
    -- Generate a UUID for the guest user
    guest_user_id := gen_random_uuid();
    
    -- Insert the guest user
    INSERT INTO public.users (
      id,
      email,
      name,
      fpl_team_id,
      fpl_team_name,
      is_guest,
      last_active_at,
      created_at,
      updated_at
    ) VALUES (
      guest_user_id,
      'guest@fpl-advisor.com',
      'Guest User',
      999999,
      'Guest FC',
      true,
      NOW(),
      NOW(),
      NOW()
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION create_guest_user_if_not_exists() TO authenticated;
GRANT EXECUTE ON FUNCTION create_guest_user_if_not_exists() TO service_role;

-- Create a function to get or create guest user
CREATE OR REPLACE FUNCTION get_or_create_guest_user()
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  fpl_team_id INTEGER,
  fpl_team_name TEXT,
  is_guest BOOLEAN,
  last_active_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Try to get existing guest user
  RETURN QUERY
  SELECT * FROM public.users 
  WHERE email = 'guest@fpl-advisor.com' AND is_guest = true;
  
  -- If no guest user found, create one
  IF NOT FOUND THEN
    PERFORM create_guest_user_if_not_exists();
    
    -- Return the newly created guest user
    RETURN QUERY
    SELECT * FROM public.users 
    WHERE email = 'guest@fpl-advisor.com' AND is_guest = true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION get_or_create_guest_user() TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_guest_user() TO service_role;

-- Update RLS policies to properly handle guest users
-- Drop existing notification policies
DROP POLICY IF EXISTS "Users can view own notifications" ON public.user_notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.user_notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.user_notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.user_notifications;

-- Create new policies that support both authenticated and guest users
CREATE POLICY "Users can view own notifications" ON public.user_notifications
  FOR SELECT USING (
    auth.uid() = user_id OR 
    (user_id IN (SELECT id FROM public.users WHERE is_guest = true AND email = 'guest@fpl-advisor.com') AND 
     EXISTS (SELECT 1 FROM public.users WHERE email = 'guest@fpl-advisor.com' AND is_guest = true))
  );

CREATE POLICY "Users can update own notifications" ON public.user_notifications
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    (user_id IN (SELECT id FROM public.users WHERE is_guest = true AND email = 'guest@fpl-advisor.com') AND 
     EXISTS (SELECT 1 FROM public.users WHERE email = 'guest@fpl-advisor.com' AND is_guest = true))
  );

CREATE POLICY "Users can delete own notifications" ON public.user_notifications
  FOR DELETE USING (
    auth.uid() = user_id OR 
    (user_id IN (SELECT id FROM public.users WHERE is_guest = true AND email = 'guest@fpl-advisor.com') AND 
     EXISTS (SELECT 1 FROM public.users WHERE email = 'guest@fpl-advisor.com' AND is_guest = true))
  );

CREATE POLICY "System can insert notifications" ON public.user_notifications
  FOR INSERT WITH CHECK (true);

-- Create the guest user immediately
SELECT create_guest_user_if_not_exists();