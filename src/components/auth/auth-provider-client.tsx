"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getBrowserClient } from "@/lib/supabase";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  fplTeamId?: number;
  fplTeamName?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const supabase = getBrowserClient();
      const { data: sessionResult } = await supabase.auth.getSession();
      const session = sessionResult.session;

      if (!session?.user) {
        setUser(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("user");
        }
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profileError) {
        console.error("AuthProvider: Failed to fetch profile:", profileError);
      }

      const userData: UserProfile = {
        id: session.user.id,
        email: session.user.email ?? "",
        name:
          (profile as any)?.name ??
          session.user.user_metadata?.display_name ??
          session.user.email?.split("@")[0] ??
          "User",
        fplTeamId: (profile as any)?.fpl_team_id ?? undefined,
        fplTeamName: (profile as any)?.fpl_team_name ?? undefined,
      };

      setUser(userData);
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(userData));
      }
    } catch (error) {
      console.error("AuthProvider: Failed to refresh user:", error);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      setLoading(true);
      try {
        if (typeof window !== "undefined") {
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            try {
              const parsed = JSON.parse(storedUser) as UserProfile;
              if (isMounted) {
                setUser(parsed);
              }
            } catch {
              localStorage.removeItem("user");
            }
          }
        }

        await refreshUser();
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void initializeAuth();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "user") {
        void refreshUser();
      }
    };

    const handleLocalUpdate = () => {
      void refreshUser();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("auth:user-updated", handleLocalUpdate as EventListener);

    const supabase = getBrowserClient();
    const { data } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("user");
        }
      }
      await refreshUser();
    });

    return () => {
      isMounted = false;
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth:user-updated", handleLocalUpdate as EventListener);
      data?.subscription?.unsubscribe();
    };
  }, [refreshUser]);

  const signOut = useCallback(async () => {
    try {
      const supabase = getBrowserClient();
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
