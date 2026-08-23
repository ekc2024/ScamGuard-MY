"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Copy,
  Check,
  FileText,
  Image as ImageIcon,
  Video,
  Mail,
  Calendar,
  HardDrive,
  AlertCircle,
  Sparkles,
  Layers,
  Download,
  ExternalLink,
  RotateCcw,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StoryboardGrid, parseStoryboardFromText, type StoryboardShot } from "@/components/storyboard-grid";
import { WanTestPanel } from "@/components/wan-test-panel";
import type { BriefResult } from "@/app/api/briefs/[id]/route";

function ScoreRing({ score, label }: { score: number | null; label: string }) {
  const displayScore = score ?? 0;
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (displayScore / 100) * circumference;
  
  const getColor = (score: number) => {
    if (score >= 80) return "#22c55e";
    if (score >= 60) return "#F5A623";
    return "#ef4444";
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#1A1F36"
            strokeOpacity="0.1"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={getColor(displayScore)}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-[#1A1F36]">{displayScore}</span>
        </div>
      </div>
      <span className="text-sm font-medium text-[#1A1F36]/70">{label}</span>
    </div>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="border-[#1A1F36]/20 text-[#1A1F36]"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 mr-1 text-green-600" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="w-4 h-4 mr-1" />
          {label}
        </>
      )}
    </Button>
  );
}

function formatPromptsForClipboard(shots: StoryboardShot[]): string {
  if (shots.length === 0) return "";
  
  return shots.map((shot, index) => {
    return `${index + 1}. [SHOT ${String(index + 1).padStart(2, '0')}] (${shot.duration}) - ${shot.model}\n${shot.prompt}`;
  }).join("\n\n");
}

