/**
 * BETWEEN - Matches Screen (Compatible People)
 * 
 * M1 (Atharv): Product & Frontend
 * - Shows compatible people from same event
 * - Limited set, no exact location
 * - Tap to send bridge
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase, dbHelpers } from "@/lib/supabase";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
} from "@/components/ui";

interface CompatiblePerson {
  user_id: string;
  score: number;
  breakdown: Record<string, number>;
  profile?: {
    id: string;
    email: string;
  };
}

export default function MatchesScreen() {
  const router = useRouter();
  const [compatiblePeople, setCompatiblePeople] = useState<CompatiblePerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [openToMeet, setOpenToMeet] = useState(false);

  useEffect(() => {
    const loadMatches = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.user?.id) {
          router.push("/");
          return;
        }
        setUserId(session.session.user.id);

        // Get user's active event
        const events = await dbHelpers.getMyEvents();
        if (events.length === 0) {
          setError("No active events found");
          return;
        }

        const activeEvent = events[0].events;
        setEventId(activeEvent.id);

        // Check if user has open-to-meet enabled
        const hasOpen = await dbHelpers.hasOpenToMeet(session.session.user.id);
        setOpenToMeet(hasOpen);

        if (hasOpen) {
          // Find compatible people
          const compatible = await dbHelpers.findCompatiblePeople(
            session.session.user.id,
            activeEvent.id
          );
          setCompatiblePeople(compatible);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load matches");
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, [router]);

  const handleToggleOpenToMeet = async () => {
    if (!userId || !eventId) return;
    
    const newState = !openToMeet;
    setOpenToMeet(newState);

    try {
      await dbHelpers.setOpenToMeet(userId, eventId, newState);
      
      if (newState) {
        // Re-find compatible people
        const compatible = await dbHelpers.findCompatiblePeople(userId, eventId);
        setCompatiblePeople(compatible);
      } else {
        setCompatiblePeople([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
      setOpenToMeet(!newState); // Revert on error
    }
  };

  const handleViewMatch = async (person: CompatiblePerson) => {
    if (!userId || !eventId) return;
    
    // Calculate expiry date (2 hours from now)
    const getExpiryDate = () => new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    
    try {
      // Find or create match between current user and this person
      const { data: existingMatch } = await supabase
        .from("matches")
        .select("id")
        .eq("event_id", eventId)
        .or(`and(user_a.eq.${userId},user_b.eq.${person.user_id}),and(user_a.eq.${person.user_id},user_b.eq.${userId})`)
        .maybeSingle();

      let matchId = existingMatch?.id;

      if (!matchId) {
        // Create new pending match
        const { data: newMatch, error } = await supabase
          .from("matches")
          .insert({
            event_id: eventId,
            user_a: userId,
            user_b: person.user_id,
            score_breakdown: person.breakdown,
            state: "pending",
            expires_at: getExpiryDate(),
          })
          .select("id")
          .single();

        if (error) throw error;
        matchId = newMatch.id;
      }

      router.push(`/bridge/${matchId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create match");
    }
  };

  if (loading) {
    return (
      <Card className="max-w-md w-full p-8">
        <CardHeader>
          <h2 className="text-xl font-bold">BETWEEN</h2>
          <p className="text-muted-foreground text-sm">Finding compatible people...</p>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="max-w-md w-full p-8">
        <CardHeader>
          <h2 className="text-xl font-bold">BETWEEN</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive mb-4">{error}</p>
          <Button onClick={() => router.push("/preferences")} className="w-full">
            Back to preferences
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md w-full p-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">BETWEEN</h2>
        </div>
        <p className="text-muted-foreground text-sm">
          Compatible people at your event
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Open to Meet Toggle */}
        <div className="p-4 rounded-lg border">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-medium">Open to meeting</p>
              <p className="text-sm text-muted-foreground">
                {openToMeet 
                  ? "You're visible to compatible people. Auto-expires in 2 hours."
                  : "Turn on to discover compatible people at your event."
                }
              </p>
            </div>
            <label className="relative flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-2 focus-visible:ring-offset-2">
              <input
                type="checkbox"
                checked={openToMeet}
                onChange={handleToggleOpenToMeet}
                className="peer h-4 w-4 appearance-none rounded-full border border-transparent bg-transparent checked:bg-primary transition-colors"
              />
              <span className="pointer-events-none block h-3 w-3 rounded-full bg-background shadow-lg ring-0 transition-transform translate-x-0 peer-checked:translate-x-5" />
            </label>
          </div>
          
          {openToMeet && (
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500 ease-in-out"
                style={{ width: "100%" }}
              />
            </div>
          )}
        </div>

        {/* Compatible People List */}
        {openToMeet ? (
          compatiblePeople.length > 0 ? (
            <div className="space-y-3">
              {compatiblePeople.map((person) => (
                <div
                  key={person.user_id}
                  className="p-4 rounded-lg border hover:border-primary/50 cursor-pointer transition-colors"
                  onClick={() => handleViewMatch(person)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">Person {person.user_id.slice(0, 8)}...</p>
                    <span className="px-2 py-1 text-xs font-bold text-primary bg-primary/10 rounded-full">
                      {person.score}% match
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(person.breakdown).map(([factor, points]) => (
                      points > 0 && (
                        <Chip key={factor} variant="outline" size="sm">
                          {factor.replace("_", " ")}: {points}
                        </Chip>
                      )
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No compatible people found yet.
              </p>
              <p className="text-sm text-muted-foreground">
                More people will appear as they join and set preferences.
              </p>
            </div>
          )
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Turn on &ldquo;Open to meeting&rdquo; to discover compatible people.
            </p>
            <p className="text-sm text-muted-foreground">
              You&apos;ll only see people who share your interests and conversation style.
            </p>
          </div>
        )}

        <div className="pt-4 border-t border-border">
          <Button variant="outline" onClick={() => router.push("/preferences")} className="w-full">
            Edit preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

