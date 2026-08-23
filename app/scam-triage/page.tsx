"use client";

import { useState } from "react";
import {
  ArrowRight,
  ExternalLink,
  Loader2,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const CLAUDE_ARTIFACT_URL =
  "https://claude.ai/public/artifacts/00e25d86-01c3-4fd3-ae71-812355bcdc32";

const EXAMPLES = [
  {
    label: "Maybank OTP phish",
    message:
      "Maybank: Your account will be blocked within 24 hours. Click this link to verify your account and enter your OTP and TAC: https://maybank-secure.example.com/verify",
  },
  {
    label: "Parcel delivery scam",
    message:
      "Pos Laju: Your parcel delivery is on hold. Pay RM8.50 now and click this link to update your address: https://bit.ly/parcel-update",
  },
  {
    label: "Benign message",
    message:
      "Hi, dinner is at 7pm tonight. Let me know if you need a ride from the office.",
  },
];

export default function ScamTriagePage() {
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  const checkMessage = async (messageToCheck: string) => {
    if (!messageToCheck.trim()) {
      setError("Please paste a message to check.");
      setResult(null);
      return;
    }

    setIsChecking(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/scam-triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageToCheck }),
      });
      const data: unknown = await response.json();

      if (
        !response.ok ||
        typeof data !== "object" ||
        data === null ||
        !("result" in data) ||
        typeof data.result !== "string"
      ) {
        const errorMessage =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : "Failed to check this message. Please try again.";
        throw new Error(errorMessage);
      }

      setResult(data.result);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to check this message. Please try again.",
      );
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void checkMessage(message);
  };

  const handleExampleClick = (exampleMessage: string) => {
    setMessage(exampleMessage);
    void checkMessage(exampleMessage);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F7F8FC] px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1A1F36] shadow-lg">
            <ShieldAlert className="h-7 w-7 text-[#F5A623]" />
          </div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#F5A623]/15 px-3 py-1 text-xs font-semibold text-[#1A1F36]">
            <Sparkles className="h-3.5 w-3.5" />
            Simulated demo assessment
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1A1F36] sm:text-4xl">
            Scam Triage
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-[#1A1F36]/65">
            Paste a suspicious SMS, WhatsApp, or Instagram message below. This
            demo uses deterministic rules for common Malaysian and ASEAN scam
            patterns.
          </p>
          <a
            href={CLAUDE_ARTIFACT_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#1A1F36] underline decoration-[#F5A623] decoration-2 underline-offset-4 hover:text-[#F5A623]"
          >
            View the source prototype
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </header>

        <Card className="border-[#1A1F36]/10 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-[#1A1F36]">
              Check a message
            </CardTitle>
            <CardDescription>
              The simulated backend runs inside this app; no external service
              or live reference database is used.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Paste a suspicious SMS, WhatsApp, or Instagram message below."
                aria-label="Message to check"
                rows={8}
                disabled={isChecking}
                className="resize-y border-[#1A1F36]/15 bg-white text-[#1A1F36] placeholder:text-[#1A1F36]/40 focus-visible:border-[#F5A623] focus-visible:ring-[#F5A623]/30"
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-[#1A1F36]/55">
                  Rule-based demo for awareness and education.
                </p>
                <Button
                  type="submit"
                  disabled={isChecking}
                  className="bg-[#1A1F36] text-white hover:bg-[#1A1F36]/90"
                >
                  {isChecking ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      Check this message
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>

            {error && (
              <p role="alert" className="mt-4 text-sm font-medium text-red-600">
                {error}
              </p>
            )}
          </CardContent>
        </Card>

        <section className="mt-7" aria-labelledby="examples-heading">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div>
              <h2
                id="examples-heading"
                className="font-semibold text-[#1A1F36]"
              >
                Try an example
              </h2>
              <p className="text-sm text-[#1A1F36]/55">
                One click fills and checks a sample message.
              </p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {EXAMPLES.map((example) => (
              <Button
                key={example.label}
                type="button"
                variant="outline"
                disabled={isChecking}
                onClick={() => handleExampleClick(example.message)}
                className="h-auto min-h-12 justify-start border-[#1A1F36]/15 bg-white px-4 py-3 text-left text-[#1A1F36] hover:border-[#F5A623] hover:bg-[#F5A623]/5"
              >
                {example.label}
              </Button>
            ))}
          </div>
        </section>

        {result && (
          <Card className="mt-7 border-[#F5A623]/40 shadow-lg">
            <CardHeader className="border-b border-[#1A1F36]/10">
              <CardTitle className="text-xl text-[#1A1F36]">
                Assessment result
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-[#1A1F36]">
                {result}
              </pre>
              <div className="mt-6 space-y-1 border-t border-[#1A1F36]/10 pt-4 text-xs leading-5 text-[#1A1F36]/60">
                <p>AI-generated assessment — not an official determination.</p>
                <p>
                  Reference-list check uses demo placeholder data, not a live
                  database.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
