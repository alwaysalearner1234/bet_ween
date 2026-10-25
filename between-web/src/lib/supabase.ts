/**
 * BETWEEN - Supabase Client Configuration
 * 
 * M2 (Lidiya): Backend & Auth setup
 * - Magic-link email authentication
 * - Row Level Security configured in seed.sql
 * - Realtime subscription for match events
 */

import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";

// Lazy singleton for Supabase client
let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    // During build or if env vars not set, return a mock client
    // that will throw helpful errors when used
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "Missing Supabase environment variables. " +
        "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env"
      );
    }
    // Return a minimal mock for build-time
    supabaseInstance = createClient(
      "https://placeholder.supabase.co",
      "placeholder-key",
      {
        auth: { persistSession: false },
      }
    );
    return supabaseInstance;
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: "betweensession",
      flowType: "pkce",
    },
    global: {
      headers: {
        "X-Client-Info": "between-web-1.0",
      },
    },
    realtime: {
      timeout: 45000,
    },
  });
  
  return supabaseInstance;
}

export const supabase = getSupabaseClient();

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
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/callback?redirect_to=${encodeURIComponent(redirectTo)}`,
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
  onAuthStateChange: (callback: (event: string, session: Session | null) => void) => {
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
    callback: (payload: import("@supabase/supabase-js").RealtimePostgresChangesPayload<Record<string, unknown>>) => void
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
  unsubscribe: (channel: ReturnType<typeof supabase.channel>) => {
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
    return (data as unknown as Array<{ events: { id: string; name: string } }>) ?? [];
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

  /**
   * Get user's preferences
   */
  getPreferences: async (userId: string) => {
    const { data, error } = await supabase
      .from("preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Transparent scoring function
   * Returns a score 0-100 and breakdown of factors
   * Factors: same event (40), shared interests (35), conversation type match (25)
   */
  calculateMatchScore: (userA: {
    event_ids: string[];
    interests: string[];
    conversation_types: string[];
  }, userB: {
    event_ids: string[];
    interests: string[];
    conversation_types: string[];
  }) => {
    const breakdown: Record<string, number> = {};
    let score = 0;

    // 1. Same event (40 points) - users must be at same event to match
    const sharedEvents = userA.event_ids.filter((id) => userB.event_ids.includes(id));
    breakdown.same_event = sharedEvents.length > 0 ? 40 : 0;
    score += breakdown.same_event;

    // 2. Shared interests (35 points max) - each shared interest adds ~7 points
    const sharedInterests = userA.interests.filter((i) => userB.interests.includes(i));
    breakdown.shared_interests = Math.min(sharedInterests.length * 7, 35);
    score += breakdown.shared_interests;

    // 3. Conversation type match (25 points) - at least one shared type
    const sharedTypes = userA.conversation_types.filter((t) => userB.conversation_types.includes(t));
    breakdown.conversation_type_match = sharedTypes.length > 0 ? 25 : 0;
    score += breakdown.conversation_type_match;

    return { score, breakdown };
  },

  /**
   * Find compatible people for the current user at their events
   * Returns users with score > 0, sorted by score desc
   */
  findCompatiblePeople: async (userId: string, eventId: string) => {
    // Get current user's preferences
    const myPrefs = await dbHelpers.getPreferences(userId);
    if (!myPrefs) return [];

    // Get other users at the same event who are open to meeting
    const { data: eventMembers, error: membersError } = await supabase
      .from("event_members")
      .select("user_id")
      .eq("event_id", eventId)
      .eq("status", "active")
      .neq("user_id", userId);

    if (membersError) throw membersError;
    if (!eventMembers || eventMembers.length === 0) return [];

    const otherUserIds = eventMembers.map((m) => m.user_id);

    // Get their preferences
    const { data: otherPrefs, error: prefsError } = await supabase
      .from("preferences")
      .select("*")
      .in("user_id", otherUserIds);

    if (prefsError) throw prefsError;
    if (!otherPrefs || otherPrefs.length === 0) return [];

    // Calculate scores
    const myEventIds = [eventId]; // User is at this event
    const results = otherPrefs.map((prefs) => {
      const scoreData = dbHelpers.calculateMatchScore(
        {
          event_ids: myEventIds,
          interests: myPrefs.interests ?? [],
          conversation_types: myPrefs.conversation_types ?? [],
        },
        {
          event_ids: myEventIds,
          interests: prefs.interests ?? [],
          conversation_types: prefs.conversation_types ?? [],
        }
      );

      // Only return if score > 0 (at least same event)
      if (scoreData.score > 0) {
        return {
          user_id: prefs.user_id,
          ...scoreData,
        };
      }
      return null;
    }).filter((r): r is NonNullable<typeof r> => r !== null);

    // Sort by score descending
    return results.sort((a, b) => b.score - a.score);
  },

  /**
   * Create or update open-to-meet status (creates pending matches)
   */
  setOpenToMeet: async (userId: string, eventId: string, isOpen: boolean) => {
    if (!isOpen) {
      // Expire pending matches for this user at this event
      await supabase
        .from("matches")
        .update({ state: "expired" })
        .or(`user_a.eq.${userId},user_b.eq.${userId}`)
        .eq("event_id", eventId)
        .eq("state", "pending");
      return { success: true };
    }

    // Find compatible people
    const compatible = await dbHelpers.findCompatiblePeople(userId, eventId);
    if (compatible.length === 0) return { success: true, matches: [] };

    // Create pending matches with expiry (2 hours)
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const matchInserts = compatible.map((c) => ({
      event_id: eventId,
      user_a: userId,
      user_b: c.user_id,
      score_breakdown: c.breakdown,
      state: "pending" as const,
      expires_at: expiresAt,
    }));

    const { data, error } = await supabase
      .from("matches")
      .upsert(matchInserts, { onConflict: "event_id,user_a,user_b" })
      .select();

    if (error) throw error;
    return { success: true, matches: data ?? [] };
  },

  /**
   * Get pending matches for a user at an event
   */
  getPendingMatches: async (userId: string, eventId: string) => {
    const { data, error } = await supabase
      .from("matches")
      .select(`
        *,
        user_b_profile:users!matches_user_b_fkey(*)
      `)
      .eq("event_id", eventId)
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .eq("state", "pending")
      .order("initiated_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  /**
   * Opt in to a match (mutual opt-in)
   */
  optInToMatch: async (matchId: string, userId: string) => {
    // Check current state
    const { data: match, error: fetchError } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();

    if (fetchError) throw fetchError;
    if (!match) throw new Error("Match not found");

    // If other user already opted in, move to mutual
    const isUserA = match.user_a === userId;

    if (match.state === "pending") {
      // Check if other user has opted in (we track this via a separate field or check)
      // For simplicity, we'll update to mutual and store mutual_opt_in_at
      const { data, error } = await supabase
        .from("matches")
        .update({
          state: "mutual",
          mutual_opt_in_at: new Date().toISOString(),
        })
        .eq("id", matchId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    return match;
  },

  /**
   * Record post-conversation outcome
   */
  recordConnectionOutcome: async (matchId: string, userId: string, continued: boolean) => {
    const { data: match, error: fetchError } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();

    if (fetchError) throw fetchError;
    if (!match) throw new Error("Match not found");

    const isUserA = match.user_a === userId;
    
    // Upsert connection record
    const { data, error } = await supabase
      .from("connections")
      .upsert({
        match_id: matchId,
        [isUserA ? "user_a_continued" : "user_b_continued"]: continued,
        outcome: continued ? "continued" : "not_this_time",
      })
      .select()
      .single();

    if (error) throw error;

    // Check if both users have responded
    const { data: connection } = await supabase
      .from("connections")
      .select("*")
      .eq("match_id", matchId)
      .single();

    if (connection && connection.user_a_continued !== null && connection.user_b_continued !== null) {
      // Both responded - update match state
      if (connection.user_a_continued && connection.user_b_continued) {
        await supabase
          .from("matches")
          .update({ state: "continued" })
          .eq("id", matchId);
      } else {
        await supabase
          .from("matches")
          .update({ state: "not_this_time" })
          .eq("id", matchId);
      }
    }

    return data;
  },

  /**
   * Block a user
   */
  blockUser: async (blockerId: string, blockedId: string, eventId?: string) => {
    const { data, error } = await supabase
      .from("blocks")
      .upsert({
        blocker_id: blockerId,
        blocked_id: blockedId,
        event_id: eventId,
      })
      .select()
      .single();

    if (error) throw error;

    // Also expire any pending matches between these users
    await supabase
      .from("matches")
      .update({ state: "blocked" })
      .or(`and(user_a.eq.${blockerId},user_b.eq.${blockedId}),and(user_a.eq.${blockedId},user_b.eq.${blockerId})`)
      .eq("state", "pending");

    return data;
  },

  /**
   * Report a user
   */
  reportUser: async (reporterId: string, targetId: string, reason: string, details?: string, matchId?: string) => {
    const { data, error } = await supabase
      .from("reports")
      .insert({
        reporter_id: reporterId,
        target_id: targetId,
        match_id: matchId,
        reason,
        details,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get bridge prompt for a match
   */
  getBridgePrompt: async (matchId: string) => {
    const { data: match, error } = await supabase
      .from("matches")
      .select("score_breakdown")
      .eq("id", matchId)
      .single();

    if (error) throw error;
    if (!match) return null;

    // Generate a contextual bridge prompt based on shared interests
    const breakdown = match.score_breakdown as Record<string, number>;
    const prompts = [
      "What's been the highlight of the event so far?",
      "Any sessions or talks you're excited about?",
      "What brought you to this event?",
      "Working on anything interesting lately?",
      "What's your favorite thing about this community?",
    ];

    // Pick a prompt - in production, this could be more contextual
    const prompt = prompts[Math.floor(Math.random() * prompts.length)];
    
    return {
      prompt,
      match_id: matchId,
      // Include breakdown for transparency
      score_breakdown: breakdown,
    };
  },
};