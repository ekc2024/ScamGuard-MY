"use client";

import { useEffect, useState } from "react";
import { Inbox, Play, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { triageScamMessage } from "@/lib/scam-triage";

interface InboxMessage {
  id: string;
  sender: string;
  initials: string;
  subject: string;
  preview: string;
  body: string;
}

type Verdict = "scam" | "potential" | "safe";
type ScanState = "pending" | "scanning" | Verdict;

const MESSAGES: InboxMessage[] = [
  {
    id: "lhdn",
    sender: "LHDN e-Filing",
    initials: "LH",
    subject: "Tax rebate waiting for you",
    preview: "You have an unclaimed refund of RM3,847...",
    body: "LHDN: You have an unclaimed tax rebate of RM3,847. Click this link to claim your refund now: https://bit.ly/lhdn-refund and verify your identity with your NRIC and bank account number.",
  },
  {
    id: "maybank",
    sender: "Maybank Security",
    initials: "MB",
    subject: "Urgent: verify your account",
    preview: "Your account will be blocked within 24 hours...",
    body: "Maybank: Your account will be blocked within 24 hours. Click this link to verify your account and enter your OTP and TAC: https://maybank-secure.example.com/verify",
  },
  {
    id: "parcel",
    sender: "Parcel Notice",
    initials: "PN",
    subject: "Shipment requires action",
    preview: "Your parcel delivery is on hold. Pay RM8.50...",
    body: "Pos Laju: Your parcel delivery is on hold. Pay RM8.50 now and click this link to update your address: https://bit.ly/parcel-update",
  },
  {
    id: "tnb",
    sender: "TNB Billing",
    initials: "TB",
    subject: "Bill reminder",
    preview: "Your TNB bill statement is ready to view...",
    body: "TNB: Your monthly bill statement is ready to view in the myTNB app.",
  },
  {
    id: "dinner",
    sender: "Aunty Mei",
    initials: "AM",
    subject: "Dinner tonight",
    preview: "Dinner is at 7pm tonight, need a ride?",
    body: "Hi, dinner is at 7pm tonight. Let me know if you need a ride from the office.",
  },
];

const SCAN_DELAY_MS = 1200;

function classify(body: string): Verdict {
  const { band } = triageScamMessage(body);
  if (band === "Likely Scam") return "scam";
  if (band === "Suspicious") return "potential";
  return "safe";
}

const VERDICT_STYLES: Record<Verdict, { badge: string; label: string }> = {
  scam: { badge: "bg-red-100 text-red-700", label: "⚠ Scam" },
  potential: { badge: "bg-[#F5A623]/20 text-[#B57A0B]", label: "? Potential Scam" },
  safe: { badge: "bg-emerald-100 text-emerald-700", label: "✓ Safe" },
};

export function ScamInboxVisualization() {
  const [states, setStates] = useState<Record<string, ScanState>>(
    Object.fromEntries(MESSAGES.map((message) => [message.id, "pending"])),
  );
  const [scanIndex, setScanIndex] = useState(-1);

  const isRunning = scanIndex >= 0 && scanIndex < MESSAGES.length;
  const isDone =
    scanIndex >= MESSAGES.length ||
    MESSAGES.every((message) => {
      const state = states[message.id];
      return state === "scam" || state === "potential" || state === "safe";
    });

  useEffect(() => {
    if (!isRunning) return;
    const message = MESSAGES[scanIndex];
    setStates((previous) => ({ ...previous, [message.id]: "scanning" }));
    const timer = setTimeout(() => {
      setStates((previous) => ({
        ...previous,
        [message.id]: classify(message.body),
      }));
      setScanIndex((index) => index + 1);
    }, SCAN_DELAY_MS);
    return () => clearTimeout(timer);
  }, [scanIndex, isRunning]);

  const start = () => {
    setStates(
      Object.fromEntries(MESSAGES.map((message) => [message.id, "pending"])),
    );
    setScanIndex(0);
  };

  const reset = () => {
    setStates(
      Object.fromEntries(MESSAGES.map((message) => [message.id, "pending"])),
    );
    setScanIndex(-1);
  };

  const inboxMessages = MESSAGES.filter((message) => {
    const state = states[message.id];
    return state === "pending" || state === "scanning" || state === "safe";
  });
  const scamMessages = MESSAGES.filter(
    (message) => states[message.id] === "scam",
  );
  const potentialMessages = MESSAGES.filter(
    (message) => states[message.id] === "potential",
  );

  const renderMessage = (message: InboxMessage) => {
    const state = states[message.id];
    const verdict =
      state === "scam" || state === "potential" || state === "safe"
        ? VERDICT_STYLES[state]
        : null;
    return (
      <div
        key={message.id}
        className={`flex items-center gap-3 rounded-lg border bg-white px-3 py-2.5 transition-all duration-500 ${
          state === "scanning"
            ? "border-[#F5A623] shadow-[0_0_0_3px_rgba(245,166,35,0.15)]"
            : "border-[#1A1F36]/10"
        }`}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1A1F36]/5 text-xs font-bold text-[#1A1F36]">
          {message.initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#1A1F36]">
            {message.sender}
          </p>
          <p className="truncate text-xs text-[#1A1F36]/60">
            {message.subject} — {message.preview}
          </p>
        </div>
        {state === "scanning" && (
          <span className="shrink-0 animate-pulse rounded-full bg-[#F5A623]/20 px-2 py-0.5 text-[10px] font-semibold text-[#B57A0B]">
            Scanning...
          </span>
        )}
        {verdict && (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${verdict.badge}`}
          >
            {verdict.label}
          </span>
        )}
      </div>
    );
  };

  return (
    <Card className="border-[#1A1F36]/10 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl text-[#1A1F36]">
          <ShieldCheck className="h-5 w-5 text-[#F5A623]" />
          Always-on inbox protection (demo)
        </CardTitle>
        <CardDescription>
          A visual simulation of automatic scanning: incoming messages are
          triaged and moved into Scam or Potential Scam folders before you ever
          open them.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={start}
              disabled={isRunning}
              className="bg-[#1A1F36] text-white hover:bg-[#1A1F36]/90"
            >
              <Play className="h-4 w-4" />
              {isDone && scanIndex >= 0 ? "Scan again" : "Scan inbox"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={reset}
              disabled={scanIndex < 0}
              className="border-[#1A1F36]/15 text-[#1A1F36]"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
          <p className="text-xs text-[#1A1F36]/55">
            Verdicts come from the same triage rules as the checker above.
          </p>
        </div>

        <div className="rounded-xl border border-[#1A1F36]/10 bg-[#F7F8FC] p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#1A1F36]">
            <Inbox className="h-4 w-4" />
            Inbox ({inboxMessages.length})
          </div>
          <div className="space-y-2">
            {inboxMessages.length > 0 ? (
              inboxMessages.map(renderMessage)
            ) : (
              <p className="py-4 text-center text-xs text-[#1A1F36]/45">
                Inbox is clean.
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-red-200 bg-red-50/60 p-4">
            <p className="mb-3 text-sm font-semibold text-red-700">
              Scam ({scamMessages.length})
            </p>
            <div className="space-y-2">
              {scamMessages.length > 0 ? (
                scamMessages.map(renderMessage)
              ) : (
                <p className="py-4 text-center text-xs text-red-700/50">
                  Confirmed scams are moved here automatically.
                </p>
              )}
            </div>
          </div>
          <div className="rounded-xl border border-[#F5A623]/40 bg-[#F5A623]/10 p-4">
            <p className="mb-3 text-sm font-semibold text-[#B57A0B]">
              Potential Scam ({potentialMessages.length})
            </p>
            <div className="space-y-2">
              {potentialMessages.length > 0 ? (
                potentialMessages.map(renderMessage)
              ) : (
                <p className="py-4 text-center text-xs text-[#B57A0B]/60">
                  Suspicious messages land here for your review.
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
