"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Search,
  Clock,
  CheckCircle2,
  FileText,
  AlertCircle,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Brief } from "@/app/api/briefs/route";

const STATUS_CONFIG: Record<string, { color: string; icon: typeof Clock; label: string }> = {
  "New": { color: "bg-blue-100 text-blue-700", icon: Clock, label: "Processing" },
  "In Progress": { color: "bg-yellow-100 text-yellow-700", icon: RefreshCw, label: "In Progress" },
  "Script Ready": { color: "bg-green-100 text-green-700", icon: CheckCircle2, label: "Script Ready" },
  "Error": { color: "bg-red-100 text-red-700", icon: AlertCircle, label: "Error" },
};

function StatusBadge({ status }: { status: string | null }) {
  const config = STATUS_CONFIG[status || "New"] || STATUS_CONFIG["New"];
  const Icon = config.icon;
  
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium", config.color)}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}

function BriefCard({ brief }: { brief: Brief }) {
  const isReady = brief.status === "Script Ready";
  
  return (
    <Card className="border border-[#1A1F36]/10 hover:border-[#F5A623]/50 transition-all">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-[#1A1F36]/5 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-[#1A1F36]" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-[#1A1F36] truncate">{brief.briefTitle}</h3>
                <p className="text-sm text-[#1A1F36]/60">{brief.client}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <StatusBadge status={brief.status} />
              {brief.platform && (
                <span className="px-2 py-0.5 rounded bg-[#1A1F36]/5 text-xs text-[#1A1F36]/70">
                  {brief.platform}
                </span>
              )}
              {brief.duration && (
                <span className="px-2 py-0.5 rounded bg-[#1A1F36]/5 text-xs text-[#1A1F36]/70">
                  {brief.duration}
                </span>
              )}
            </div>
            
            <p className="text-xs text-[#1A1F36]/40 mt-3">
              Submitted {new Date(brief.createdTime).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          
          <div className="shrink-0">
            {isReady ? (
              <Link href={`/results/${brief.id}`}>
                <Button size="sm" className="bg-[#F5A623] hover:bg-[#F5A623]/90 text-[#1A1F36]">
                  View Script
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            ) : (
              <Button size="sm" variant="outline" disabled className="border-[#1A1F36]/20">
                <Clock className="w-4 h-4 mr-1" />
                Pending
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function StatusPage() {
  const searchParams = useSearchParams();
  const initialBriefId = searchParams.get("briefId");
  
  const [email, setEmail] = useState("");
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState("");

  // Auto-fetch if briefId is provided
  useEffect(() => {
    if (initialBriefId) {
      fetchBriefById(initialBriefId);
    }
  }, [initialBriefId]);

  const fetchBriefById = async (briefId: string) => {
    setIsLoading(true);
    setError("");
    setHasSearched(true);

    try {
      const response = await fetch(`/api/briefs?briefId=${encodeURIComponent(briefId)}`);
      const data = await response.json();

      if (data.success) {
        setBriefs(data.briefs);
        // Also set the email if available for future searches
        if (data.briefs[0]?.email) {
          setEmail(data.briefs[0].email);
        }
      } else {
        setError(data.error || "Brief not found");
        setBriefs([]);
      }
    } catch {
      setError("Failed to fetch brief. Please try again.");
      setBriefs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setError("");
    setHasSearched(true);

    try {
      const response = await fetch(`/api/briefs?email=${encodeURIComponent(email.trim())}`);
      const data = await response.json();

      if (data.success) {
        setBriefs(data.briefs);
        if (data.briefs.length === 0) {
          setError("No briefs found for this email address.");
        }
      } else {
        setError(data.error || "Failed to fetch briefs");
        setBriefs([]);
      }
    } catch {
      setError("Failed to fetch briefs. Please try again.");
      setBriefs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    if (email) {
      handleSearch({ preventDefault: () => {} } as React.FormEvent);
    } else if (initialBriefId) {
      fetchBriefById(initialBriefId);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-3xl font-bold text-[#1A1F36] tracking-tight">
            Brief Status
          </h1>
          <p className="text-[#1A1F36]/60 mt-3">
            Track your submitted briefs and access generated scripts
          </p>
        </header>

        {/* Search Form */}
        <Card className="mb-8 border-0 shadow-lg">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1A1F36]/40" />
                <Input
                  type="email"
                  placeholder="Enter your email to find your briefs"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 bg-background"
                />
              </div>
              <Button 
                type="submit" 
                disabled={isLoading || !email.trim()}
                className="bg-[#1A1F36] hover:bg-[#1A1F36]/90 text-white"
              >
                {isLoading ? <Spinner className="mr-2" /> : null}
                Search
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {hasSearched && (
          <div className="space-y-4">
            {/* Header with refresh */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1A1F36]">
                {briefs.length > 0 ? `${briefs.length} Brief${briefs.length > 1 ? "s" : ""} Found` : "Results"}
              </h2>
              {briefs.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="text-[#1A1F36]/60 hover:text-[#1A1F36]"
                >
                  <RefreshCw className={cn("w-4 h-4 mr-1", isLoading && "animate-spin")} />
                  Refresh
                </Button>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 text-red-700">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Loading State */}
            {isLoading && briefs.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <Spinner className="w-8 h-8 text-[#F5A623]" />
              </div>
            )}

            {/* Brief Cards */}
            {briefs.length > 0 && (
              <div className="space-y-4">
                {briefs.map((brief) => (
                  <BriefCard key={brief.id} brief={brief} />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && briefs.length === 0 && hasSearched && (
              <Card className="border-dashed border-2 border-[#1A1F36]/10">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#1A1F36]/5 flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-[#1A1F36]/30" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#1A1F36] mb-2">No briefs found</h3>
                  <p className="text-[#1A1F36]/60 mb-6">
                    We couldn&apos;t find any briefs associated with this email address.
                  </p>
                  <Link href="/">
                    <Button className="bg-[#F5A623] hover:bg-[#F5A623]/90 text-[#1A1F36]">
                      Create Your First Brief
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Initial State - No Search Yet */}
        {!hasSearched && !initialBriefId && (
          <Card className="border-dashed border-2 border-[#1A1F36]/10">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-[#F5A623]/10 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-[#F5A623]" />
              </div>
              <h3 className="text-lg font-semibold text-[#1A1F36] mb-2">Find Your Briefs</h3>
              <p className="text-[#1A1F36]/60">
                Enter the email address you used when submitting your brief to see its status.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
