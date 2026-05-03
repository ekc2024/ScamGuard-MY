"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Search,
  FolderOpen,
  FileText,
  Copy,
  Check,
  Filter,
  X,
  Tag,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ContentItem } from "@/app/api/library/route";

function ContentCard({ 
  item, 
  onClick 
}: { 
  item: ContentItem; 
  onClick: () => void;
}) {
  return (
    <Card 
      className="border border-[#1A1F36]/10 hover:border-[#F5A623]/50 hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#F5A623]/10 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-[#F5A623]" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-[#1A1F36] truncate mb-1">
              {item.title}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {item.category && (
                <span className="px-2 py-0.5 rounded bg-[#1A1F36] text-white text-xs">
                  {item.category}
                </span>
              )}
              {item.type && (
                <span className="px-2 py-0.5 rounded bg-[#1A1F36]/10 text-[#1A1F36]/70 text-xs">
                  {item.type}
                </span>
              )}
            </div>
            {item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {item.tags.slice(0, 3).map((tag) => (
                  <span 
                    key={tag} 
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#F5A623]/10 text-[#1A1F36]/70 text-xs"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
                {item.tags.length > 3 && (
                  <span className="text-xs text-[#1A1F36]/50">
                    +{item.tags.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ContentModal({ 
  item, 
  open, 
  onOpenChange 
}: { 
  item: ContentItem | null; 
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (item?.content) {
      await navigator.clipboard.writeText(item.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-[#1A1F36] pr-8">{item.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-2">
            {item.category && (
              <span className="px-3 py-1 rounded-full bg-[#1A1F36] text-white text-sm font-medium">
                {item.category}
              </span>
            )}
            {item.type && (
              <span className="px-3 py-1 rounded-full bg-[#1A1F36]/10 text-[#1A1F36] text-sm">
                {item.type}
              </span>
            )}
          </div>

          {/* Tags */}
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <span 
                  key={tag} 
                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#F5A623]/10 text-[#1A1F36]/80 text-sm"
                >
                  <Tag className="w-3.5 h-3.5" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Content */}
          {item.content && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#1A1F36]/70">Content</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="text-[#1A1F36]/60 hover:text-[#1A1F36]"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-1 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <div className="bg-[#1A1F36]/5 rounded-xl p-4">
                <pre className="whitespace-pre-wrap font-sans text-[#1A1F36] text-sm leading-relaxed">
                  {item.content}
                </pre>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function LibraryPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [availableFilters, setAvailableFilters] = useState<{ categories: string[]; types: string[] }>({ categories: [], types: [] });
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const fetchLibrary = async () => {
    setIsLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (selectedCategory) params.set("category", selectedCategory);
      if (selectedType) params.set("type", selectedType);

      const response = await fetch(`/api/library?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setItems(data.items);
        if (data.filters) {
          setAvailableFilters(data.filters);
        }
      } else {
        setError(data.error || "Failed to load library");
      }
    } catch {
      setError("Failed to load library. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLibrary();
  }, [selectedCategory, selectedType]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLibrary();
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedType(null);
    setSearchQuery("");
  };

  const hasActiveFilters = selectedCategory || selectedType || searchQuery;

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-3xl font-bold text-[#1A1F36] tracking-tight">
            Content Library
          </h1>
          <p className="text-[#1A1F36]/60 mt-3">
            Browse templates, scripts, and content assets
          </p>
        </header>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1A1F36]/40" />
              <Input
                type="text"
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 bg-white"
              />
            </div>
            <Button 
              type="button"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "border-[#1A1F36]/20",
                showFilters && "bg-[#1A1F36]/5"
              )}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 w-5 h-5 rounded-full bg-[#F5A623] text-[#1A1F36] text-xs flex items-center justify-center">
                  {[selectedCategory, selectedType, searchQuery].filter(Boolean).length}
                </span>
              )}
            </Button>
            <Button 
              type="submit" 
              className="bg-[#1A1F36] hover:bg-[#1A1F36]/90 text-white"
            >
              Search
            </Button>
          </form>

          {/* Filter Pills */}
          {showFilters && (
            <div className="bg-white rounded-xl border border-[#1A1F36]/10 p-4 space-y-4">
              {/* Categories */}
              {availableFilters.categories.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-[#1A1F36]/70 mb-2 block">Category</span>
                  <div className="flex flex-wrap gap-2">
                    {availableFilters.categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                          selectedCategory === cat
                            ? "bg-[#1A1F36] text-white"
                            : "bg-[#1A1F36]/5 text-[#1A1F36] hover:bg-[#1A1F36]/10"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Types */}
              {availableFilters.types.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-[#1A1F36]/70 mb-2 block">Type</span>
                  <div className="flex flex-wrap gap-2">
                    {availableFilters.types.map((type) => (
                      <button
                        key={type}
                        onClick={() => setSelectedType(selectedType === type ? null : type)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                          selectedType === type
                            ? "bg-[#F5A623] text-[#1A1F36]"
                            : "bg-[#F5A623]/10 text-[#1A1F36] hover:bg-[#F5A623]/20"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-[#1A1F36]/60 hover:text-[#1A1F36]"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear all filters
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner className="w-8 h-8 text-[#F5A623]" />
          </div>
        ) : error ? (
          <Card className="border-dashed border-2 border-red-200">
            <CardContent className="p-12 text-center">
              <p className="text-red-600">{error}</p>
              <Button
                onClick={fetchLibrary}
                className="mt-4 bg-[#1A1F36] hover:bg-[#1A1F36]/90 text-white"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : items.length === 0 ? (
          <Card className="border-dashed border-2 border-[#1A1F36]/10">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-[#1A1F36]/5 flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="w-8 h-8 text-[#1A1F36]/30" />
              </div>
              <h3 className="text-lg font-semibold text-[#1A1F36] mb-2">No content found</h3>
              <p className="text-[#1A1F36]/60">
                {hasActiveFilters 
                  ? "Try adjusting your filters or search query."
                  : "Content will appear here once added to the library."}
              </p>
              {hasActiveFilters && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="mt-4 border-[#1A1F36]/20 text-[#1A1F36]"
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <ContentCard 
                key={item.id} 
                item={item} 
                onClick={() => setSelectedItem(item)}
              />
            ))}
          </div>
        )}

        {/* Content Modal */}
        <ContentModal 
          item={selectedItem} 
          open={!!selectedItem} 
          onOpenChange={(open) => !open && setSelectedItem(null)}
        />
      </div>
    </div>
  );
}
