# Phase 1: Day 1 - Tiny Prototype Loop

## Tasks Completed

### 1. Built Core Matching Logic (Transparent Scoring)
- Created `calculateMatchScore` function in `lib/supabase.ts`
- Scoring factors (transparent, no black box):
  - Same event: 40 points (required - users must share event)
  - Shared interests: 35 points max (~7 per shared interest)
  - Conversation type match: 25 points (at least one shared type)
- Returns both total score and breakdown for UI transparency

### 2. Built Match State Machine
Implemented in `dbHelpers`:
- `pending` → initial state when open-to-meet is ON
- `mutual` → both users opted in (sent/received bridge)
- `continued` → both chose to continue after conversation
- `not_this_time` → one or both declined
- `expired` → 2-hour auto-expiry
- `blocked` → safety action taken

### 3. Created Phase 1 Screens (Full Prototype Loop)

**Welcome → Preferences → Matches → Bridge → Waiting → Connections → Chat**

| Screen | Route | Purpose |
|--------|-------|---------|
| Welcome | `/welcome` | Email magic-link auth, event context |
| Preferences | `/preferences` | Conversation types, interests, vibes, open-to-meet toggle |
| Matches | `/matches` | Compatible people list, score breakdown, toggle open-to-meet |
| Bridge | `/bridge/[matchId]` | Single prompt, send/opt-in, transparent scoring |
| Waiting | `/waiting/[matchId]` | Real-time wait for other person's response |
| Connections | `/connections/[matchId]` | Continue / Not this time decision |
| Chat | `/chat/[matchId]` | Real-time chat (only after both continue) |
| Block/Report | `/block-report/[matchId]` | Safety controls |

### 4. Database Schema Updates (seed.sql)
- Added `messages` table for chat
- Fixed RLS policies to use `auth.uid()` instead of `gen_random_uuid()`
- Added proper indexes for performance
- Match states: pending, mutual, continued, not_this_time, expired, blocked

### 5. Real-time Subscriptions
- Match state changes (waiting screen)
- New messages (chat screen)
- Proper cleanup on unmount

### 6. Key UX Decisions from Phase 0 Interviews
- **Mutual opt-in required** - no unilateral connections
- **One bridge only** - single prompt, then quiet
- **Auto-expiry (2hrs)** - prevents accidental visibility
- **Transparent scoring** - users see exactly why matched
- **Not this time** - gentle opt-out, no rejection notification
- **Block/Report accessible** - from chat and connections

### 7. Fixed Component Imports
- Moved `components/u/` → `components/ui/`
- Created `components/ui/index.ts` barrel export
- Added missing `Label` component
- Fixed `Checkbox` styling

## Git
- Commit: Phase 1 Day 1 prototype loop complete

## Next Steps for Day 2
- Polish vibe picker and preferences UI
- Add event selection (currently assumes first event)
- Test full loop with 2+ users
- Add loading/error states
- Create demo data script
- Prepare for closed tester round (5 people)