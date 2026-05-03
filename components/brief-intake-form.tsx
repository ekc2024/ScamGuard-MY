"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, Lightbulb, Trophy, Briefcase, Clock, Sparkles, ShoppingBag, Heart, Users, Youtube, Smartphone } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNotionStatus } from "./notion-status-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const PLATFORMS = [
  "TikTok",
  "TikTok Shop",
  "Instagram Reels",
  "YouTube",
  "LinkedIn",
  "Facebook",
  "Shopee",
  "Website",
];

const DURATIONS = ["15s", "30s", "60s", "3min", "5min", "10min"];

const TONES = [
  "Inspirational",
  "Funny",
  "Dramatic",
  "Educational",
  "Edgy",
  "Heartfelt",
  "Luxurious",
  "Raw/Authentic",
];

const COMPETITIONS = [
  { 
    id: "karyawan-2026", 
    name: "KaryaWAN 2026", 
    deadline: "2026-05-30",
    tracks: ["Visions", "Impact"]
  },
  { 
    id: "vercel-zero-to-agent", 
    name: "Vercel Zero to Agent", 
    deadline: "2026-06-15",
    tracks: ["Solo", "Team"]
  },
  { 
    id: "other", 
    name: "Other", 
    deadline: null,
    tracks: []
  },
];

type BriefMode = "commercial" | "competition";

interface BriefTemplate {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  duration: string;
  tone: string;
  platform: string;
  briefTitle: string;
  brand: string;
  targetAudience: string;
  keyMessage: string;
  isCompetition?: boolean;
  competition?: string;
  track?: string;
}

const BRIEF_TEMPLATES: BriefTemplate[] = [
  {
    id: "karyawan-impact",
    title: "KaryaWAN Impact",
    description: "AI solving a real Malaysian problem",
    icon: Sparkles,
    duration: "45s",
    tone: "Dramatic",
    platform: "YouTube",
    briefTitle: "AI Impact Story - Malaysia",
    brand: "",
    targetAudience: "Malaysian tech community, AI enthusiasts, competition judges evaluating real-world AI applications",
    keyMessage: "Showcase how AI solves a genuine Malaysian problem with measurable impact and innovation",
    isCompetition: true,
    competition: "karyawan-2026",
    track: "Impact",
  },
  {
    id: "product-demo",
    title: "Product Demo",
    description: "E-commerce product walkthrough",
    icon: ShoppingBag,
    duration: "30s",
    tone: "Inspirational",
    platform: "TikTok Shop",
    briefTitle: "Product Showcase Video",
    brand: "",
    targetAudience: "Online shoppers aged 18-35 who discover products through short-form video content",
    keyMessage: "See the product in action and understand why it solves your problem better than alternatives",
  },
  {
    id: "brand-story",
    title: "Brand Story",
    description: "Founder/brand origin story",
    icon: Heart,
    duration: "60s",
    tone: "Heartfelt",
    platform: "Instagram Reels",
    briefTitle: "Our Story - Brand Origin",
    brand: "",
    targetAudience: "Consumers who value authenticity and connection with the brands they support",
    keyMessage: "Connect emotionally with our journey and understand the passion behind what we create",
  },
  {
    id: "social-proof",
    title: "Social Proof",
    description: "Customer testimonial, UGC style",
    icon: Users,
    duration: "30s",
    tone: "Raw/Authentic",
    platform: "TikTok",
    briefTitle: "Real Customer Review",
    brand: "",
    targetAudience: "Skeptical buyers who trust peer reviews over polished marketing",
    keyMessage: "Hear from a real customer about their genuine experience with our product",
  },
];

interface CompetitionData {
  competition: string;
  track: string;
  competitionTitle: string;
  customDeadline: string;
}

