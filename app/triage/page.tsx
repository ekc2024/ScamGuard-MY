import type { Metadata } from "next";
import { ScamTriageForm } from "@/components/scam-triage-form";
import { DISCLAIMERS } from "@/lib/scam-triage/disclaimers";

export const metadata: Metadata = {
  title: "ScamGuard MY - Scam Triage",
  description:
    "Paste a suspicious Malaysian scam message and get a STOP-CHECK-REPORT assessment. AI-generated assessment, not an official determination.",
};

export default function TriagePage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-[#1A1F36] tracking-tight">Scam Triage</h1>
          <p className="text-[#1A1F36]/60 mt-3">
            Paste a forwarded message and get a STOP-CHECK-REPORT assessment against six scam categories seen in the TAR
            UMT Scam Ready Movers survey.
          </p>
          <ul className="mt-4 space-y-1 text-xs text-[#1A1F36]/60">
            {DISCLAIMERS.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </header>

        <ScamTriageForm />
      </div>
    </div>
  );
}
