"use client";

import { getBrowserClient } from "@/lib/supabase";
import { createContext, useContext, useEffect, useState } from "react";

// Create auth context
interface AuthContextType {
  user: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

// Define user profile type based on database schema
interface UserProfile {
  id: string;
  email: string;
  name: string;
  fplTeamId?: number;
  fplTeamName?: string;
  isGuest?: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
                // First check localStorage for guest users (this should take priority)
        const localStorageUser = localStorage.getItem('user');
                if (localStorageUser) {
          try {
            const parsedUser = JSON.parse(localStorageUser);
                                                            // Validate that the user object has the required properties
            if (parsedUser && parsedUser.id && parsedUser.email) {
                            // Ensure the user object has the correct structure for both regular and guest users
              const normalizedUser = {
                id: parsedUser.id,
                email: parsedUser.email,
                name: parsedUser.name || parsedUser.email?.split('@')[0] || 'User',
                fplTeamId: parsedUser.fplTeamId,
                fplTeamName: parsedUser.fplTeamName,
                isGuest: parsedUser.isGuest || false
              };
              
                                          setUser(normalizedUser);
                            // Update localStorage with normalized user to ensure consistency
              localStorage.setItem('user', JSON.stringify(normalizedUser));
              
              // Skip Supabase session check for guest users
              setLoading(false);
              return;
            } else {
                                          localStorage.removeItem('user'); // Clear invalid data
            }
          } catch (error) {
            console.error('AuthProvider: Error parsing user from localStorage:', error);
            localStorage.removeItem('user'); // Clear invalid data
          }
        }
        
        // If no valid localStorage user, check for existing Supabase session with timeout
                // Add timeout for Supabase client creation
        let supabase;
        try {
          const supabasePromise = Promise.resolve().then(() => getBrowserClient());
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Supabase client initialization timeout')), 5000)
          );
          supabase = await Promise.race([supabasePromise, timeoutPromise]);
                  } catch (error) {
          console.error('AuthProvider: Failed to get Supabase client:', error);
          setLoading(false);
          return;
        }
        
        // Add timeout for session check
        let session;
        try {
          const sessionPromise = supabase.auth.getSession();
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Session check timeout')), 5000)
          );
          const result = await Promise.race([sessionPromise, timeoutPromise]);
          session = result.data.session;
                  } catch (error) {
          console.error('AuthProvider: Session check failed:', error);
          setLoading(false);
          return;
        }
        
        if (session?.user) {
          // Add timeout for profile fetch
          try {
            const profilePromise = supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
            );
            const { data: profile } = await Promise.race([profilePromise, timeoutPromise]);
            
            if (profile) {
              const userData = {
                id: session.user.id,
                email: session.user.email,
                name: (profile as any).name || session.user.user_metadata?.display_name || session.user.email?.split('@')[0],
                fplTeamId: (profile as any).fplTeamId,
                fplTeamName: (profile as any).fplTeamName,
                isGuest: false
              };
             
                            setUser(userData);
              // Update localStorage for backward compatibility
              localStorage.setItem('user', JSON.stringify(userData));
            }
          } catch (error) {
            console.error('AuthProvider: Profile fetch failed:', error);
            // Continue without profile data
            const userData = {
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.display_name || session.user.email?.split('@')[0],
              isGuest: false
            };
            
                        setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          }
        } else {
                  }
      } catch (error) {
        console.error('AuthProvider: Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for storage changes (for cross-tab synchronization)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
                if (e.newValue) {
          const parsedUser = JSON.parse(e.newValue);
          setUser(parsedUser);
        } else {
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    const handleLocalUserUpdate = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('AuthProvider: Failed to process local user update event:', error);
      }
    };

    window.addEventListener('auth:user-updated', handleLocalUserUpdate);

    // Listen for auth changes
        const supabase = getBrowserClient();
    const { data } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem('user');
        } else if (event === 'SIGNED_IN' && session?.user) {
          // Get user profile from database
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profile) {
            const userData = {
              id: session.user.id,
              email: session.user.email,
              name: (profile as any).name || session.user.user_metadata?.display_name || session.user.email?.split('@')[0],
              fplTeamId: (profile as any).fplTeamId,
              fplTeamName: (profile as any).fplTeamName,
              isGuest: false  // Authenticated users are NEVER guests
            };

            setUser(userData);
            // Update localStorage for backward compatibility
            localStorage.setItem('user', JSON.stringify(userData));
          }
        } else if (event === 'TOKEN_REFRESHED') {
          // Handle token refresh - just update the session
                  }
      }
    );

    const subscription = data?.subscription;

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth:user-updated', handleLocalUserUpdate);
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
            const supabase = getBrowserClient();
      await supabase.auth.signOut();
      setUser(null);
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
