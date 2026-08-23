"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircleWarning, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { triageScamMessage, type ScamTriageResult } from "@/lib/scam-triage";

interface SequenceStep {
  from: "scammer" | "victim";
  text: string;
}

interface ScamSequence {
  id: string;
  label: string;
  description: string;
  steps: SequenceStep[];
}

const SEQUENCES: ScamSequence[] = [
  {
    id: "tng-phishing",
    label: "TNG eWallet phishing",
    description: "OTP-harvesting sequence impersonating Touch 'n Go.",
    steps: [
      {
        from: "scammer",
        text: "TNG eWallet: Akaun anda akan digantung dalam 24 jam. Sahkan identiti anda segera.",
      },
      { from: "victim", text: "Kenapa akaun saya digantung?" },
      {
        from: "scammer",
        text: "Aktiviti mencurigakan dikesan. Klik pautan ini untuk sahkan akaun anda: https://bit.ly/tng-sahkan",
      },
      { from: "victim", text: "Saya dah klik. Sekarang macam mana?" },
      {
        from: "scammer",
        text: "Masukkan nombor kad pengenalan dan kod OTP yang dihantar ke telefon anda untuk pengesahan.",
      },
    ],
  },
  {
    id: "job-deposit",
    label: "Job offer deposit scam",
    description: "Part-time job lure that ends with an upfront payment.",
    steps: [
      {
        from: "scammer",
        text: "Hi! We saw your profile. Part-time job, work from home, RM300-RM800 daily. Interested?",
      },
      { from: "victim", text: "Sounds good, what do I need to do?" },
      {
        from: "scammer",
        text: "Simple tasks only. Guaranteed returns every day. Add our HR on WhatsApp +62 812 3456 7890 to start.",
      },
      { from: "victim", text: "OK, I added. They say I need to activate?" },
      {
        from: "scammer",
        text: "Yes, pay RM100 now as activation deposit via bank transfer to unlock your first task. You earn it back immediately.",
      },
    ],
  },
  {
    id: "authority-fraud",
    label: "Fake police / LHDN call",
    description: "Authority impersonation escalating to a money transfer.",
    steps: [
      {
        from: "scammer",
        text: "This is LHDN. You have an unpaid tax rebate case. Your file has been passed to PDRM.",
      },
      { from: "victim", text: "What? I paid my taxes." },
      {
        from: "scammer",
        text: "A warrant will be issued within 24 hours. To avoid penalty, you must settle immediately.",
      },
      { from: "victim", text: "How do I settle it?" },
      {
        from: "scammer",
        text: "Transfer the amount now to this bank account for verification: 5123 4567 8901. Do not tell anyone.",
      },
    ],
  },
];

const STEP_DELAY_MS = 1400;

function bandColor(band: ScamTriageResult["band"]): string {
  if (band === "Likely Scam") return "text-red-600";
  if (band === "Suspicious") return "text-[#F5A623]";
  return "text-emerald-600";
}

function meterColor(score: number): string {
  if (score >= 60) return "bg-red-500";
  if (score >= 30) return "bg-[#F5A623]";
  return "bg-emerald-500";
}

