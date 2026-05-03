"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StoryboardShot {
  shotNumber: number;
  duration: string;
  wanModel: "Wan-T2V" | "Wan-I2V" | "Wan-R2V";
  visualDescription: string;
  wanPrompt: string;
}

interface StoryboardGridProps {
  shots: StoryboardShot[];
  className?: string;
}

const WAN_MODEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Wan-T2V": { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
  "Wan-I2V": { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
  "Wan-R2V": { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30" },
};

function ShotCard({ shot }: { shot: StoryboardShot }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const modelStyle = WAN_MODEL_COLORS[shot.wanModel] || WAN_MODEL_COLORS["Wan-T2V"];

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(shot.wanPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl bg-[#1A1F36] border border-[#2a3352] overflow-hidden transition-all duration-200 hover:border-[#F5A623]/30">
      {/* Card Header */}
      <div className="p-4 space-y-3">
        {/* Badges Row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Shot Number Badge */}
          <span className="px-2.5 py-1 rounded-md bg-[#F5A623] text-[#1A1F36] text-xs font-bold tracking-wide">
            SHOT {String(shot.shotNumber).padStart(2, "0")}
          </span>

          {/* Duration Pill */}
          <span className="px-2.5 py-1 rounded-full bg-white/10 text-white/80 text-xs font-medium">
            {shot.duration}
          </span>

          {/* WAN Model Badge */}
          <span
            className={cn(
              "px-2.5 py-1 rounded-md text-xs font-semibold border",
              modelStyle.bg,
              modelStyle.text,
              modelStyle.border
            )}
          >
            {shot.wanModel}
          </span>
        </div>

        {/* Visual Description */}
        <p className="text-white/90 text-sm leading-relaxed">{shot.visualDescription}</p>
      </div>

      {/* Expandable Prompt Section */}
      <div className="border-t border-[#2a3352]">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between text-white/60 hover:text-white/80 transition-colors"
        >
          <span className="text-xs font-medium uppercase tracking-wide">WAN AI Prompt</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="px-4 pb-4 space-y-3">
            <div className="bg-[#0f1219] rounded-lg p-4 border border-[#2a3352]">
              <pre className="text-white/70 text-xs leading-relaxed whitespace-pre-wrap font-mono">
                {shot.wanPrompt}
              </pre>
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                copied
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10"
              )}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy Prompt
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StoryboardGrid({ shots, className }: StoryboardGridProps) {
  if (!shots || shots.length === 0) {
    return (
      <div className="text-center py-12 text-white/50">
        <p>No storyboard shots available.</p>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", className)}>
      {shots.map((shot) => (
        <ShotCard key={shot.shotNumber} shot={shot} />
      ))}
    </div>
  );
}

// Helper function to parse storyboard from markdown/text format
// Supports format: SHOT 01 | 5s | Wan-T2V | Label\nPrompt content...
export function parseStoryboardFromText(text: string): StoryboardShot[] {
  const shots: StoryboardShot[] = [];
  
  // Split by double newline to get individual shot blocks
  const shotBlocks = text.split(/\n\n+/).filter(block => 
    block.trim().match(/^SHOT\s*\d+/i)
  );

  for (const block of shotBlocks) {
    const lines = block.trim().split("\n");
    if (lines.length === 0) continue;

    // Parse header line: SHOT 01 | 5s | Wan-T2V | Label
    const headerLine = lines[0];
    const headerMatch = headerLine.match(/SHOT\s*(\d+)\s*\|\s*(\d+s?)\s*\|\s*(Wan-[A-Z0-9]+)\s*\|\s*(.+)/i);
    
    if (headerMatch) {
      const shotNumber = parseInt(headerMatch[1], 10);
      const duration = headerMatch[2].includes('s') ? headerMatch[2] : `${headerMatch[2]}s`;
      const modelRaw = headerMatch[3];
      const label = headerMatch[4].trim();
      
      // Normalize WAN model
      let wanModel: "Wan-T2V" | "Wan-I2V" | "Wan-R2V" = "Wan-T2V";
      if (modelRaw.toLowerCase().includes("i2v")) {
        wanModel = "Wan-I2V";
      } else if (modelRaw.toLowerCase().includes("r2v")) {
        wanModel = "Wan-R2V";
      }
      
      // The prompt is everything after the header line
      const promptLines = lines.slice(1).join("\n").trim();
      
      shots.push({
        shotNumber,
        duration,
        wanModel,
        visualDescription: label,
        wanPrompt: promptLines || label,
      });
    } else {
      // Fallback: try to parse older format
      const fallbackMatch = headerLine.match(/SHOT\s*(\d+)/i);
      if (fallbackMatch) {
        const shotNumber = parseInt(fallbackMatch[1], 10);
        const content = lines.slice(1).join("\n").trim() || lines[0];
        
        // Extract duration
        const durationMatch = content.match(/(\d+)s/i);
        const duration = durationMatch ? `${durationMatch[1]}s` : "5s";
        
        // Detect model
        let wanModel: "Wan-T2V" | "Wan-I2V" | "Wan-R2V" = "Wan-T2V";
        if (content.toLowerCase().includes("wan-i2v")) wanModel = "Wan-I2V";
        else if (content.toLowerCase().includes("wan-r2v")) wanModel = "Wan-R2V";
        
        shots.push({
          shotNumber,
          duration,
          wanModel,
          visualDescription: content.split("\n")[0].substring(0, 80) || "Visual scene",
          wanPrompt: content,
        });
      }
    }
  }
  
  // Sort by shot number
  shots.sort((a, b) => a.shotNumber - b.shotNumber);
  
  return shots;
}
