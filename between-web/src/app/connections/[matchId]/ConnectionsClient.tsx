"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase, dbHelpers } from "@/lib/supabase";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui";

interface ConnectionData {
  id: string;
  match_id: string;
  user_a_continued: boolean | null;
  user_b_continued: boolean | null;
  outcome: string | null;
  match: {
    id: string;
    user_a: string;
    user_b: string;
    state: string;
  };
}

export default function ConnectionsClient() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;

  const [connection, setConnection] = useState<ConnectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userChoice, setUserChoice] = useState<boolean | null>(null); // true = continue, false = not this time

  useEffect(() => {
    const loadConnection = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.user?.id) {
          router.push("/");
          return;
        }
        setUserId(session.session.user.id);

        if (!matchId) {
          const { data: matches } = await supabase
            .from("matches")
            .select("*")
            .or(`user_a.eq.${session.session.user.id},user_b.eq.${session.session.user.id}`)
            .eq("state", "mutual")
            .order("mutual_opt_in_at", { ascending: false })
            .limit(1);

          if (matches && matches.length > 0) {
            router.push(`/connections/${matches[0].id}`);
            return;
          } else {
            setError("No active connections");
            return;
          }
        }

        const { data, error } = await supabase
          .from("connections")
          .select(`
            *,
            match:matches(*)
          `)
          .eq("match_id", matchId)
          .single();

        if (error && error.code !== "PGRST116") throw error;

        if (data) {
          setConnection(data as ConnectionData);
          
          const isUserA = data.match.user_a === session.session.user.id;
          if (isUserA && data.user_a_continued !== null) {
            setUserChoice(data.user_a_continued);
          } else if (!isUserA && data.user_b_continued !== null) {
            setUserChoice(data.user_b_continued);
          }
        } else {
          setConnection({
            id: "",
            match_id: matchId,
            user_a_continued: null,
            user_b_continued: null,
            outcome: null,
            match: { id: matchId, user_a: "", user_b: "", state: "mutual" },
          } as ConnectionData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load connection");
      } finally {
        setLoading(false);
      }
    };

    loadConnection();
  }, [matchId, router]);

  const handleChoice = async (continued: boolean) => {
    if (!connection || !userId || saving) return;
    
    setSaving(true);
    setUserChoice(continued);
    
    try {
      await dbHelpers.recordConnectionOutcome(connection.match_id, userId, continued);
      
      if (continued) {
        setTimeout(async () => {
          const { data } = await supabase
            .from("connections")
            .select("*")
            .eq("match_id", connection.match_id)
            .single();
          
          if (data && data.user_a_continued && data.user_b_continued) {
            router.push("/chat");
          }
        }, 1000);
      } else {
        setTimeout(() => router.push("/matches"), 1000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record choice");
      setUserChoice(null);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="max-w-md w-full p-8">
        <CardHeader>
          <h2 className="text-xl font-bold">BETWEEN</h2>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-4 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </CardContent>
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
          <Button onClick={() => router.push("/matches")} className="w-full">
            Back to matches
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!connection) {
    return (
      <Card className="max-w-md w-full p-8">
        <CardHeader>
          <h2 className="text-xl font-bold">BETWEEN</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            No active connection found.
          </p>
          <Button onClick={() => router.push("/matches")} className="w-full">
            Back to matches
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isUserA = connection.match.user_a === userId;
  const otherContinued = isUserA ? connection.user_b_continued : connection.user_a_continued;
  const bothContinued = connection.user_a_continued === true && connection.user_b_continued === true;
  const eitherDeclined = connection.user_a_continued === false || connection.user_b_continued === false;

  return (
    <Card className="max-w-md w-full p-8">
      <CardHeader>
        <h2 className="text-xl font-bold">BETWEEN</h2>
        <p className="text-muted-foreground text-sm">
          How did it go?
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          {bothContinued ? (
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : eitherDeclined ? (
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          ) : (
            <div className="w-20 h-20 mx-auto mb-4 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          )}

          <h3 className="text-lg font-medium mb-1">
            {bothContinued
              ? "You both want to continue!"
              : eitherDeclined
                ? "Not this time"
                : "Waiting for both responses..."}
          </h3>

          <p className="text-sm text-muted-foreground">
            {bothContinued
              ? "Chat is now open. You can message each other."
              : eitherDeclined
                ? "No hard feelings. The connection ends here."
                : "You&apos;ll both decide independently whether to continue."}
          </p>

          {otherContinued !== null && userChoice === null && (
            <p className="text-sm text-primary mt-2">
              The other person chose to {otherContinued ? "continue" : "not continue"}.
            </p>
          )}
        </div>

        {userChoice === null && !bothContinued && !eitherDeclined && (
          <div className="space-y-3">
            <Button 
              onClick={() => handleChoice(true)} 
              disabled={saving}
              className="w-full"
              size="lg"
            >
              {saving ? "Saving..." : "Continue chatting"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleChoice(false)}
              disabled={saving}
              className="w-full"
            >
              Not this time
            </Button>
          </div>
        )}

        {userChoice !== null && !bothContinued && !eitherDeclined && (
          <div className="text-center py-4">
            <p className="text-muted-foreground">
              You chose to {userChoice ? "continue" : "not continue"}.
              Waiting for the other person...
            </p>
          </div>
        )}

        {bothContinued && (
          <Button onClick={() => router.push("/chat")} className="w-full" size="lg">
            Open chat
          </Button>
        )}

        {eitherDeclined && (
          <Button onClick={() => router.push("/matches")} className="w-full">
            Find someone else
          </Button>
        )}

        <details className="group border-t border-border pt-4">
          <summary className="flex items-center justify-between cursor-pointer text-sm text-destructive">
            <span>Block or report this person</span>
            <svg className="w-4 h-4 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </summary>
          <div className="pt-3">
            <Button variant="outline" className="w-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground">
              Block / Report
            </Button>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}