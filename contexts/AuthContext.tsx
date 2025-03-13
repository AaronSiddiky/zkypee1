"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { supabase } from "../lib/supabase";
import { Session, User } from "@supabase/supabase-js";
import { trackSignup, trackTrialConversion } from "@/lib/analytics";
import { linkTrialToUser } from "@/lib/trial-limitations";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  signOut: () => Promise<void>;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
};

// Fixed session timeout in minutes (not configurable by users)
const SESSION_TIMEOUT_MINUTES = 45;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to get the base URL with a fallback to window.location.origin
function getBaseUrl() {
  if (typeof window !== "undefined") {
    // Use environment variable if available, otherwise fallback to window.location.origin
    return process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
  }
  return process.env.NEXT_PUBLIC_BASE_URL || "";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const activityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Reset the activity timer and schedule the next check
  const resetActivityTimer = () => {
    lastActivityRef.current = Date.now();

    // Clear existing timeout if any
    if (activityTimerRef.current) {
      clearTimeout(activityTimerRef.current);
      activityTimerRef.current = null;
    }

    // Only set a new timer if the user is logged in
    if (user) {
      // Convert minutes to milliseconds
      const timeoutDuration = SESSION_TIMEOUT_MINUTES * 60 * 1000;

      activityTimerRef.current = setTimeout(() => {
        const currentTime = Date.now();
        const timeSinceLastActivity = currentTime - lastActivityRef.current;

        // If inactive for longer than the timeout, log the user out
        if (timeSinceLastActivity >= timeoutDuration) {
          console.log(
            `Session timeout after ${SESSION_TIMEOUT_MINUTES} minutes of inactivity`
          );
          signOut();
        }
      }, timeoutDuration);
    }
  };

  // Set up activity listeners
  useEffect(() => {
    if (typeof window !== "undefined" && user) {
      // Array of events to track user activity
      const activityEvents = [
        "mousedown",
        "mousemove",
        "keydown",
        "scroll",
        "touchstart",
        "click",
      ];

      // Add listeners for each activity event
      const handleUserActivity = () => resetActivityTimer();

      activityEvents.forEach((event) => {
        window.addEventListener(event, handleUserActivity);
      });

      // Initial timer setup
      resetActivityTimer();

      // Clean up event listeners on unmount
      return () => {
        activityEvents.forEach((event) => {
          window.removeEventListener(event, handleUserActivity);
        });

        if (activityTimerRef.current) {
          clearTimeout(activityTimerRef.current);
        }
      };
    }
  }, [user]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Add sign in function
  const signIn = async (email: string, password: string) => {
    const result = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // When successfully signed in, start the activity timer
    if (result.data.user) {
      resetActivityTimer();
    }

    return result;
  };

  // Modify signUp function to track signup and handle trial conversion
  const signUp = async (
    email: string,
    password: string,
    name?: string
  ): Promise<any> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name || "",
          },
        },
      });

      if (error) throw error;

      // Check if this was a trial conversion
      const fingerprint = localStorage.getItem("zkypee_trial_fingerprint");
      const isTrialConversion = !!fingerprint;

      if (data.user) {
        // Track signup event
        await trackSignup(
          data.user.id,
          isTrialConversion ? "trial_conversion" : "email"
        );

        // If this was a trial conversion, link the trial usage to the new user
        if (isTrialConversion) {
          try {
            await linkTrialToUser(fingerprint, data.user.id);

            // Track trial conversion
            await trackTrialConversion(fingerprint, data.user.id);

            // Clear trial fingerprint after successful conversion
            localStorage.removeItem("zkypee_trial_fingerprint");
          } catch (linkError) {
            console.error("Error linking trial to user:", linkError);
          }
        }
      }

      return data;
    } catch (error) {
      console.error("Error signing up:", error);
      throw error;
    }
  };

  const signOut = async () => {
    // Clear any existing timeout
    if (activityTimerRef.current) {
      clearTimeout(activityTimerRef.current);
      activityTimerRef.current = null;
    }

    await supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    signOut,
    loading,
    signIn,
    signUp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
