"use client";

import { useState } from "react";
import { AlertTriangle, Flag, Loader2, SearchCheck, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DISCLAIMERS } from "@/lib/scam-triage/disclaimers";
import { MAX_MESSAGE_LENGTH } from "@/lib/scam-triage/triage";
import type { TriageResult, UrlRisk, Verdict } from "@/lib/scam-triage/types";
import { cn } from "@/lib/utils";

const SAMPLES: { label: string; text: string }[] = [
  {
    label: "TnG eWallet phishing",
    text:
      "AMARAN: Akaun TNG eWallet anda akan digantung dalam 12 jam. Sahkan akaun dan OTP anda di https://tngo-reload-verify.xyz/login untuk elak akaun disekat.",
  },
  {
    label: "WhatsApp APK giveaway",
    text:
      "Congratulations! You have won a free hamper from our 2026 giveaway. Download the app here https://wasap-hadiah2026.click/gift.apk and forward this to 5 friends to claim.",
  },
  {
    label: "Part-time job deposit",
    text:
      "Hi, we are hiring part time staff. Easy task, earn RM300 per day, no experience needed. Pay RM250 refundable deposit first to Maybank account 514012345678, then WhatsApp admin at 012-345 6789.",
  },
];

const VERDICT_STYLES: Record<Verdict, { badge: string; panel: string; icon: typeof ShieldAlert; blurb: string }> = {
  STOP: {
    badge: "bg-red-600 text-white",
    panel: "border-red-200 bg-red-50",
    icon: ShieldAlert,
    blurb: "Strong scam indicators. Do not engage.",
  },
  REPORT: {
    badge: "bg-red-700 text-white",
    panel: "border-red-300 bg-red-50",
    icon: Flag,
    blurb: "Matches a demo reference entry. Stop and report.",
  },
  CHECK: {
    badge: "bg-amber-500 text-[#1A1F36]",
    panel: "border-amber-200 bg-amber-50",
    icon: SearchCheck,
    blurb: "Unclear. Verify through an official channel first.",
  },
};

const RISK_STYLES: Record<UrlRisk, string> = {
  high: "bg-red-100 text-red-800 border-red-200",
  medium: "bg-amber-100 text-amber-900 border-amber-200",
  low: "bg-emerald-100 text-emerald-800 border-emerald-200",
  unknown: "bg-slate-100 text-slate-700 border-slate-200",
};

function Section({
  step,
  title,
  children,
}: {
  step: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#1A1F36]/10 bg-white p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-bold tracking-widest text-[#1A1F36]/50">{step}</span>
        <h3 className="text-sm font-bold text-[#1A1F36] uppercase tracking-wide">{title}</h3>
      </div>
      {children}
    </section>
  );
}

