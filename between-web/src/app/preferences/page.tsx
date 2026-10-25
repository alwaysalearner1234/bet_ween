/**
 * BETWEEN - Preferences Configuration Screen
 * 
 * M1 (Atharv): Product & Frontend
 * - Conversation type selection
 * - Interest/ hobby selection
 * - Vibe descriptors (optional)
 * - Open to meeting toggle with auto-expiry
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { dbHelpers } from "@/lib/supabase";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
} from "@/components/ui";

type ConversationType = 
  | "casual"
  | "hobbies" 
  | "ideas"
  | "fun"
  | "deep";

type VibeDescriptor = 
  | "creative"
  | "chill" 
  | "ambitious"
  | "funny"
  | "gaming"
  | "music"
  | "tech";

export default function PreferencesScreen() {
  const [conversationTypes, setConversationTypes] = useState<ConversationType[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [vibeDescriptors, setVibeDescriptors] = useState<VibeDescriptor[]>([]);
  const [openToMeet, setOpenToMeet] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // Check auth session
    const checkSession = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (session?.session?.user?.id) {
          setHasSession(true);
          // Load existing preferences
          const profile = await dbHelpers.getMyProfile();
          if (profile?.preferences) {
            setConversationTypes(profile.preferences.conversation_types || []);
            setInterests(profile.preferences.interests || []);
            setVibeDescriptors(profile.preferences.vibe_descriptors || []);
          }
        }
      } catch (err) {
        console.error("Failed to check session:", err);
      }
    };

    checkSession();
  }, []);

  const handleSave = async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user?.id) {
      setError("Please sign in first");
      return;
    }

    setSaving(true);
    try {
      // Save preferences to Supabase
      await dbHelpers.updatePreferences(
        session.session.user.id,
        {
          conversation_types: conversationTypes,
          interests: interests,
          vibe_descriptors: vibeDescriptors,
        }
      );
      
      // Navigate to matches screen
      router.push("/matches");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  if (!hasSession) {
    return (
      <Card className="max-w-md w-full p-8">
        <CardHeader>
          <h2 className="text-xl font-bold">BETWEEN</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Please sign in first to configure your preferences.
          </p>
          <Button onClick={() => router.push("/")} className="w-full">
            Sign in with magic link
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md w-full p-8">
      <CardHeader>
        <h2 className="text-xl font-bold">BETWEEN</h2>
        <p className="text-muted-foreground text-sm">
          Tell us about yourself
        </p>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive mb-4">{error}</p>}
        
        {/* Conversation Type */}
        <details>
          <summary className="flex items-center justify-between cursor-pointer list-none">
            <span>What kind of conversation are you open to?</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </summary>
          <div className="grid grid-cols-2 gap-2 py-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <Input
                type="radio"
                checked={conversationTypes.includes("casual")}
                onChange={() => setConversationTypes(
                  conversationTypes.includes("casual") 
                    ? conversationTypes.filter(t => t !== "casual")
                    : [...conversationTypes, "casual"]
                )}
                name="conversation-type"
                value="casual"
                className="rounded border"
              />
              Casual
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Input
                type="radio"
                checked={conversationTypes.includes("hobbies")}
                onChange={() => setConversationTypes(
                  conversationTypes.includes("hobbies") 
                    ? conversationTypes.filter(t => t !== "hobbies")
                    : [...conversationTypes, "hobbies"]
                )}
                name="conversation-type"
                value="hobbies"
                className="rounded border"
              />
              Hobbies
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Input
                type="radio"
                checked={conversationTypes.includes("ideas")}
                onChange={() => setConversationTypes(
                  conversationTypes.includes("ideas") 
                    ? conversationTypes.filter(t => t !== "ideas")
                    : [...conversationTypes, "ideas"]
                )}
                name="conversation-type"
                value="ideas"
                className="rounded border"
              />
              Ideas
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Input
                type="radio"
                checked={conversationTypes.includes("fun")}
                onChange={() => setConversationTypes(
                  conversationTypes.includes("fun") 
                    ? conversationTypes.filter(t => t !== "fun")
                    : [...conversationTypes, "fun"]
                )}
                name="conversation-type"
                value="fun"
                className="rounded border"
              />
              Fun
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Input
                type="radio"
                checked={conversationTypes.includes("deep")}
                onChange={() => setConversationTypes(
                  conversationTypes.includes("deep") 
                    ? conversationTypes.filter(t => t !== "deep")
                    : [...conversationTypes, "deep"]
                )}
                name="conversation-type"
                value="deep"
                className="rounded border"
              />
              Deep
            </label>
          </div>
        </details>

        {/* Interests */}
        <details>
          <summary className="flex items-center justify-between cursor-pointer list-none">
            <span>Select your interests</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </summary>
          <div className="grid grid-cols-2 gap-2 pb-2">
            {/* Dynamic interest chips will go here */}
            {/* For now, showing a few examples */}
            <label className="flex flex-col items-center gap-2 cursor-pointer p-3 border rounded hover:border-primary">
              <span>Music</span>
              <Input
                type="checkbox"
                checked={interests.includes("music")}
                onChange={() => setInterests(
                  interests.includes("music") 
                    ? interests.filter(i => i !== "music")
                    : [...interests, "music"]
                )}
                style={{ display: "none" }}
              />
            </label>
            <label className="flex flex-col items-center gap-2 cursor-pointer p-3 border rounded hover:border-primary">
              <span>Gaming</span>
              <Input
                type="checkbox"
                checked={interests.includes("gaming")}
                onChange={() => setInterests(
                  interests.includes("gaming") 
                    ? interests.filter(i => i !== "gaming")
                    : [...interests, "gaming"]
                )}
                style={{ display: "none" }}
              />
            </label>
            <label className="flex flex-col items-center gap-2 cursor-pointer p-3 border rounded hover:border-primary">
              <span>Tech</span>
              <Input
                type="checkbox"
                checked={interests.includes("tech")}
                onChange={() => setInterests(
                  interests.includes("tech") 
                    ? interests.filter(i => i !== "tech")
                    : [...interests, "tech"]
                )}
                style={{ display: "none" }}
              />
            </label>
            <label className="flex flex-col items-center gap-2 cursor-pointer p-3 border rounded hover:border-primary">
              <span>Travel</span>
              <Input
                type="checkbox"
                checked={interests.includes("travel")}
                onChange={() => setInterests(
                  interests.includes("travel") 
                    ? interests.filter(i => i !== "travel")
                    : [...interests, "travel"]
                )}
                style={{ display: "none" }}
              />
            </label>
          </div>
        </details>

        {/* Vibe Descriptors (optional) */}
        <details>
          <summary className="flex items-center justify-between cursor-pointer list-none">
            <span>Optional: Vibe descriptors</span>
            <small className="text-xs text-muted-foreground">
              (e.g., creative, chill, ambitious)
            </small>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </summary>
          <div className="grid grid-cols-3 gap-1 py-2">
            <label className="flex flex-col items-center gap-1 cursor-pointer p-1 border rounded hover:border-primary">
              <span>Creative</span>
              <Input
                type="checkbox"
                checked={vibeDescriptors.includes("creative")}
                onChange={() => setVibeDescriptors(
                  vibeDescriptors.includes("creative") 
                    ? vibeDescriptors.filter(v => v !== "creative")
                    : [...vibeDescriptors, "creative"]
                )}
                style={{ display: "none" }}
              />
            </label>
            <label className="flex flex-col items-center gap-1 cursor-pointer p-1 border rounded hover:border-primary">
              <span>Chill</span>
              <Input
                type="checkbox"
                checked={vibeDescriptors.includes("chill")}
                onChange={() => setVibeDescriptors(
                  vibeDescriptors.includes("chill") 
                    ? vibeDescriptors.filter(v => v !== "chill")
                    : [...vibeDescriptors, "chill"]
                )}
                style={{ display: "none" }}
              />
            </label>
            <label className="flex flex-col items-center gap-1 cursor-pointer p-1 border rounded hover:border-primary">
              <span>Ambitious</span>
              <Input
                type="checkbox"
                checked={vibeDescriptors.includes("ambitious")}
                onChange={() => setVibeDescriptors(
                  vibeDescriptors.includes("ambitious") 
                    ? vibeDescriptors.filter(v => v !== "ambitious")
                    : [...vibeDescriptors, "ambitious"]
                )}
                style={{ display: "none" }}
              />
            </label>
            <label className="flex flex-col items-center gap-1 cursor-pointer p-1 border rounded hover:border-primary">
              <span>Funny</span>
              <Input
                type="checkbox"
                checked={vibeDescriptors.includes("funny")}
                onChange={() => setVibeDescriptors(
                  vibeDescriptors.includes("funny") 
                    ? vibeDescriptors.filter(v => v !== "funny")
                    : [...vibeDescriptors, "funny"]
                )}
                style={{ display: "none" }}
              />
            </label>
            <label className="flex flex-col items-center gap-1 cursor-pointer p-1 border rounded hover:border-primary">
              <span>Music</span>
              <Input
                type="checkbox"
                checked={vibeDescriptors.includes("music")}
                onChange={() => setVibeDescriptors(
                  vibeDescriptors.includes("music") 
                    ? vibeDescriptors.filter(v => v !== "music")
                    : [...vibeDescriptors, "music"]
                )}
                style={{ display: "none" }}
              />
            </label>
            <label className="flex flex-col items-center gap-1 cursor-pointer p-1 border rounded hover:border-primary">
              <span>Tech</span>
              <Input
                type="checkbox"
                checked={vibeDescriptors.includes("tech")}
                onChange={() => setVibeDescriptors(
                  vibeDescriptors.includes("tech") 
                    ? vibeDescriptors.filter(v => v !== "tech")
                    : [...vibeDescriptors, "tech"]
                )}
                style={{ display: "none" }}
              />
            </label>
          </div>
        </details>

        {/* Open to Meeting Toggle */}
        <details>
          <summary className="flex items-center justify-between cursor-pointer list-none">
            <span>Open to meeting someone</span>
            <small className="text-xs text-muted-foreground">
              You&apos;ll see compatible people when ON
            </small>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </summary>
          <div className="flex items-center gap-3 py-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <Input
                type="checkbox"
                checked={openToMeet}
                onChange={(e) => setOpenToMeet(e.target.checked)}
                className="rounded border"
              />
              <span className="text-lg font-medium">
                ON
              </span>
            </label>
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500 ease-in-out"
                style={openToMeet ? { width: "100%" } : { width: "0%" }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              Auto-expires in 2 hours
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            When open to meeting is ON, you&apos;ll discover compatible people 
            from the same event. Your status auto-expires after 2 hours 
            so you don&apos;t stay visible by accident.
          </p>
        </details>

        <div className="mt-6 pt-6 border-t border-border">
          <Button 
            type="button" 
            onClick={handleSave} 
            disabled={saving}
            className="w-full"
          >
            {saving ? "Saving..." : "Continue to matches"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

