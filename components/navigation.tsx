"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FileText, LayoutDashboard, FolderOpen, PenLine } from "lucide-react";

const navItems = [
  { href: "/", label: "New Brief", icon: PenLine },
  { href: "/status", label: "Status", icon: LayoutDashboard },
  { href: "/library", label: "Library", icon: FolderOpen },
];

export function Navigation() {
  const pathname = usePathname();

  // Don't show nav on results pages
  const isResultsPage = pathname.startsWith("/results/");

  return (
    <header className="sticky top-0 z-50 bg-[#1A1F36] border-b border-[#1A1F36]">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#F5A623] flex items-center justify-center">
                <FileText className="w-4 h-4 text-[#1A1F36]" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                ScaleWithEnrich
              </span>
            </div>
          </Link>

          {/* Navigation */}
          {!isResultsPage && (
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-[#F5A623] text-[#1A1F36]"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Back to Status button on results pages */}
          {isResultsPage && (
            <Link
              href="/status"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Status</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
