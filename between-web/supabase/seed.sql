-- BETWEEN Phase 1 Seed SQL
-- Run with: supabase db push or supabase db execute

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table - minimal profile data (RLS: users see only their own row)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE NOT NULL, -- Supabase auth UUID
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  -- No location fields, no phone, minimal data only
  -- RLS policy: users can only SELECT their own row
);

-- Events/communities
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  organizer_id UUID NOT NULL REFERENCES users(auth_id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  location_name TEXT, -- e.g., "Hackathon Room A", NOT exact GPS
  created_at TIMESTAMPTZ DEFAULT now(),
  -- RLS: users can see events they're members of + public events
);

-- Event members - which users are at which event
CREATE TABLE IF NOT EXISTS event_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(auth_id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'left')),
  -- UNIQUE constraint to prevent duplicates
  UNIQUE(event_id, user_id),
  -- RLS: users can see their own event_members rows
);

-- User preferences - interests, conversation types, vibes
CREATE TABLE IF NOT EXISTS preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(auth_id) ON DELETE CASCADE,
  conversation_types TEXT[] DEFAULT '{}', -- stored as PostgreSQL text[]
  interests TEXT[] DEFAULT '{}', -- stored as names: ["music", "gaming", ...]
  vibe_descriptors TEXT[] DEFAULT '{}', -- stored as ["creative", "chill", ...]
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id),
  -- RLS: users can only see/modify their own preferences
);

-- Matches - match state machine
-- Records a match candidate and its state
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_a UUID NOT NULL REFERENCES users(auth_id),
  user_b UUID NOT NULL REFERENCES users(auth_id),
  score_breakdown JSONB DEFAULT '{}', -- transparent score inputs
  state TEXT DEFAULT 'pending' CHECK (state IN ('pending', 'mutual', 'expired', 'blocked')),
  initiated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ, -- auto-expiry of open-to-meet
  mutual_opt_in_at TIMESTAMPTZ, -- when both opted in
  -- RLS: users can see their own matches
);

-- Connections - post-conversation outcomes
CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_a_continued BOOLEAN DEFAULT NULL,
  user_b_continued BOOLEAN DEFAULT NULL,
  outcome TEXT CHECK (outcome IN ('continued', 'not_this_time', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT now(),
  -- RLS: only the two users in the match can see/ modify
);

-- Reports - safety reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(auth_id),
  target_id UUID NOT NULL REFERENCES users(auth_id),
  match_id UUID REFERENCES matches(id), -- which match was reported
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'underage', 'inappropriate_content', 'scam', 'other')),
  details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  -- RLS: reporters can see their own reports, admins can see all
);

-- Block list
CREATE TABLE IF NOT EXISTS blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES users(auth_id),
  blocked_id UUID NOT NULL REFERENCES users(auth_id),
  event_id UUID REFERENCES events(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(blocker_id, blocked_id),
  -- RLS: users can see their own blocks
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- ---- RLS POLICIES ----

-- Users: only admins can see all; regular users see own row
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth_id = gen_random_uuid());

-- Events: users can see events they're members of + all events (no exact location)
CREATE POLICY "Users can view accessible events" ON events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM event_members WHERE event_id = events.id AND user_id = gen_random_uuid())
    OR true -- all events visible, but no exact GPS
  );

-- Event members: users can see their own event memberships
CREATE POLICY "Users can view own event memberships" ON event_members
  FOR SELECT USING (user_id = gen_random_uuid());

-- Preferences: users can only modify their own
CREATE POLICY "Users can view own preferences" ON preferences
  FOR SELECT USING (user_id = gen_random_uuid());

-- Matches: users can see their own matches (either user_a or user_b)
CREATE POLICY "Users can view own matches" ON matches
  FOR SELECT USING (
    user_a = gen_random_uuid() OR user_b = gen_random_uuid()
  );

-- Connections: only match participants can see
CREATE POLICY "Users can view own connections" ON connections
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM matches WHERE id = connections.match_id AND (user_a = gen_random_uuid() OR user_b = gen_random_uuid()))
  );

-- Reports: reporter can see own reports
CREATE POLICY "Users can view own reports" ON reports
  FOR SELECT USING (reporter_id = gen_random_uuid());

-- Blocks: users can see their own blocks
CREATE POLICY "Users can view own blocks" ON blocks
  FOR SELECT USING (blocker_id = gen_random_uuid());

-- Insert policies
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth_id = gen_random_uuid());

CREATE POLICY "Users can insert own event memberships" ON event_members
  FOR INSERT WITH CHECK (user_id = gen_random_uuid());

CREATE POLICY "Users can insert own preferences" ON preferences
  FOR INSERT WITH CHECK (user_id = gen_random_uuid());

CREATE POLICY "Users can insert own reports" ON reports
  FOR INSERT WITH CHECK (reporter_id = gen_random_uuid());

CREATE POLICY "Users can insert own blocks" ON blocks
  FOR INSERT WITH CHECK (blocker_id = gen_random_uuid());