export function ScamSequenceSimulator() {
  const [sequence, setSequence] = useState<ScamSequence>(SEQUENCES[0]);
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const chatRef = useRef<HTMLDivElement | null>(null);

  const shownSteps = sequence.steps.slice(0, visibleSteps);
  const scammerText = shownSteps
    .filter((step) => step.from === "scammer")
    .map((step) => step.text)
    .join("\n");
  const triage = scammerText ? triageScamMessage(scammerText) : null;
  const isFinished = visibleSteps >= sequence.steps.length;

  useEffect(() => {
    if (!isPlaying) return;
    if (visibleSteps >= sequence.steps.length) {
      setIsPlaying(false);
      return;
    }
    const timer = setTimeout(() => {
      setVisibleSteps((count) => count + 1);
    }, STEP_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isPlaying, visibleSteps, sequence]);

  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [visibleSteps]);

  const selectSequence = (next: ScamSequence) => {
    setSequence(next);
    setVisibleSteps(0);
    setIsPlaying(false);
  };

  const play = () => {
    if (isFinished) setVisibleSteps(0);
    setIsPlaying(true);
  };

  const reset = () => {
    setVisibleSteps(0);
    setIsPlaying(false);
  };

  return (
    <Card className="border-[#1A1F36]/10 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl text-[#1A1F36]">
          <MessageCircleWarning className="h-5 w-5 text-[#F5A623]" />
          Scam sequence simulation
        </CardTitle>
        <CardDescription>
          Watch a real scam conversation unfold step by step while the triage
          engine re-scores the risk live. Runs entirely on the built-in rule
          engine — no paid API calls.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-3">
          {SEQUENCES.map((item) => (
            <Button
              key={item.id}
              type="button"
              variant="outline"
              onClick={() => selectSequence(item)}
              className={`h-auto min-h-12 justify-start px-4 py-3 text-left ${
                item.id === sequence.id
                  ? "border-[#F5A623] bg-[#F5A623]/10 text-[#1A1F36]"
                  : "border-[#1A1F36]/15 bg-white text-[#1A1F36] hover:border-[#F5A623] hover:bg-[#F5A623]/5"
              }`}
            >
              {item.label}
            </Button>
          ))}
        </div>
        <p className="text-xs text-[#1A1F36]/55">{sequence.description}</p>

        <div
          ref={chatRef}
          className="h-64 space-y-3 overflow-y-auto rounded-xl border border-[#1A1F36]/10 bg-[#F7F8FC] p-4"
          aria-live="polite"
        >
          {shownSteps.length === 0 && (
            <p className="pt-20 text-center text-sm text-[#1A1F36]/45">
              Press play to start the simulation.
            </p>
          )}
          {shownSteps.map((step, index) => (
            <div
              key={index}
              className={`flex ${step.from === "victim" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-6 shadow-sm ${
                  step.from === "victim"
                    ? "rounded-br-sm bg-[#1A1F36] text-white"
                    : "rounded-bl-sm border border-red-200 bg-white text-[#1A1F36]"
                }`}
              >
                <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide opacity-60">
                  {step.from === "victim" ? "You" : "Unknown sender"}
                </span>
                {step.text}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={play}
              disabled={isPlaying}
              className="bg-[#1A1F36] text-white hover:bg-[#1A1F36]/90"
            >
              <Play className="h-4 w-4" />
              {isFinished ? "Replay" : "Play simulation"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={reset}
              disabled={visibleSteps === 0}
              className="border-[#1A1F36]/15 text-[#1A1F36]"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
          <p className="text-xs text-[#1A1F36]/55">
            Step {Math.min(visibleSteps, sequence.steps.length)} of{" "}
            {sequence.steps.length}
          </p>
        </div>

        <div className="rounded-xl border border-[#1A1F36]/10 bg-white p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-[#1A1F36]">Live risk score</span>
            <span
              className={`font-bold ${triage ? bandColor(triage.band) : "text-[#1A1F36]/40"}`}
            >
              {triage ? `${triage.score}/100 — ${triage.band}` : "Waiting..."}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#1A1F36]/10">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                triage ? meterColor(triage.score) : "bg-[#1A1F36]/10"
              }`}
              style={{ width: `${triage?.score ?? 0}%` }}
            />
          </div>
          {triage && triage.matchedSignals.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-[#1A1F36]/70">
              {triage.matchedSignals.map((signal) => (
                <li key={signal}>• {signal}</li>
              ))}
            </ul>
          )}
          {isFinished && triage && (
            <p className="mt-3 border-t border-[#1A1F36]/10 pt-3 text-xs leading-5 text-[#1A1F36]/70">
              <span className="font-semibold text-[#1A1F36]">
                Recommended action:
              </span>{" "}
              {triage.recommendedAction}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
