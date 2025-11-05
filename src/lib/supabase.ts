import { createClient } from '@supabase/supabase-js'
import type { User, Session } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Singleton instance for browser-side usage
let browserClient: ReturnType<typeof createClient> | null = null

// Create a Supabase client for use in the browser (singleton pattern)
export const getBrowserClient = () => {
  if (!browserClient) {
    console.log('Creating new Supabase browser client instance (singleton)');
            try {
      const startTime = Date.now();
      browserClient = createClient(supabaseUrl, supabaseAnonKey);
      console.log(`Supabase client created in ${Date.now() - startTime}ms`);
    } catch (error) {
      console.error('Error creating Supabase client:', error);
      throw error;
    }
  }
  return browserClient
}

// Keep the old function for backward compatibility but mark as deprecated
export const createBrowserClient = () => {
  console.warn('[DEPRECATED] createBrowserClient is deprecated. Use getBrowserClient instead.');
  return getBrowserClient();
}

// Create a Supabase client for use in server-side code
export const createServerClient = () => {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Singleton instance for server-side usage
let serverClient: ReturnType<typeof createServerClient> | null = null

export const getServerClient = () => {
  if (!serverClient) {
    serverClient = createServerClient()
  }
  return serverClient
}

// Auth helper functions
export const signUp = async (email: string, password: string, displayName?: string) => {
  const supabase = getBrowserClient()
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName || email.split('@')[0]
      }
    }
  })
  
  if (error) {
    throw error
  }
  
  return data
}

export const signIn = async (email: string, password: string) => {
  const supabase = getBrowserClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) {
    throw error
  }
  
  return data
}

export const signOut = async () => {
  const supabase = getBrowserClient()
  
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    throw error
  }
}

export const getCurrentUser = async (): Promise<User | null> => {
  const supabase = getBrowserClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  return user
}

export const getSession = async (): Promise<Session | null> => {
  const supabase = getBrowserClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  return session
}

// Server-side auth functions
export const createServerAuthClient = () => {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export const serverSignUp = async (email: string, password: string, displayName?: string) => {
    try {
    const supabase = createServerAuthClient()
            const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName || email.split('@')[0]
      }
    })
    
        if (error) {
      console.error('serverSignUp: Auth error:', error);
      throw error
    }
    
    // Create user profile in the database
    if (data.user) {
            // Add a small delay to ensure the auth user is fully created
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.display_name || email.split('@')[0],
          created_at: new Date().toISOString()
        })
      
            if (profileError) {
        console.error('serverSignUp: Profile error:', profileError);
        // Don't throw here - the auth user was created successfully
        // Just log the error and continue
        console.warn('serverSignUp: User profile creation failed, but auth user was created');
      }
    }
    
        return data
  } catch (error) {
    console.error('serverSignUp: Unexpected error in signup process:', error);
    throw error
  }
}

export const serverSignIn = async (email: string, password: string) => {
    try {
    const supabase = createServerAuthClient()
            const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
        if (error) {
      console.error('serverSignIn: Auth error:', error);
      throw error
    }
    
    // Update last active timestamp
    if (data.user) {
            const { error: updateError } = await supabase
        .from('users')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', data.user.id)
      
      if (updateError) {
        console.error('serverSignIn: Error updating last active timestamp:', updateError);
        // Don't throw here - login was successful
      }

      // Create login event
            const { error: eventError } = await supabase
        .from('user_events')
        .insert({
          user_id: data.user.id,
          event_type: 'login',
          event_data: JSON.stringify({
            timestamp: new Date().toISOString()
          })
        })
      
      if (eventError) {
        console.error('serverSignIn: Error creating login event:', eventError);
        // Don't throw here - login was successful
      }
    }
    
        return data
  } catch (error) {
    console.error('serverSignIn: Unexpected error in sign in process:', error);
    throw error
  }
}