export function ScamTriageForm() {
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<TriageResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (message.trim().length === 0) {
      setError("Paste the message you want checked.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || "Could not check this message. Try again.");
        return;
      }
      setResult(data.result as TriageResult);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const verdictStyle = result ? VERDICT_STYLES[result.verdict] : null;
  const VerdictIcon = verdictStyle?.icon ?? ShieldAlert;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-3">
        <label htmlFor="scam-message" className="block text-sm font-medium text-[#1A1F36]">
          Paste the suspicious message
        </label>
        <Textarea
          id="scam-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Paste the WhatsApp, SMS or social media message here, including any link or phone number."
          rows={7}
          maxLength={MAX_MESSAGE_LENGTH}
          className="resize-y bg-white"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={loading} className="bg-[#1A1F36] hover:bg-[#1A1F36]/90 text-white">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Checking
              </>
            ) : (
              "Check this message"
            )}
          </Button>
          <span className="text-xs text-[#1A1F36]/50">Text only. Nothing is stored.</span>
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-[#1A1F36]/60">Try an example:</span>
        {SAMPLES.map((sample) => (
          <button
            key={sample.label}
            type="button"
            onClick={() => {
              setMessage(sample.text);
              setResult(null);
              setError(null);
            }}
            className="text-xs px-3 py-1.5 rounded-full border border-[#1A1F36]/15 text-[#1A1F36]/80 hover:bg-[#1A1F36]/5 transition-colors"
          >
            {sample.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="flex items-center gap-2 text-sm text-red-700">
          <AlertTriangle className="w-4 h-4" /> {error}
        </p>
      )}

      {result && verdictStyle && (
        <div className="space-y-4">
          <div className={cn("rounded-xl border p-5", verdictStyle.panel)}>
            <div className="flex items-start gap-3">
              <VerdictIcon className="w-6 h-6 mt-0.5 text-[#1A1F36]" />
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={cn("text-sm font-bold px-3 py-1", verdictStyle.badge)}>{result.verdict}</Badge>
                  {result.categoryLabel && (
                    <Badge variant="outline" className="text-xs">
                      {result.categoryLabel}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {result.confidence} confidence
                  </Badge>
                  {result.coverage === "partial" && (
                    <Badge variant="outline" className="text-xs">
                      category only partially covered in this prototype
                    </Badge>
                  )}
                </div>
                <p className="text-base font-semibold text-[#1A1F36]">{result.headline}</p>
                <p className="text-sm text-[#1A1F36]/70">{verdictStyle.blurb}</p>
              </div>
            </div>
          </div>

          <Section step="01" title="Stop">
            <ul className="space-y-2 text-sm text-[#1A1F36]/80">
              {result.stop.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-red-600 font-bold">&times;</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section step="02" title="Check">
            <div className="space-y-4">
              {result.check.urls.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#1A1F36]/50">Link reputation</p>
                  {result.check.urls.map((check) => (
                    <div key={check.url} className={cn("rounded-lg border p-3", RISK_STYLES[check.risk])}>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-xs break-all">{check.domain ?? check.url}</span>
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {check.risk} risk
                        </Badge>
                        {check.lookalikeOf && (
                          <Badge variant="outline" className="text-[10px]">
                            imitates {check.lookalikeOf}
                          </Badge>
                        )}
                      </div>
                      <ul className="text-xs space-y-1">
                        {check.reasons.map((reason) => (
                          <li key={reason}>- {reason}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {result.check.references.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#1A1F36]/50">
                    Demo reference list (placeholder data, not a live database)
                  </p>
                  {result.check.references.map((reference) => (
                    <div
                      key={`${reference.type}-${reference.normalized}`}
                      className={cn(
                        "rounded-lg border p-3 text-xs",
                        reference.matched ? "border-red-200 bg-red-50 text-red-900" : "border-slate-200 bg-slate-50 text-slate-700"
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono break-all">{reference.identifier}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {reference.type.replace("_", " ")}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {reference.matched ? `${reference.reportCount} demo reports` : "no demo match"}
                        </Badge>
                      </div>
                      <p>{reference.note}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#1A1F36]/50">Verify yourself</p>
                <ul className="space-y-2 text-sm text-[#1A1F36]/80">
                  {result.check.userActions.map((action) => (
                    <li key={action} className="flex gap-2">
                      <span className="text-[#F5A623] font-bold">&rarr;</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Section>

          <Section step="03" title="Report">
            <ul className="space-y-2 text-sm text-[#1A1F36]/80">
              {result.report.map((channel) => (
                <li key={channel.channel}>
                  <span className="font-semibold text-[#1A1F36]">{channel.channel}</span> - {channel.detail}
                </li>
              ))}
            </ul>
          </Section>

          <div className="rounded-xl border border-[#1A1F36]/10 bg-[#1A1F36]/[0.03] p-4">
            <ul className="space-y-1 text-xs text-[#1A1F36]/70">
              {(result.disclaimers.length > 0 ? result.disclaimers : [...DISCLAIMERS]).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
