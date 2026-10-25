"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
} from "@/components/ui";

interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export default function ChatClient() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const loadChat = async () => {
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
            .eq("state", "continued")
            .order("mutual_opt_in_at", { ascending: false })
            .limit(1);

          if (matches && matches.length > 0) {
            router.push(`/chat/${matches[0].id}`);
            return;
          } else {
            setError("No active chat found");
            return;
          }
        }

        const { data: match, error: matchError } = await supabase
          .from("matches")
          .select("*")
          .eq("id", matchId)
          .single();

        if (matchError) throw matchError;
        if (!match) throw new Error("Match not found");

        const isUserA = match.user_a === session.session.user.id;

        if (match.state !== "continued") {
          setError("Chat not available - both users must choose to continue");
          return;
        }

        const { data: msgs, error: msgsError } = await supabase
          .from("messages")
          .select("*")
          .eq("match_id", matchId)
          .order("created_at", { ascending: true });

        if (msgsError) throw msgsError;
        setMessages(msgs || []);

        channelRef.current = supabase
          .channel(`chat_${matchId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
              filter: `match_id=eq.${matchId}`,
            },
            (payload) => {
              setMessages((prev) => [...prev, payload.new as Message]);
            }
          )
          .subscribe();

      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load chat");
      } finally {
        setLoading(false);
      }
    };

    loadChat();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [matchId, router]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userId || !matchId || sending) return;

    const content = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          match_id: matchId,
          sender_id: userId,
          content,
        });

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
      setNewMessage(content);
    } finally {
      setSending(false);
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
            <p className="text-muted-foreground">Loading chat...</p>
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

  return (
    <div className="max-w-md w-full h-[calc(100vh-80px)] flex flex-col">
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="flex-shrink-0 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">BETWEEN</h2>
            <Button variant="ghost" size="sm" onClick={() => router.push("/matches")}>
              Back
            </Button>
          </div>
          <p className="text-muted-foreground text-sm mt-1">Chat - End-to-end encrypted (planned)</p>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="font-medium">No messages yet</p>
                <p className="text-sm">Say hello! 👋</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_id === userId ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      msg.sender_id === userId
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted rounded-bl-sm"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-xs mt-1 opacity-70 ${msg.sender_id === userId ? "text-right" : ""}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-border p-4 flex-shrink-0">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={sending}
                className="flex-1"
              />
              <Button type="submit" disabled={sending || !newMessage.trim()}>
                Send
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      <div className="p-2 border-t border-border">
        <Button variant="ghost" size="sm" className="w-full text-destructive">
          Block / Report
        </Button>
      </div>
    </div>
  );
}