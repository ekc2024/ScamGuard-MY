"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Play, Copy, Check, Loader2, AlertTriangle, Sparkles } from "lucide-react";

const AVAILABLE_SHOTS = [
  { value: "wan-1", label: "WAN 2.6 — Shot 1: Opening Hook (5s)", model: "wan" },
  { value: "wan-5", label: "WAN 2.6 — Shot 5: Data Moment (8s)", model: "wan" },
  { value: "wan-7", label: "WAN 2.6 — Shot 7: Title Card (5s)", model: "wan" },
  { value: "ltx-2", label: "LTX-2 — Shot 2: Character Intro (6s)", model: "ltx" },
];

type GenerationStatus = "idle" | "sending" | "processing" | "completed" | "error";

export function WanTestPanel() {
  const [selectedShot, setSelectedShot] = useState("wan-1");
  const selectedShotData = AVAILABLE_SHOTS.find(s => s.value === selectedShot);
  const isLtxSelected = selectedShotData?.model === "ltx";
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const handleGenerate = async () => {
    setStatus("sending");
    setVideoUrl(null);
    setError(null);

    try {
      const response = await fetch("/api/test-wan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shotId: selectedShot }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start generation");
      }

      if (data.status === "queued" && data.requestId) {
        setStatus("processing");
        const model = data.model || "wan";
        // Start polling
        pollIntervalRef.current = setInterval(async () => {
          try {
            const pollResponse = await fetch(`/api/test-wan?requestId=${data.requestId}&model=${model}`);
            const pollData = await pollResponse.json();

            if (pollData.status === "completed" && pollData.videoUrl) {
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
              }
              setVideoUrl(pollData.videoUrl);
              setStatus("completed");
            } else if (pollData.error) {
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
              }
              throw new Error(pollData.error);
            }
          } catch (err) {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
            }
            setError(err instanceof Error ? err.message : "Polling failed");
            setStatus("error");
          }
        }, 3000);
      } else if (data.status === "completed" && data.videoUrl) {
        setVideoUrl(data.videoUrl);
        setStatus("completed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate");
      setStatus("error");
    }
  };

  const handleCopyUrl = async () => {
    if (videoUrl) {
      await navigator.clipboard.writeText(videoUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "sending":
        return "Sending prompt to fal.ai...";
      case "processing":
        return isLtxSelected ? "LTX-2 processing..." : "WAN 2.6 processing...";
      case "completed":
        return "Clip ready";
      case "error":
        return "Generation failed";
      default:
        return null;
    }
  };

  return (
    <Card className="mt-8 border-2 border-dashed border-orange-300/50 bg-orange-50/30">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-orange-100">
            <Sparkles className="w-4 h-4 text-orange-600" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold text-orange-900">
              Try WAN Generation
            </CardTitle>
            <p className="text-xs text-orange-700/70 mt-0.5">
              Test feature — not part of main UI
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Shot selector and generate button */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedShot} onValueChange={setSelectedShot}>
            <SelectTrigger className="flex-1 bg-white border-orange-200">
              <SelectValue placeholder="Select a shot" />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_SHOTS.map((shot) => (
                <SelectItem key={shot.value} value={shot.value}>
                  {shot.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={handleGenerate}
            disabled={status === "sending" || status === "processing"}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {status === "sending" || status === "processing" ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Generate with {isLtxSelected ? "LTX-2" : "WAN"}
              </>
            )}
          </Button>
          </div>
          {isLtxSelected && (
            <p className="text-[11px] text-orange-600/80 hidden sm:block">
              LTX-2 is for testing only — not eligible for KaryaWAN
            </p>
          )}
        </div>

        {/* Status indicator */}
        {status !== "idle" && (
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
              status === "completed" && "bg-green-100 text-green-800",
              status === "error" && "bg-red-100 text-red-800",
              (status === "sending" || status === "processing") &&
                "bg-orange-100 text-orange-800"
            )}
          >
            {(status === "sending" || status === "processing") && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
            {status === "completed" && <Check className="w-4 h-4" />}
            {status === "error" && <AlertTriangle className="w-4 h-4" />}
            <span>{getStatusText()}</span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {/* Video player */}
        {videoUrl && (
          <div className="space-y-3">
            <div className="relative rounded-lg overflow-hidden bg-black aspect-[9/16] max-w-[280px] mx-auto">
              <video
                src={videoUrl}
                controls
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyUrl}
                className="border-orange-200 text-orange-700"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-1.5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1.5" />
                    Copy clip URL
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-[10px] text-orange-600/60 text-center pt-2 border-t border-orange-200/50">
          Test only — uses fal.ai WAN 2.6 T2V · ~$0.05 per generation from your FAL_KEY credits
        </p>
      </CardContent>
    </Card>
  );
}
