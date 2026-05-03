"use client";

import { useNotionStatus } from "./notion-status-provider";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} min ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
}

export function NotionStatusBar() {
  const { status, lastSyncTime, checkConnection } = useNotionStatus();

  const statusColor = {
    connected: "bg-emerald-500",
    disconnected: "bg-red-500",
    syncing: "bg-amber-500 animate-pulse",
  };

  const statusText = {
    connected: "Notion connected",
    disconnected: "Notion disconnected",
    syncing: "Syncing...",
  };

  return (
    <div className="fixed top-20 right-4 z-40">
      <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm border border-[#1A1F36]/10 shadow-sm">
        {/* Status dot and text */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              statusColor[status]
            )}
          />
          <span className="text-xs text-[#1A1F36]/70">
            {statusText[status]}
          </span>
        </div>

        {/* Last sync time */}
        {status === "connected" && lastSyncTime && (
          <>
            <span className="text-[#1A1F36]/30">·</span>
            <span className="text-xs text-[#1A1F36]/50">
              Saved {formatTimeAgo(lastSyncTime)}
            </span>
          </>
        )}

        {/* Reconnect button when disconnected */}
        {status === "disconnected" && (
          <button
            onClick={() => checkConnection()}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-[#1A1F36] text-white hover:bg-[#1A1F36]/90 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Reconnect
          </button>
        )}

        {/* Syncing indicator */}
        {status === "syncing" && (
          <RefreshCw className="w-3 h-3 text-amber-500 animate-spin" />
        )}
      </div>
    </div>
  );
}
