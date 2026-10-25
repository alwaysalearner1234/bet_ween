"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase, realtimeHelpers } from "@/lib/supabase";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui";

interface MatchData {
  id: string;
  user_a: string;
  user_b: string;
  state: string;
  mutual_opt_in_at: string | null;
  expires_at: string;
}

export default function WaitingClient() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;

  const [match, setMatch] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    const loadMatch = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.user?.id) {
          router.push("/");
          return;
        }

        if (!matchId) {
          router.push("/matches");
          return;
        }

        const { data, error } = await supabase
          .from("matches")
          .select("*")
          .eq("id", matchId)
          .single();

        if (error) throw error;
        if (!data) throw new Error("Match not found");

        setMatch(data as MatchData);

        const channel = realtimeHelpers.subscribeToMatchChanges(
          session.session.user.id,
          data.event_id,
          (payload) => {
            const newMatch = payload.new as MatchData | null;
            if (newMatch && newMatch.id === matchId) {
              setMatch(newMatch);
              
              if (newMatch.state === "mutual" || newMatch.state === "continued") {
                router.push("/connections");
              }
            }
          }
        );

        return () => {
          realtimeHelpers.unsubscribe(channel);
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load match");
      } finally {
        setLoading(false);
      }
    };

    loadMatch();
  }, [matchId, router]);

  useEffect(() => {
    if (!match?.expires_at) return;

    const updateTimer = () => {
      const now = new Date();
      const expires = new Date(match.expires_at);
      const diff = expires.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining("Expired");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeRemaining(`${hours}h ${minutes}m remaining`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 30000);
    return () => clearInterval(interval);
  }, [match]);

  if (loading) {
    return (
      <Card className="max-w-md w-full p-8">
        <CardHeader>
          <h2 className="text-xl font-bold">BETWEEN</h2>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-4 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-muted-foreground">Waiting for response...</p>
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

  if (!match) {
    return null;
  }

  const isMutual = match.state === "mutual" || match.state === "continued";
  const isExpired = match.state === "expired" || match.state === "blocked";

  return (
    <Card className="max-w-md w-full p-8">
      <CardHeader>
        <h2 className="text-xl font-bold">BETWEEN</h2>
        <p className="text-muted-foreground text-sm">
          {isMutual ? "Connected!" : "Bridge sent"}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          {isMutual ? (
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : isExpired ? (
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          ) : (
            <div className="w-20 h-20 mx-auto mb-4 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          )}

          <h3 className="text-lg font-medium mb-1">
            {isMutual 
              ? "You're connected!" 
              : isExpired 
                ? "Bridge expired" 
                : "Waiting for response..."}
          </h3>
          
          <p className="text-sm text-muted-foreground">
            {isMutual
              ? "You both opted in. Continue to chat."
              : isExpired
                ? "The bridge expired or was declined. No hard feelings!"
                : `Your bridge is waiting. ${timeRemaining}`}
          </p>
        </div>

        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer text-sm text-muted-foreground">
            <span>What happens next?</span>
            <svg className="w-4 h-4 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </summary>
          <div className="space-y-2 pt-3 text-sm text-muted-foreground">
            <p>&bull; The other person sees your bridge prompt</p>
            <p>&bull; They can respond or let it expire (2 hours)</p>
            <p>&bull; If they respond, you&apos;ll both be connected</p>
            <p>&bull; If not, no notification - it just expires quietly</p>
          </div>
        </details>

        {isMutual && (
          <Button onClick={() => router.push("/connections")} className="w-full" size="lg">
            Continue to chat
          </Button>
        )}

        {!isMutual && !isExpired && (
          <Button variant="outline" onClick={() => router.push("/matches")} className="w-full">
            Back to matches
          </Button>
        )}

        {isExpired && (
          <Button onClick={() => router.push("/matches")} className="w-full">
            Find someone else
          </Button>
        )}
      </CardContent>
    </Card>
  );
}