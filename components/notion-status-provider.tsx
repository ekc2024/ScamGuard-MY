"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

type ConnectionStatus = "connected" | "disconnected" | "syncing";

interface NotionStatusContextType {
  status: ConnectionStatus;
  lastSyncTime: Date | null;
  lastSyncBriefName: string | null;
  setStatus: (status: ConnectionStatus) => void;
  showSyncSuccess: (briefName: string) => void;
  checkConnection: () => Promise<void>;
}

const NotionStatusContext = createContext<NotionStatusContextType | null>(null);

export function useNotionStatus() {
  const context = useContext(NotionStatusContext);
  if (!context) {
    throw new Error("useNotionStatus must be used within NotionStatusProvider");
  }
  return context;
}

export function NotionStatusProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<ConnectionStatus>("connected");
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [lastSyncBriefName, setLastSyncBriefName] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: "",
    visible: false,
  });

  const showSyncSuccess = useCallback((briefName: string) => {
    setLastSyncTime(new Date());
    setLastSyncBriefName(briefName);
    setStatus("connected");
    
    // Show toast
    setToast({ message: briefName, visible: true });
    
    // Hide toast after 3 seconds
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  }, []);

  const checkConnection = useCallback(async () => {
    setStatus("syncing");
    try {
      const response = await fetch("/api/briefs?email=test@test.com&limit=1");
      if (response.ok) {
        setStatus("connected");
      } else {
        setStatus("disconnected");
      }
    } catch {
      setStatus("disconnected");
    }
  }, []);

  // Check connection on mount
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return (
    <NotionStatusContext.Provider
      value={{
        status,
        lastSyncTime,
        lastSyncBriefName,
        setStatus,
        showSyncSuccess,
        checkConnection,
      }}
    >
      {children}
      
      {/* Toast notification */}
      <div
        className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
          toast.visible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-2 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[#1A1F36] text-white shadow-lg border border-[#2a3352]">
          <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <span className="text-sm">
            Brief saved to Notion — <span className="font-medium">{toast.message}</span>
          </span>
        </div>
      </div>
    </NotionStatusContext.Provider>
  );
}
