/**
 * BETWEEN - Supabase Client Configuration
 * 
 * M2 (Lidiya): Backend & Auth setup
 * - Magic-link email authentication
 * - Row Level Security configured in seed.sql
 * - Realtime subscription for match events
 */

import { createClient } from "@supabase/supabase-js";

// Get Supabase URL and anon key from environment
// .env.example: NEXT_PUBLIC_SUPABASE_URL=your_url NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Basic validation - fail fast if missing in production
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Missing Supabase environment variables. " +
    "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env"
  );
}

// Create single supabase client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Magic link flow settings
    autoSignIn: true,
    persistSession: true,
    detectSessionInLocalStorage: true,
    storageKey: "betweensession",
    // Session cookie settings
    sessionToken: void 0,
    // Use email OTP for magic links
    flowType: "pkce",
  },
  // Prevent sending cookies from browser to Supabase (security)
  global: {
    headers: {
      "X-Client-Info": "between-web-1.0",
    },
  },
  // Real-time config
  realtime: {
    timeout: 45000,
    heartbeat: 30000,
  },
});

/**
 * Auth helpers for magic-link flow
 */
export const authHelpers = {
  /**
   * Send magic link to email for sign-in/up
   * @param email User email address
   * @param redirectTo URL to redirect after sign-in (relative to app root)
   */
  signInWithMagicLink: async (email: string, redirectTo: string = "/") => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Send the magic link, redirect user after success
        redirectTo: `${supabaseUrl}/auth/callback?redirect_to=${encodeURIComponent(redirectTo)}`,
      },
    });
    if (error) throw error;
    return { success: true };
  },

  /**
   * Get the current session
   */
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  /**
   * Sign out current user
   */
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  },

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange: (callback: (session: any | null) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};

/**
 * Realtime helpers for match notifications
 */
export const realtimeHelpers = {
  /**
   * Subscribe to match state changes for a specific user/event
   * @param userId The user's auth UUID
   * @param eventId The event ID to listen for
   * @param callback Callback when match state changes
   */
  subscribeToMatchChanges: (
    userId: string, 
    eventId: string, 
    callback: (payload: any) => void
  ) => {
    const channel = supabase
      .channel(`matches_${userId}_${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "matches",
          filter: `user_a=eq.${userId}|user_b=eq.${userId}`,
        },
        (payload) => {
          callback(payload);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "matches",
          filter: `user_a=eq.${userId}|user_b=eq.${userId}`,
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    return channel;
  },

  /**
   * Unsubscribe from a realtime channel
   */
  unsubscribe: (channel: any) => {
    supabase.removeChannel(channel);
  },
};

/**
 * Helper functions for database operations
 */
export const dbHelpers = {
  /**
   * Get current user's profile
   */
  getMyProfile: async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user?.id) return null;

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", session.session.user.id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get events user is member of
   */
  getMyEvents: async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user?.id) return [];

    const { data, error } = await supabase
      .from("event_members")
      .select(`
        events (*)
      `)
      .eq("user_id", session.session.user.id)
      .eq("events.status", "active");

    if (error) throw error;
    return data;
  },

  /**
   * Check if user has open-to-meet status that hasn't expired
   */
  hasOpenToMeet: async (userId: string) => {
    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .eq("state", "pending")
      .maybeSingle();

    if (error) throw error;
    if (!data) return false;

    // Check if expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      // Mark as expired
      await supabase
        .from("matches")
        .update({ state: "expired" })
        .eq("id", data.id);
      return false;
    }

    return true;
  },

  /**
   * Record a preference update for a user
   */
  updatePreferences: async (userId: string, preferences: {
    conversation_types: string[];
    interests: string[];
    vibe_descriptors: string[];
  }) => {
    const { data, error } = await supabase
      .from("preferences")
      .upsert({
        user_id: userId,
        conversation_types: preferences.conversation_types,
        interests: preferences.interests,
        vibe_descriptors: preferences.vibe_descriptors,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};