function generateBriefPDF(brief: BriefResult, shots: StoryboardShot[]) {
  // Create a formatted text version for download
  const content = `
================================================================================
                              VIDEO BRIEF
================================================================================

PROJECT: ${brief.briefTitle}
CLIENT: ${brief.client}
PLATFORM: ${brief.platform || 'N/A'}
DURATION: ${brief.duration || 'N/A'}
TONE: ${brief.tone || 'N/A'}

--------------------------------------------------------------------------------
                            SCRIPT
--------------------------------------------------------------------------------
${brief.script || 'Script not yet generated.'}

--------------------------------------------------------------------------------
                         STORYBOARD (${shots.length} SHOTS)
--------------------------------------------------------------------------------
${shots.map((shot, i) => `
SHOT ${String(i + 1).padStart(2, '0')} | ${shot.duration} | ${shot.model}
${'-'.repeat(60)}
Visual: ${shot.description}

WAN AI Prompt:
${shot.prompt}
`).join('\n')}

--------------------------------------------------------------------------------
                         IMAGE PROMPTS
--------------------------------------------------------------------------------
${brief.imagePrompts || 'No image prompts available.'}

--------------------------------------------------------------------------------
                         VIDEO PROMPTS
--------------------------------------------------------------------------------
${brief.videoPrompts || 'No video prompts available.'}

================================================================================
Generated by ScaleWithEnrich AI Screenwriter
================================================================================
`.trim();

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${brief.briefTitle.replace(/[^a-z0-9]/gi, '_')}_brief.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function ActionBar({ 
  brief, 
  shots,
  notionPageId 
}: { 
  brief: BriefResult; 
  shots: StoryboardShot[];
  notionPageId: string;
}) {
  const router = useRouter();
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopyAllPrompts = async () => {
    const formatted = formatPromptsForClipboard(shots);
    if (formatted) {
      await navigator.clipboard.writeText(formatted);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  const handleDownload = () => {
    generateBriefPDF(brief, shots);
  };

  const handleOpenInNotion = () => {
    // Format: https://notion.so/page-id
    const notionUrl = `https://notion.so/${notionPageId.replace(/-/g, '')}`;
    window.open(notionUrl, '_blank');
  };

  const handleStartOver = () => {
    router.push('/');
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-4 rounded-xl bg-[#1A1F36]/5 border border-[#1A1F36]/10 mb-6">
      <Button
        size="sm"
        onClick={handleCopyAllPrompts}
        disabled={shots.length === 0}
        className="bg-[#F5A623] hover:bg-[#F5A623]/90 text-[#1A1F36] font-medium"
      >
        {copiedAll ? (
          <>
            <Check className="w-4 h-4 mr-1.5" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 mr-1.5" />
            Copy All Prompts
          </>
        )}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
        className="border-[#1A1F36]/20 text-[#1A1F36]"
      >
        <Download className="w-4 h-4 mr-1.5" />
        Download Brief
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleOpenInNotion}
        className="border-[#1A1F36]/20 text-[#1A1F36]"
      >
        <ExternalLink className="w-4 h-4 mr-1.5" />
        Open in Notion
      </Button>

      <div className="flex-1" />

      <Button
        variant="ghost"
        size="sm"
        onClick={handleStartOver}
        className="text-[#1A1F36]/60 hover:text-[#1A1F36]"
      >
        <RotateCcw className="w-4 h-4 mr-1.5" />
        Start Over
      </Button>
    </div>
  );
}

function SummaryHeader({ brief, shotCount }: { brief: BriefResult; shotCount: number }) {
  // Calculate deadline countdown if available
  const getDeadlineText = () => {
    if (!brief.deadline) return null;
    const deadlineDate = new Date(brief.deadline);
    const now = new Date();
    const diff = deadlineDate.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return "Deadline passed";
    if (days === 0) return "Due today";
    if (days === 1) return "Due tomorrow";
    return `${days} days left`;
  };

  const deadlineText = getDeadlineText();

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 rounded-lg bg-gradient-to-r from-[#1A1F36] to-[#2a3352] text-white text-sm mb-6">
      <span className="font-semibold">{brief.client || brief.briefTitle}</span>
      
      {brief.platform && (
        <>
          <span className="w-1 h-1 rounded-full bg-white/30" />
          <span className="text-white/70">{brief.platform}</span>
        </>
      )}
      
      {brief.duration && (
        <>
          <span className="w-1 h-1 rounded-full bg-white/30" />
          <span className="px-2 py-0.5 rounded bg-white/10 font-medium">{brief.duration}</span>
        </>
      )}
      
      {shotCount > 0 && (
        <>
          <span className="w-1 h-1 rounded-full bg-white/30" />
          <span className="text-white/70">{shotCount} Shots</span>
        </>
      )}
      
      <span className="w-1 h-1 rounded-full bg-white/30" />
      <span className="px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 text-xs font-medium">WAN AI</span>
      
      {deadlineText && (
        <>
          <span className="w-1 h-1 rounded-full bg-white/30" />
          <span className="flex items-center gap-1 text-white/70">
            <Clock className="w-3.5 h-3.5" />
            {deadlineText}
          </span>
        </>
      )}
    </div>
  );
}

function ComingSoonButton({ icon: Icon, label }: { icon: typeof Mail; label: string }) {
  const [showToast, setShowToast] = useState(false);

  const handleClick = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        className="border-[#1A1F36]/20 text-[#1A1F36]/60"
      >
        <Icon className="w-4 h-4 mr-1" />
        {label}
      </Button>
      {showToast && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-[#1A1F36] text-white text-xs rounded-lg whitespace-nowrap animate-in fade-in slide-in-from-bottom-2">
          Coming Soon
        </div>
      )}
    </div>
  );
}

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [brief, setBrief] = useState<BriefResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBrief = async () => {
      try {
        const response = await fetch(`/api/briefs/${resolvedParams.id}`);
        const data = await response.json();

        if (data.success) {
          setBrief(data.brief);
        } else {
          setError(data.error || "Brief not found");
        }
      } catch {
        setError("Failed to load brief. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrief();
  }, [resolvedParams.id]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Spinner className="w-10 h-10 text-[#F5A623]" />
      </div>
    );
  }

  if (error || !brief) {
    return (
      <div className="min-h-[calc(100vh-4rem)] py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1F36] mb-2">Brief Not Found</h1>
          <p className="text-[#1A1F36]/60 mb-6">{error}</p>
          <Link href="/status">
            <Button className="bg-[#1A1F36] hover:bg-[#1A1F36]/90 text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Status
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const hasScript = brief.script && brief.script.trim().length > 0;
  const hasImagePrompts = brief.imagePrompts && brief.imagePrompts.trim().length > 0;
  const hasVideoPrompts = brief.videoPrompts && brief.videoPrompts.trim().length > 0;
  
  // Parse storyboard shots from video prompts if available
  const storyboardShots: StoryboardShot[] = hasVideoPrompts 
    ? parseStoryboardFromText(brief.videoPrompts!) 
    : [];
  const hasStoryboard = storyboardShots.length > 0;

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Back Link */}
        <Link
          href="/status"
          className="inline-flex items-center gap-1.5 text-sm text-[#1A1F36]/60 hover:text-[#1A1F36] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Status
        </Link>

        {/* Action Bar */}
        <ActionBar 
          brief={brief} 
          shots={storyboardShots} 
          notionPageId={resolvedParams.id} 
        />

        {/* Summary Header */}
        <SummaryHeader brief={brief} shotCount={storyboardShots.length} />

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-[#1A1F36]">{brief.briefTitle}</h1>
            {brief.status === "Script Ready" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                <Sparkles className="w-3.5 h-3.5" />
                Script Ready
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-[#1A1F36]/60">
            <span>{brief.client}</span>
            {brief.platform && (
              <>
                <span className="w-1 h-1 rounded-full bg-[#1A1F36]/30" />
                <span>{brief.platform}</span>
              </>
            )}
            {brief.duration && (
              <>
                <span className="w-1 h-1 rounded-full bg-[#1A1F36]/30" />
                <span>{brief.duration}</span>
              </>
            )}
            {brief.tone && (
              <>
                <span className="w-1 h-1 rounded-full bg-[#1A1F36]/30" />
                <span>{brief.tone}</span>
              </>
            )}
          </div>
        </div>

        {/* Scores */}
        {(brief.hookScore || brief.frameworkScore || brief.ctaScore) && (
          <Card className="mb-6 border-0 shadow-lg bg-gradient-to-br from-[#1A1F36] to-[#2a3352]">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Script Quality Scores</h2>
              <div className="flex justify-center gap-12">
                <div className="text-center">
                  <ScoreRing score={brief.hookScore} label="Hook" />
                </div>
                <div className="text-center">
                  <ScoreRing score={brief.frameworkScore} label="Framework" />
                </div>
                <div className="text-center">
                  <ScoreRing score={brief.ctaScore} label="CTA" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content Tabs */}
        <Tabs defaultValue="script" className="mb-8">
          <TabsList className="bg-[#1A1F36]/5 p-1">
            <TabsTrigger
              value="script"
              className="data-[state=active]:bg-white data-[state=active]:text-[#1A1F36]"
            >
              <FileText className="w-4 h-4 mr-2" />
              Script
            </TabsTrigger>
            <TabsTrigger
              value="image"
              className="data-[state=active]:bg-white data-[state=active]:text-[#1A1F36]"
              disabled={!hasImagePrompts}
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Image Prompts
            </TabsTrigger>
            <TabsTrigger
              value="video"
              className="data-[state=active]:bg-white data-[state=active]:text-[#1A1F36]"
              disabled={!hasVideoPrompts}
            >
              <Video className="w-4 h-4 mr-2" />
              Video Prompts
            </TabsTrigger>
            <TabsTrigger
              value="storyboard"
              className="data-[state=active]:bg-white data-[state=active]:text-[#1A1F36]"
              disabled={!hasStoryboard}
            >
              <Layers className="w-4 h-4 mr-2" />
              Storyboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="script" className="mt-4">
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg">Generated Script</CardTitle>
                <div className="flex items-center gap-2">
                  {hasScript && <CopyButton text={brief.script!} label="Copy Script" />}
                  <ComingSoonButton icon={Mail} label="Email" />
                  <ComingSoonButton icon={HardDrive} label="Save to Drive" />
                  <ComingSoonButton icon={Calendar} label="Schedule" />
                </div>
              </CardHeader>
              <CardContent>
                {hasScript ? (
                  <div className="bg-[#1A1F36]/5 rounded-xl p-6">
                    <pre className="whitespace-pre-wrap font-sans text-[#1A1F36] leading-relaxed">
                      {brief.script}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center py-12 text-[#1A1F36]/50">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Script is being generated...</p>
                    <p className="text-sm mt-1">Check back in a few minutes.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="image" className="mt-4">
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg">Image Generation Prompts</CardTitle>
                {hasImagePrompts && <CopyButton text={brief.imagePrompts!} label="Copy Prompts" />}
              </CardHeader>
              <CardContent>
                {hasImagePrompts ? (
                  <div className="bg-[#1A1F36]/5 rounded-xl p-6">
                    <pre className="whitespace-pre-wrap font-sans text-[#1A1F36] leading-relaxed">
                      {brief.imagePrompts}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center py-12 text-[#1A1F36]/50">
                    <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No image prompts available yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="video" className="mt-4">
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg">Video Generation Prompts</CardTitle>
                {hasVideoPrompts && <CopyButton text={brief.videoPrompts!} label="Copy Prompts" />}
              </CardHeader>
              <CardContent>
                {hasVideoPrompts ? (
                  <div className="bg-[#1A1F36]/5 rounded-xl p-6">
                    <pre className="whitespace-pre-wrap font-sans text-[#1A1F36] leading-relaxed">
                      {brief.videoPrompts}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center py-12 text-[#1A1F36]/50">
                    <Video className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No video prompts available yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="storyboard" className="mt-4">
            <Card className="border-0 shadow-lg bg-[#0f1219]">
              <CardHeader className="pb-4 border-b border-[#2a3352]">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg text-white">Storyboard Grid</CardTitle>
                    <p className="text-sm text-white/50 mt-1">
                      {storyboardShots.length} shots with WAN AI prompts
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">Wan-T2V</span>
                      <span className="px-2 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30">Wan-I2V</span>
                      <span className="px-2 py-1 rounded bg-orange-500/10 text-orange-400 border border-orange-500/30">Wan-R2V</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {hasStoryboard ? (
                  <StoryboardGrid shots={storyboardShots} />
                ) : (
                  <div className="text-center py-12 text-white/50">
                    <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No storyboard available yet.</p>
                    <p className="text-sm mt-1">Storyboard will appear when video prompts are generated.</p>
                  </div>
)}
  </CardContent>
  </Card>

            {/* WAN Test Panel */}
            <WanTestPanel />
          </TabsContent>
        </Tabs>

        {/* Brief Details Accordion */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Brief Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="text-xs text-[#1A1F36]/50 uppercase tracking-wide">Target Audience</span>
                <p className="text-[#1A1F36] mt-1">{brief.targetAudience || "Not specified"}</p>
              </div>
              <div>
                <span className="text-xs text-[#1A1F36]/50 uppercase tracking-wide">Purpose</span>
                <p className="text-[#1A1F36] mt-1">{brief.purpose || "Not specified"}</p>
              </div>
              <div>
                <span className="text-xs text-[#1A1F36]/50 uppercase tracking-wide">Video Mode</span>
                <p className="text-[#1A1F36] mt-1">{brief.videoMode || "Not specified"}</p>
              </div>
              <div>
                <span className="text-xs text-[#1A1F36]/50 uppercase tracking-wide">Key Message</span>
                <p className="text-[#1A1F36] mt-1">{brief.keyMessage || "Not specified"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
