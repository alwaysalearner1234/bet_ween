"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { unstable_noStore } from "next/cache";
// import { dbHelpers } from "@/lib/supabase"; // Used in future implementation
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
  Label,
} from "@/components/ui";

unstable_noStore();

type ReportReason = "spam" | "harassment" | "underage" | "inappropriate_content" | "scam" | "other";

const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
  { value: "spam", label: "Spam", description: "Unwanted promotional content or links" },
  { value: "harassment", label: "Harassment", description: "Threatening, abusive, or hostile behavior" },
  { value: "underage", label: "Underage user", description: "User appears to be under 18" },
  { value: "inappropriate_content", label: "Inappropriate content", description: "Sexual, violent, or otherwise inappropriate content" },
  { value: "scam", label: "Scam or fraud", description: "Attempting to deceive or extract money/info" },
  { value: "other", label: "Other", description: "Something else not listed here" },
];

export default function BlockReportClient() {
  const params = useParams();
  const router = useRouter();
  // const matchId = params.matchId as string; // Used in future implementation

  const [step, setStep] = useState<"choose" | "block" | "report">("choose");
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBack = () => {
    if (step === "choose") {
      router.back();
    } else {
      setStep("choose");
      setSelectedReason(null);
      setDetails("");
      setError(null);
    }
  };

  // TODO: Load match data to get target user ID
  // const { data: match } = await supabase.from("matches").select("user_a, user_b").eq("id", matchId).single();
  // const currentUserId = (await supabase.auth.getSession()).data.session?.user?.id;
  // const targetUserId = match?.user_a === currentUserId ? match.user_b : match.user_a;

  const handleBlock = async () => {
    // const currentUserId = (await supabase.auth.getSession()).data.session?.user?.id;
    // const targetUserId = match?.user_a === currentUserId ? match.user_b : match.user_a;
    // if (!currentUserId || !targetUserId || !matchId) return;
    
    setSubmitting(true);
    try {
      // await dbHelpers.blockUser(currentUserId, targetUserId);
      setSuccess(true);
      setTimeout(() => router.push("/matches"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to block user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReport = async () => {
    // const currentUserId = (await supabase.auth.getSession()).data.session?.user?.id;
    // const targetUserId = match?.user_a === currentUserId ? match.user_b : match.user_a;
    // if (!currentUserId || !targetUserId || !matchId || !selectedReason) return;
    
    setSubmitting(true);
    try {
      // await dbHelpers.reportUser(currentUserId, targetUserId, selectedReason, details || undefined, matchId);
      setSuccess(true);
      setTimeout(() => router.push("/matches"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  // Load match to get target user ID
  // In a real app, this would be loaded from the match data
  // For now, we'll simulate it

  return (
    <Card className="max-w-md w-full p-8">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">BETWEEN</h2>
          {step !== "choose" && (
            <Button variant="ghost" size="sm" onClick={handleBack}>
              Back
            </Button>
          )}
        </div>
        <p className="text-muted-foreground text-sm">
          {step === "choose" ? "Safety tools" : step === "block" ? "Block user" : "Report user"}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-green-600 mb-1">
              {step === "block" ? "User blocked" : "Report submitted"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {step === "block" 
                ? "They won&apos;t appear in your matches anymore."
                : "Our team will review this report within 24 hours."}
            </p>
          </div>
        ) : step === "choose" ? (
          <div className="space-y-3">
            <Button 
              onClick={() => setStep("block")}
              className="w-full"
              variant="outline"
            >
              <div className="flex items-center justify-between">
                <span>Block user</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              They won&apos;t see you in matches. Current match will end.
            </p>
            
            <div className="border-t border-border my-4" />
            
            <Button 
              onClick={() => setStep("report")}
              className="w-full"
              variant="outline"
            >
              <div className="flex items-center justify-between">
                <span>Report user</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Our team will review within 24 hours. Anonymous.
            </p>
          </div>
        ) : step === "block" ? (
          <div className="space-y-4">
            <div className="p-4 rounded-lg border bg-destructive/5 border-destructive/20">
              <p className="font-medium text-destructive">Block this user?</p>
              <p className="text-sm text-muted-foreground mt-1">
                They will no longer appear in your compatible people. 
                Any current match will be ended immediately. 
                This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleBack} className="flex-1">
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleBlock} disabled={submitting} className="flex-1">
                {submitting ? "Blocking..." : "Block user"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select a reason for reporting:
            </p>
            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => (
                <label
                  key={reason.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedReason === reason.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={reason.value}
                    checked={selectedReason === reason.value}
                    onChange={() => setSelectedReason(reason.value)}
                    className="mt-1 h-4 w-4 text-primary"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{reason.label}</p>
                    <p className="text-xs text-muted-foreground">{reason.description}</p>
                  </div>
                </label>
              ))}
            </div>
            <Label htmlFor="details">Additional details (optional)</Label>
            <Input
              id="details"
              placeholder="Any additional context..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="min-h-[80px]"
              asChild
            >
              <textarea
                id="details"
                placeholder="Any additional context..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full min-h-[80px] p-2 rounded border bg-transparent resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </Input>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleBack} className="flex-1">
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleReport} disabled={submitting || !selectedReason} className="flex-1">
                {submitting ? "Submitting..." : "Submit report"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}