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

interface MatchData {
  id: string;
  user_a: string;
  user_b: string;
  score_breakdown: Record<string, number>;
  state: string;
  initiated_at: string;
  expires_at: string;
  mutual_opt_in_at: string | null;
  user_b_profile?: {
    id: string;
    email: string;
  };
}

interface BridgePrompt {
  prompt: string;
  match_id: string;
  score_breakdown: Record<string, number>;
}

export default function BridgeClient() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;

  const [match, setMatch] = useState<MatchData | null>(null);
  const [bridgePrompt, setBridgePrompt] = useState<BridgePrompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadMatch = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.user?.id) {
          router.push("/");
          return;
        }
        setUserId(session.session.user.id);

        if (!matchId) {
          router.push("/matches");
          return;
        }

        const { data, error } = await supabase
          .from("matches")
          .select(`
            *,
            user_b_profile:users!matches_user_b_fkey(*)
          `)
          .eq("id", matchId)
          .single();

        if (error) throw error;
        if (!data) throw new Error("Match not found");

        setMatch(data as MatchData);

        const prompt = await dbHelpers.getBridgePrompt(matchId);
        setBridgePrompt(prompt);

      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load match");
      } finally {
        setLoading(false);
      }
    };

    loadMatch();
  }, [matchId, router]);

  const handleSendBridge = async () => {
    if (!match || !userId) return;
    
    setSending(true);
    try {
      await dbHelpers.optInToMatch(match.id, userId);
      
      setSent(true);
      setMatch({ ...match, state: "mutual", mutual_opt_in_at: new Date().toISOString() });
      
      setTimeout(() => {
        router.push(`/waiting/${match.id}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send bridge");
    } finally {
      setSending(false);
    }
  };

  const handleNotInterested = async () => {
    if (!match || !userId) return;
    
    try {
      await dbHelpers.recordConnectionOutcome(match.id, userId, false);
      router.push("/matches");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record response");
    }
  };

  if (loading) {
    return (
      <Card className="max-w-md w-full p-8">
        <CardHeader>
          <h2 className="text-xl font-bold">BETWEEN</h2>
          <p className="text-muted-foreground text-sm">Loading match...</p>
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
          <Button onClick={() => router.push("/matches")} className="w-full">
            Back to matches
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!match || !bridgePrompt) {
    return (
      <Card className="max-w-md w-full p-8">
        <CardHeader>
          <h2 className="text-xl font-bold">BETWEEN</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            No match found.
          </p>
          <Button onClick={() => router.push("/matches")} className="w-full">
            Back to matches
          </Button>
        </CardContent>
      </Card>
    );
  }

  const scoreBreakdown = bridgePrompt.score_breakdown || {};
  const totalScore = Object.values(scoreBreakdown).reduce((a, b) => a + b, 0);

  return (
    <Card className="max-w-md w-full p-8">
      <CardHeader>
        <h2 className="text-xl font-bold">BETWEEN</h2>
        <p className="text-muted-foreground text-sm">
          One conversation bridge
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <span className="text-2xl font-bold">{totalScore}%</span>
            <span>compatible</span>
          </div>
        </div>

        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer text-sm text-muted-foreground">
            <span>Why this match?</span>
            <svg className="w-4 h-4 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </summary>
          <div className="grid grid-cols-3 gap-2 pt-3 text-xs">
            {Object.entries(scoreBreakdown).map(([factor, points]) => (
              <div key={factor} className="flex flex-col items-center p-2 rounded bg-muted/50">
                <span className="font-bold text-primary">{points}</span>
                <span className="text-muted-foreground">
                  {factor
                    .replace("_", " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
              </div>
            ))}
          </div>
        </details>

        <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
          <p className="text-sm text-muted-foreground mb-2">Your conversation bridge:</p>
          <p className="text-lg font-medium leading-relaxed">&ldquo;{bridgePrompt.prompt}&rdquo;</p>
        </div>

        {sent ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-600 font-medium">Bridge sent!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Waiting for them to respond...
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <Button 
              onClick={handleSendBridge} 
              disabled={sending}
              className="w-full"
              size="lg"
            >
              {sending ? "Sending..." : "Send bridge"}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleNotInterested}
              className="w-full"
            >
              Not this time
            </Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          When you send a bridge, the other person sees your prompt.
          If they respond, you&apos;ll both be connected. If not, it expires in 2 hours.
        </p>
      </CardContent>
    </Card>
  );
}