// Example briefs organized by platform and tone combinations
const EXAMPLE_BRIEFS: Record<string, Record<string, {
  briefTitle: string;
  brand: string;
  duration: string;
  purpose: string;
  targetAudience: string;
  keyMessage: string;
  videoMode: string;
}>> = {
  TikTok: {
    Funny: {
      briefTitle: "Snack Attack Challenge",
      brand: "CrunchyBites",
      duration: "30s",
      purpose: "Product Ad",
      targetAudience: "Gen Z snack lovers aged 16-24, always online, love relatable humor and food content, follow trending sounds",
      keyMessage: "After watching, viewers should laugh and immediately crave CrunchyBites - then share with friends who get it",
      videoMode: "Human Presenter",
    },
    Inspirational: {
      briefTitle: "Morning Routine Glow-Up",
      brand: "GlowSkin Co",
      duration: "60s",
      purpose: "Brand Storytelling",
      targetAudience: "Women 20-30 focused on self-care, wellness routines, and aspirational lifestyle content",
      keyMessage: "Feel empowered to start their day right - small rituals lead to big transformations",
      videoMode: "Human Presenter",
    },
    default: {
      briefTitle: "New Drop Alert",
      brand: "StreetStyle",
      duration: "15s",
      purpose: "Product Ad",
      targetAudience: "Fashion-forward Gen Z, trend-setters who discover brands on TikTok first",
      keyMessage: "This drop is limited - act fast or miss out on the next iconic piece",
      videoMode: "Mixed",
    },
  },
  "Instagram Reels": {
    Luxurious: {
      briefTitle: "Summer Collection Reveal",
      brand: "Maison Élégance",
      duration: "30s",
      purpose: "Brand Storytelling",
      targetAudience: "Affluent women 28-45, appreciate craftsmanship, follow luxury lifestyle accounts",
      keyMessage: "Experience effortless elegance - each piece tells a story of timeless sophistication",
      videoMode: "Mixed",
    },
    "Raw/Authentic": {
      briefTitle: "Behind the Grind",
      brand: "BrewCraft Coffee",
      duration: "60s",
      purpose: "Brand Storytelling",
      targetAudience: "Coffee enthusiasts 25-40 who care about sourcing, craft, and the story behind their cup",
      keyMessage: "Every cup has a journey - from farm to your hands, this is real coffee culture",
      videoMode: "Human Presenter",
    },
    default: {
      briefTitle: "Weekend Vibes Edit",
      brand: "LifeStyle Brand",
      duration: "30s",
      purpose: "Awareness",
      targetAudience: "Millennials seeking aesthetic lifestyle content and curated experiences",
      keyMessage: "Elevate your everyday moments into something worth sharing",
      videoMode: "Mixed",
    },
  },
  YouTube: {
    Educational: {
      briefTitle: "Master Your Finances in 10 Minutes",
      brand: "WealthWise Academy",
      duration: "10min",
      purpose: "Education",
      targetAudience: "Young professionals 25-35 looking to build wealth, save smarter, and invest confidently",
      keyMessage: "Feel confident and equipped with actionable steps to take control of their financial future today",
      videoMode: "Human Presenter",
    },
    Dramatic: {
      briefTitle: "The Untold Story of Innovation",
      brand: "TechForward",
      duration: "5min",
      purpose: "Brand Storytelling",
      targetAudience: "Tech enthusiasts and early adopters who love documentary-style content about industry pioneers",
      keyMessage: "Be inspired by the relentless pursuit of innovation - the future is built by those who dare",
      videoMode: "Faceless AI",
    },
    default: {
      briefTitle: "Complete Product Deep Dive",
      brand: "ReviewPro",
      duration: "10min",
      purpose: "Product Ad",
      targetAudience: "Informed buyers who research thoroughly before purchasing, value honest reviews",
      keyMessage: "Make a confident buying decision with all the information you need",
      videoMode: "Human Presenter",
    },
  },
  LinkedIn: {
    Educational: {
      briefTitle: "Future of Remote Work",
      brand: "WorkFlow Solutions",
      duration: "3min",
      purpose: "B2B Sales Pitch",
      targetAudience: "HR leaders, CTOs, and operations managers at companies with 100+ employees evaluating hybrid solutions",
      keyMessage: "Position their company for the future of work - productivity and culture can thrive together",
      videoMode: "Human Presenter",
    },
    Inspirational: {
      briefTitle: "Leadership Lessons from the Field",
      brand: "Executive Coaching Co",
      duration: "5min",
      purpose: "Education",
      targetAudience: "C-suite executives and aspiring leaders seeking growth mindset content",
      keyMessage: "Great leaders are made, not born - take the first step toward transformational leadership",
      videoMode: "Human Presenter",
    },
    default: {
      briefTitle: "Industry Insights Q4",
      brand: "ConsultPro",
      duration: "3min",
      purpose: "B2B Sales Pitch",
      targetAudience: "Decision-makers in enterprise companies looking for competitive advantages",
      keyMessage: "Stay ahead of industry trends - knowledge is your competitive edge",
      videoMode: "Faceless AI",
    },
  },
  default: {
    Funny: {
      briefTitle: "Life Hack Gone Wrong",
      brand: "QuickFix Products",
      duration: "30s",
      purpose: "Entertainment",
      targetAudience: "Anyone who loves relatable fail content and unexpected solutions",
      keyMessage: "Laugh along and remember QuickFix when the hack actually needs to work",
      videoMode: "Human Presenter",
    },
    Heartfelt: {
      briefTitle: "Thank You, Mom",
      brand: "FamilyFirst Insurance",
      duration: "60s",
      purpose: "Awareness",
      targetAudience: "Adults 30-50 who value family, appreciate emotional storytelling, and think about protecting loved ones",
      keyMessage: "Feel moved to express gratitude and consider how they protect what matters most",
      videoMode: "Mixed",
    },
    default: {
      briefTitle: "Brand Launch Teaser",
      brand: "NewCo",
      duration: "30s",
      purpose: "Awareness",
      targetAudience: "Early adopters curious about new brands and products entering the market",
      keyMessage: "Something exciting is coming - be the first to know and join the journey",
      videoMode: "Mixed",
    },
  },
};

