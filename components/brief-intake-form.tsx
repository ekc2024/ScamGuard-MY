"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, Lightbulb } from "lucide-react";
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
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submittedBriefId, setSubmittedBriefId] = useState<string | null>(null);

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
        <ProgressBar currentStep={currentStep} />

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
              <h3 className="font-semibold text-[#1A1F36]">Summary</h3>
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
