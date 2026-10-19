/**
 * BETWEEN - Shared Types for Phase 1
 * 
 * These types are shared between frontend (M1/Atharv) and backend (M2/Lidiya).
 * Keep them in sync - do not store location or sensitive data here.
 */

// User profile - minimal data only
export type UserProfile = {
  id: string; // Supabase auth UUID
  email: string | null;
  created_at: string;
  // No location, no phone, no sensitive data
};

// Event/community information
export type Event = {
  id: string;
  name: string;
  description: string | null;
  organizer_id: string;
  start_time: string;
  end_time: string | null;
  location_name: string | null; // e.g., "Conference Room A", not exact GPS
  created_at: string;
};

// Event membership - which users are at which event
export type EventMember = {
  id: string;
  event_id: string;
  user_id: string;
  joined_at: string;
  status: "active" | "left";
};

// Conversation preferences - interests, types, vibes
export type Interest = {
  id: string;
  name: string; // e.g., "music", "gaming", "coding"
  category: "hobby" | "professional" | "academic" | "other";
};

export type ConversationType = 
  | "casual"
  | "hobbies" 
  | "ideas"
  | "fun"
  | "deep"
  | "other";

// Vibe descriptors - optional, user-chosen
export type VibeDescriptor = 
  | "creative"
  | "chill" 
  | "ambitious"
  | "funny"
  | "gaming"
  | "music"
  | "tech";

// User preferences stored together
export type UserPreferences = {
  conversationTypes: ConversationType[];
  interests: Interest[];
  vibeDescriptors: VibeDescriptor[];
  // open_to_meet status is tracked separately with expiry
};

// Matching score breakdown - transparent, no ML weights hidden
export type ScoreBreakdown = {
  sameEvent: number; // 0 or max score
  sharedInterests: number; // count of shared interests weighted
  conversationTypeMatch: number; // 0 or match score
  vibeMatch: number; // 0 or match score
  openToMeetStatus: number; // 0 or 1 based on expiry
  total: number;
};

// Match state machine
export type MatchState = 
  | "pending" // one person opted in, waiting for other
  | "mutual" // both opted in - connection active
  | "expired" // open-to-meet expired before mutual opt-in
  | "blocked" // one user blocked the other;

// Connection outcome
export type ConnectionOutcome = 
  | "continued" // both chose to continue
  | "not_this_time" // one or both said "not this time"
  | "blocked" // connection blocked by moderation;

// Conversation bridge - the one prompt shown after match
export type ConversationBridge = {
  id: string;
  prompt: string;
  generated_by: "template" | "llm";
  sharedContext: string[]; // e.g., ["music", "travelling"]
  used_at: string;
};

// Report reasons (for safety/moderation)
export type ReportReason = 
  | "spam"
  | "harassment" 
  | "underage"
  | "inappropriate_content"
  | "scam"
  | "other";

// Block list entry
export type BlockEntry = {
  blocker_id: string;
  blocked_id: string;
  event_id: string;
  created_at: string;
};