interface FormData {
  briefTitle: string;
  brand: string;
  contactName: string;
  email: string;
  whatsapp: string;
  platform: string;
  duration: string;
  budget: string;
  targetAudience: string;
  keyMessage: string;
  tone: string;
  referenceUrl: string;
  deadline: string;
  sourceChannel: string;
}

function CountdownTimer({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useState(() => {
    const updateCountdown = () => {
      const deadlineDate = new Date(deadline);
      const now = new Date();
      const diff = deadlineDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("Deadline passed");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  });

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F5A623]/10 border border-[#F5A623]/30">
      <Clock className="w-4 h-4 text-[#F5A623]" />
      <span className="text-sm font-medium text-[#1A1F36]">
        {timeLeft} remaining
      </span>
    </div>
  );
}

function getPlatformIcon(platform: string) {
  switch (platform) {
    case "YouTube":
      return Youtube;
    case "TikTok":
    case "TikTok Shop":
    case "Instagram Reels":
      return Smartphone;
    default:
      return Smartphone;
  }
}

function TemplateSelector({ 
  onSelect 
}: { 
  onSelect: (template: BriefTemplate) => void;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#1A1F36]">Start from a template</h3>
        <span className="text-xs text-muted-foreground">Click to pre-fill</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {BRIEF_TEMPLATES.map((template) => {
          const Icon = template.icon;
          const PlatformIcon = getPlatformIcon(template.platform);
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template)}
              className={cn(
                "group relative p-4 rounded-xl border-2 text-left transition-all",
                "bg-white hover:border-[#F5A623]/50 hover:shadow-md",
                "border-[#1A1F36]/10 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#1A1F36]/5 flex items-center justify-center group-hover:bg-[#F5A623]/10 transition-colors">
                  <Icon className="w-5 h-5 text-[#1A1F36] group-hover:text-[#F5A623] transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-[#1A1F36] text-sm truncate">
                      {template.title}
                    </h4>
                    {template.isCompetition && (
                      <Trophy className="w-3.5 h-3.5 text-[#F5A623] flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-[#1A1F36]/60 mb-2 line-clamp-1">
                    {template.description}
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1A1F36]/5 text-[10px] font-medium text-[#1A1F36]">
                      {template.duration}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F5A623]/10 text-[10px] font-medium text-[#1A1F36]">
                      {template.tone}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1A1F36]/5 text-[10px] font-medium text-[#1A1F36]">
                      <PlatformIcon className="w-2.5 h-2.5" />
                      {template.platform}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ModeToggle({ 
  mode, 
  onModeChange 
}: { 
  mode: BriefMode; 
  onModeChange: (mode: BriefMode) => void;
}) {
  return (
    <div className="flex items-center p-1 rounded-xl bg-[#1A1F36]/5 mb-6">
      <button
        type="button"
        onClick={() => onModeChange("commercial")}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all",
          mode === "commercial"
            ? "bg-white text-[#1A1F36] shadow-sm"
            : "text-[#1A1F36]/60 hover:text-[#1A1F36]"
        )}
      >
        <Briefcase className="w-4 h-4" />
        Commercial Brief
      </button>
      <button
        type="button"
        onClick={() => onModeChange("competition")}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all",
          mode === "competition"
            ? "bg-white text-[#1A1F36] shadow-sm"
            : "text-[#1A1F36]/60 hover:text-[#1A1F36]"
        )}
      >
        <Trophy className="w-4 h-4" />
        Competition Brief
      </button>
    </div>
  );
}

function ChipSelect({
  options,
  value,
  onChange,
  label,
  required,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-3">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all",
              "border-2 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50",
              value === option
                ? "bg-[#1A1F36] text-white border-[#1A1F36]"
                : "bg-white text-[#1A1F36] border-[#1A1F36]/20 hover:border-[#1A1F36]/50"
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function getExampleBrief(platform: string, tone: string) {
  const platformExamples = EXAMPLE_BRIEFS[platform] || EXAMPLE_BRIEFS.default;
  const example = platformExamples[tone] || platformExamples.default;
  return { ...example, platform, tone };
}

function ExampleBriefModal({ platform, tone }: { platform: string; tone: string }) {
  const example = getExampleBrief(platform, tone);
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#F5A623] hover:text-[#F5A623]/80 transition-colors"
        >
          <Lightbulb className="w-4 h-4" />
          See example
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#1A1F36]">
            <Lightbulb className="w-5 h-5 text-[#F5A623]" />
            Ideal Brief Example
          </DialogTitle>
        </DialogHeader>
        <div className="rounded-xl bg-[#1A1F36]/5 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-[#1A1F36] text-white text-xs font-medium">
              {example.platform}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#F5A623]/20 text-[#1A1F36] text-xs font-medium">
              {example.tone}
            </span>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-xs text-[#1A1F36]/50 uppercase tracking-wide mb-1">Brief Title</p>
              <p className="font-semibold text-[#1A1F36]">{example.briefTitle}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-[#1A1F36]/50 uppercase tracking-wide mb-1">Brand</p>
                <p className="text-sm text-[#1A1F36]">{example.brand}</p>
              </div>
              <div>
                <p className="text-xs text-[#1A1F36]/50 uppercase tracking-wide mb-1">Duration</p>
                <p className="text-sm text-[#1A1F36]">{example.duration}</p>
              </div>
              <div>
                <p className="text-xs text-[#1A1F36]/50 uppercase tracking-wide mb-1">Purpose</p>
                <p className="text-sm text-[#1A1F36]">{example.purpose}</p>
              </div>
              <div>
                <p className="text-xs text-[#1A1F36]/50 uppercase tracking-wide mb-1">Video Mode</p>
                <p className="text-sm text-[#1A1F36]">{example.videoMode}</p>
              </div>
            </div>
            
            <div>
              <p className="text-xs text-[#1A1F36]/50 uppercase tracking-wide mb-1">Target Audience</p>
              <p className="text-sm text-[#1A1F36] leading-relaxed">{example.targetAudience}</p>
            </div>
            
            <div>
              <p className="text-xs text-[#1A1F36]/50 uppercase tracking-wide mb-1">Key Message</p>
              <p className="text-sm text-[#1A1F36] leading-relaxed italic">&quot;{example.keyMessage}&quot;</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-[#1A1F36]/50 text-center">
          This example is tailored for {example.platform} with a {example.tone.toLowerCase()} tone
        </p>
      </DialogContent>
    </Dialog>
  );
}

function ProgressBar({ currentStep }: { currentStep: number }) {
  const steps = [
    { number: 1, label: "Brief Details" },
    { number: 2, label: "Audience & Message" },
    { number: 3, label: "Additional Details" },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                  currentStep >= step.number
                    ? "bg-[#1A1F36] text-white"
                    : "bg-[#1A1F36]/10 text-[#1A1F36]/50"
                )}
              >
                {currentStep > step.number ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  step.number
                )}
              </div>
              <span
                className={cn(
                  "text-xs mt-2 font-medium",
                  currentStep >= step.number
                    ? "text-[#1A1F36]"
                    : "text-[#1A1F36]/50"
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-1 mx-3 rounded-full transition-all",
                  currentStep > step.number ? "bg-[#F5A623]" : "bg-[#1A1F36]/10"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function BriefIntakeForm() {
  const router = useRouter();
  const { showSyncSuccess, setStatus } = useNotionStatus();
  const [briefMode, setBriefMode] = useState<BriefMode>("commercial");
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submittedBriefId, setSubmittedBriefId] = useState<string | null>(null);

  const [competitionData, setCompetitionData] = useState<CompetitionData>({
    competition: "",
    track: "",
    competitionTitle: "",
    customDeadline: "",
  });

  const selectedCompetition = COMPETITIONS.find(c => c.id === competitionData.competition);
  const competitionDeadline = selectedCompetition?.deadline || competitionData.customDeadline;

  const updateCompetitionField = <K extends keyof CompetitionData>(field: K, value: CompetitionData[K]) => {
    setCompetitionData((prev) => ({ ...prev, [field]: value }));
  };

  const [formData, setFormData] = useState<FormData>({
    briefTitle: "",
    brand: "",
    contactName: "",
    email: "",
    whatsapp: "",
    platform: "",
    duration: "",
    budget: "",
    targetAudience: "",
    keyMessage: "",
    tone: "",
    referenceUrl: "",
    deadline: "",
    sourceChannel: "",
  });

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleTemplateSelect = (template: BriefTemplate) => {
    // Pre-fill form fields from template
    setFormData((prev) => ({
      ...prev,
      briefTitle: template.briefTitle,
      platform: template.platform,
      duration: template.duration,
      tone: template.tone,
      targetAudience: template.targetAudience,
      keyMessage: template.keyMessage,
    }));

    // If it's a competition template, switch to competition mode and pre-fill competition data
    if (template.isCompetition && template.competition) {
      setBriefMode("competition");
      setCompetitionData((prev) => ({
        ...prev,
        competition: template.competition || "",
        track: template.track || "",
      }));
    }

    // Clear any validation errors
    setErrors({});
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (step === 1) {
      if (!formData.briefTitle.trim()) {
        newErrors.briefTitle = "Brief title is required";
      }
      if (!formData.brand.trim()) {
        newErrors.brand = "Brand is required";
      }
      if (!formData.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Please enter a valid email";
      }
      if (!formData.platform) {
        newErrors.platform = "Platform is required";
      }
      if (!formData.duration) {
        newErrors.duration = "Duration is required";
      }
    }

    if (step === 2) {
      if (!formData.targetAudience.trim()) {
        newErrors.targetAudience = "Target audience is required";
      }
      if (!formData.keyMessage.trim()) {
        newErrors.keyMessage = "Key message is required";
      }
      if (!formData.tone) {
        newErrors.tone = "Tone is required";
      }
    }

    if (step === 3) {
      // Optional fields in step 3, no required validation
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");
    setStatus("syncing");

    try {
      const response = await fetch("/api/submit-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          briefTitle: formData.briefTitle,
          client: formData.brand,
          contactName: formData.contactName,
          email: formData.email,
          whatsapp: formData.whatsapp,
          platform: formData.platform,
          duration: formData.duration,
          budget: formData.budget,
          targetAudience: formData.targetAudience,
          keyMessage: formData.keyMessage,
          tone: formData.tone,
          referenceUrl: formData.referenceUrl,
          deadline: formData.deadline,
          sourceChannel: formData.sourceChannel,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitStatus("success");
        setSubmittedBriefId(result.pageId);
        // Show toast notification
        showSyncSuccess(formData.brand || formData.briefTitle);
      } else {
        setSubmitStatus("error");
        setErrorMessage(result.error || "Something went wrong");
      }
    } catch {
      setSubmitStatus("error");
      setErrorMessage("Failed to submit brief. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      briefTitle: "",
      brand: "",
      contactName: "",
      email: "",
      whatsapp: "",
      platform: "",
      duration: "",
      budget: "",
      targetAudience: "",
      keyMessage: "",
      tone: "",
      referenceUrl: "",
      deadline: "",
      sourceChannel: "",
    });
    setCompetitionData({
      competition: "",
      track: "",
      competitionTitle: "",
      customDeadline: "",
    });
    setBriefMode("commercial");
    setCurrentStep(1);
    setSubmitStatus("idle");
    setErrors({});
  };

  if (submitStatus === "success") {
    return (
      <Card className="w-full max-w-2xl mx-auto border-0 shadow-lg">
        <CardContent className="pt-16 pb-16">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="rounded-full bg-[#F5A623]/10 p-4">
              <CheckCircle2 className="h-12 w-12 text-[#F5A623]" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-[#1A1F36]">Brief Received</h2>
              <p className="text-[#1A1F36]/60 text-lg">
                Script ready in 2-5 minutes
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <Button
                onClick={() => router.push(`/status${submittedBriefId ? `?briefId=${submittedBriefId}` : ''}`)}
                className="bg-[#F5A623] hover:bg-[#F5A623]/90 text-[#1A1F36] font-semibold"
              >
                View Status
              </Button>
              <Button
                onClick={resetForm}
                variant="outline"
                className="border-[#1A1F36]/20 text-[#1A1F36]"
              >
                Submit Another Brief
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto border-0 shadow-lg">
      <CardContent className="pt-8 pb-8">
        {currentStep === 1 && (
          <TemplateSelector onSelect={handleTemplateSelect} />
        )}
        <ModeToggle mode={briefMode} onModeChange={setBriefMode} />
        <ProgressBar currentStep={currentStep} />

        {/* Competition Fields - shown when Competition Brief is selected */}
        {briefMode === "competition" && currentStep === 1 && (
          <div className="mb-6 p-5 rounded-xl bg-gradient-to-br from-[#F5A623]/5 to-[#F5A623]/10 border border-[#F5A623]/20 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-[#F5A623]" />
              <h3 className="font-semibold text-[#1A1F36]">Competition Details</h3>
            </div>

            <div className="space-y-2">
              <Label>Competition</Label>
              <Select
                value={competitionData.competition}
                onValueChange={(v) => {
                  updateCompetitionField("competition", v);
                  updateCompetitionField("track", "");
                }}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select competition" />
                </SelectTrigger>
                <SelectContent>
                  {COMPETITIONS.map((comp) => (
                    <SelectItem key={comp.id} value={comp.id}>
                      {comp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCompetition && selectedCompetition.tracks.length > 0 && (
              <div className="space-y-2">
                <Label>Track</Label>
                <div className="flex gap-2">
                  {selectedCompetition.tracks.map((track) => (
                    <button
                      key={track}
                      type="button"
                      onClick={() => updateCompetitionField("track", track)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all border-2",
                        competitionData.track === track
                          ? "bg-[#F5A623] text-white border-[#F5A623]"
                          : "bg-white text-[#1A1F36] border-[#1A1F36]/20 hover:border-[#F5A623]/50"
                      )}
                    >
                      {track}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {competitionData.competition === "other" && (
              <div className="space-y-2">
                <Label htmlFor="customDeadline">Submission Deadline</Label>
                <Input
                  id="customDeadline"
                  type="date"
                  value={competitionData.customDeadline}
                  onChange={(e) => updateCompetitionField("customDeadline", e.target.value)}
                  className="bg-white"
                />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="competitionTitle">
                  Competition Title <span className="text-destructive">*</span>
                </Label>
                <span className={cn(
                  "text-xs",
                  competitionData.competitionTitle.length > 60 
                    ? "text-destructive" 
                    : "text-muted-foreground"
                )}>
                  {competitionData.competitionTitle.length}/60
                </span>
              </div>
              <Input
                id="competitionTitle"
                value={competitionData.competitionTitle}
                onChange={(e) => updateCompetitionField("competitionTitle", e.target.value.slice(0, 60))}
                placeholder="e.g., AI Melindungi Keluarga Malaysia"
                className="bg-white"
              />
              <p className="text-xs text-muted-foreground">
                This title will appear on your competition submission
              </p>
            </div>

            {competitionDeadline && (
              <div className="pt-2">
                <CountdownTimer deadline={competitionDeadline} />
              </div>
            )}
          </div>
        )}

        {/* Step 1: Brief Details */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="briefTitle">
                  Brief Title <span className="text-destructive">*</span>
                </Label>
                <span className="text-xs text-muted-foreground">
                  {formData.briefTitle.length}/80
                </span>
              </div>
              <Input
                id="briefTitle"
                value={formData.briefTitle}
                onChange={(e) =>
                  updateField("briefTitle", e.target.value.slice(0, 80))
                }
                placeholder="e.g., Product Launch Campaign"
                className={cn("bg-background", errors.briefTitle && "border-destructive")}
              />
              {errors.briefTitle && (
                <p className="text-xs text-destructive">{errors.briefTitle}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">
                Brand <span className="text-destructive">*</span>
              </Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => updateField("brand", e.target.value)}
                placeholder="Company or brand name"
                className={cn("bg-background", errors.brand && "border-destructive")}
              />
              {errors.brand && (
                <p className="text-xs text-destructive">{errors.brand}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Name</Label>
              <Input
                id="contactName"
                value={formData.contactName}
                onChange={(e) => updateField("contactName", e.target.value)}
                placeholder="Your name"
                className="bg-background"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="your@email.com"
                  className={cn("bg-background", errors.email && "border-destructive")}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => updateField("whatsapp", e.target.value)}
                  placeholder="+1 234 567 8900"
                  className="bg-background"
                />
              </div>
            </div>

            <div className="space-y-2">
              <ChipSelect
                label="Platform"
                options={PLATFORMS}
                value={formData.platform}
                onChange={(v) => updateField("platform", v)}
                required
              />
              {errors.platform && (
                <p className="text-xs text-destructive">{errors.platform}</p>
              )}
            </div>

            <div className="space-y-2">
              <ChipSelect
                label="Duration"
                options={DURATIONS}
                value={formData.duration}
                onChange={(v) => updateField("duration", v)}
                required
              />
              {errors.duration && (
                <p className="text-xs text-destructive">{errors.duration}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Budget</Label>
              <Input
                id="budget"
                value={formData.budget}
                onChange={(e) => updateField("budget", e.target.value)}
                placeholder="e.g., $5,000 - $10,000"
                className="bg-background"
              />
            </div>
          </div>
        )}

        {/* Step 2: Audience & Message */}
        {currentStep === 2 && (
          <div className="space-y-6">
            {/* See Example link - shows when platform is selected */}
            {formData.platform && (
              <div className="flex justify-end -mb-2">
                <ExampleBriefModal 
                  platform={formData.platform} 
                  tone={formData.tone || "default"} 
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="targetAudience">
                Target Audience <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="targetAudience"
                value={formData.targetAudience}
                onChange={(e) => updateField("targetAudience", e.target.value)}
                placeholder="e.g., Women aged 25-35, interested in fitness and wellness, active on social media, looking for convenient healthy meal options"
                rows={3}
                className={cn(
                  "bg-background resize-none",
                  errors.targetAudience && "border-destructive"
                )}
              />
              {errors.targetAudience && (
                <p className="text-xs text-destructive">{errors.targetAudience}</p>
              )}
            </div>

            <div className="space-y-2">
              <ChipSelect
                label="Tone"
                options={TONES}
                value={formData.tone}
                onChange={(v) => updateField("tone", v)}
                required
              />
              {errors.tone && (
                <p className="text-xs text-destructive">{errors.tone}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="keyMessage">
                  Key Message <span className="text-destructive">*</span>
                </Label>
                <span className="text-xs text-muted-foreground">
                  {formData.keyMessage.length}/200
                </span>
              </div>
              <Textarea
                id="keyMessage"
                value={formData.keyMessage}
                onChange={(e) =>
                  updateField("keyMessage", e.target.value.slice(0, 200))
                }
                placeholder="After watching, my audience should think/feel/do___"
                rows={3}
                className={cn(
                  "bg-background resize-none",
                  errors.keyMessage && "border-destructive"
                )}
              />
              {errors.keyMessage && (
                <p className="text-xs text-destructive">{errors.keyMessage}</p>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Additional Details */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              These fields are optional but help us deliver better results.
            </p>

            <div className="space-y-2">
              <Label htmlFor="referenceUrl">Reference URL</Label>
              <Input
                id="referenceUrl"
                type="url"
                value={formData.referenceUrl}
                onChange={(e) => updateField("referenceUrl", e.target.value)}
                placeholder="https://example.com/reference-video"
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">
                Link to a video style you like
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => updateField("deadline", e.target.value)}
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sourceChannel">How did you hear about us?</Label>
              <Input
                id="sourceChannel"
                value={formData.sourceChannel}
                onChange={(e) => updateField("sourceChannel", e.target.value)}
                placeholder="e.g., Google, LinkedIn, Referral"
                className="bg-background"
              />
            </div>

            {/* Summary */}
            <div className="rounded-xl bg-[#1A1F36]/5 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[#1A1F36]">Summary</h3>
                {briefMode === "competition" && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F5A623]/20 text-[#1A1F36] text-xs font-medium">
                    <Trophy className="w-3 h-3" />
                    Competition
                  </span>
                )}
              </div>
              
              {briefMode === "competition" && competitionData.competition && (
                <div className="pb-3 mb-3 border-b border-[#1A1F36]/10">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-[#1A1F36]/50">Competition</span>
                      <p className="font-medium text-[#1A1F36]">
                        {COMPETITIONS.find(c => c.id === competitionData.competition)?.name}
                      </p>
                    </div>
                    {competitionData.track && (
                      <div>
                        <span className="text-[#1A1F36]/50">Track</span>
                        <p className="font-medium text-[#1A1F36]">{competitionData.track}</p>
                      </div>
                    )}
                    {competitionData.competitionTitle && (
                      <div className="col-span-2">
                        <span className="text-[#1A1F36]/50">Competition Title</span>
                        <p className="font-medium text-[#1A1F36]">{competitionData.competitionTitle}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[#1A1F36]/50">Brief Title</span>
                  <p className="font-medium text-[#1A1F36]">{formData.briefTitle}</p>
                </div>
                <div>
                  <span className="text-[#1A1F36]/50">Brand</span>
                  <p className="font-medium text-[#1A1F36]">{formData.brand}</p>
                </div>
                <div>
                  <span className="text-[#1A1F36]/50">Platform</span>
                  <p className="font-medium text-[#1A1F36]">{formData.platform}</p>
                </div>
                <div>
                  <span className="text-[#1A1F36]/50">Duration</span>
                  <p className="font-medium text-[#1A1F36]">{formData.duration}</p>
                </div>
                <div>
                  <span className="text-[#1A1F36]/50">Tone</span>
                  <p className="font-medium text-[#1A1F36]">{formData.tone}</p>
                </div>
                {formData.budget && (
                  <div>
                    <span className="text-[#1A1F36]/50">Budget</span>
                    <p className="font-medium text-[#1A1F36]">{formData.budget}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <span className="text-[#1A1F36]/50">Target Audience</span>
                  <p className="font-medium text-[#1A1F36]">{formData.targetAudience}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-[#1A1F36]/50">Key Message</span>
                  <p className="font-medium text-[#1A1F36]">{formData.keyMessage}</p>
                </div>
                {formData.deadline && (
                  <div>
                    <span className="text-[#1A1F36]/50">Deadline</span>
                    <p className="font-medium text-[#1A1F36]">{formData.deadline}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {submitStatus === "error" && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive mt-6">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p className="text-sm">{errorMessage}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#1A1F36]/10">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              className="border-[#1A1F36]/20 text-[#1A1F36]"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          ) : (
            <div />
          )}

          {currentStep < 3 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="bg-[#1A1F36] hover:bg-[#1A1F36]/90 text-white"
            >
              Continue
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-[#F5A623] hover:bg-[#F5A623]/90 text-[#1A1F36] font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2" />
                  Submitting...
                </>
              ) : briefMode === "competition" ? (
                "Generate Competition Brief + Survey Copy"
              ) : (
                "Submit Brief"
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
