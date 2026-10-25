/**
 * BETWEEN - Welcome & Event Selection Screen
 * 
 * M1 (Atharv): Product & Frontend
 * - First screen users see
 * - Select event/community they're attending
 * - Sets the context for the entire session
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase, authHelpers } from "@/lib/supabase";
import { dbHelpers } from "@/lib/supabase";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
} from "@/components/ui";

export default function WelcomeScreen() {
  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Fetch events user is registered for
    // In production, this would be pre-loaded or fetched from Supabase
    // For now, simulate with a setTimeout
    const loadEvents = async () => {
      try {
        // Check if user is already authenticated
        const { data: session } = await supabase.auth.getSession();
        
        if (session?.session?.user?.id) {
          // User is logged in, get their events
          const myEvents = await dbHelpers.getMyEvents();
          setEvents(
            myEvents.map((e) => ({
              id: e.events.id,
              name: e.events.name,
            }))
          );
        }
      } catch (err) {
        console.error("Failed to load events:", err);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    try {
      // Send magic link
      await authHelpers.signInWithMagicLink(email, "/preferences");
      router.push("/preferences"); // Navigate after user clicks magic link
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send magic link");
    }
  };

  if (loading) {
    return (
      <Card className="max-w-md w-full p-8">
        <CardHeader>
          <h2 className="text-xl font-bold">BETWEEN</h2>
          <p className="text-muted-foreground text-sm">
            Connect with people at your event
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-6">
            Please enter your email to continue. We&apos;ll send a magic link to sign in.
          </p>
          <form onSubmit={handleContinue} className="space-y-4">
            <Input
              placeholder="name@event.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={true} // Would enable after auth check
              className="border-transparent"
              readOnly
            />
            <p className="text-xs text-muted-foreground">
              We use magic-link auth — no passwords needed.
            </p>
            <Button type="submit" disabled={loading}>
              {loading ? "Loading..." : "Continue with email"}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md w-full p-8">
      <CardHeader>
        <h2 className="text-xl font-bold">BETWEEN</h2>
        <p className="text-muted-foreground text-sm">
          Connect with people at your event
        </p>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-6">
          Please enter your email to continue. We&apos;ll send a magic link to sign in.
        </p>
        <form onSubmit={handleContinue} className="space-y-4">
          <Input
            placeholder="name@event.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">
            We use magic-link auth — no passwords needed.
          </p>
          <Button type="submit" disabled={loading}>
            {loading ? "Loading..." : "Continue with email"}
          </Button>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

