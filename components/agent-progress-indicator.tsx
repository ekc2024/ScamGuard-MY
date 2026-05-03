"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentStep {
  id: number;
  label: string;
  duration: number; // milliseconds to simulate this step
}

const AGENT_STEPS: AgentStep[] = [
  { id: 1, label: "Reading brief from Notion CRM...", duration: 800 },
  { id: 2, label: "Selecting story framework (Awareness Campaign — PAS)...", duration: 1200 },
  { id: 3, label: "Building 7-shot storyboard...", duration: 1500 },
  { id: 4, label: "Assigning WAN models per shot...", duration: 1000 },
  { id: 5, label: "Generating competition survey copy...", duration: 1100 },
];

interface AgentProgressIndicatorProps {
  isActive: boolean;
  isCompetitionMode?: boolean;
  onComplete?: () => void;
}

export function AgentProgressIndicator({ 
  isActive, 
  isCompetitionMode = false,
  onComplete 
}: AgentProgressIndicatorProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Filter steps based on mode - remove competition step if not in competition mode
  const steps = isCompetitionMode 
    ? AGENT_STEPS 
    : AGENT_STEPS.filter(s => s.id !== 5);

  useEffect(() => {
    if (!isActive) {
      setCurrentStep(0);
      setCompletedSteps([]);
      return;
    }

    let stepIndex = 0;
    
    const runStep = () => {
      if (stepIndex >= steps.length) {
        onComplete?.();
        return;
      }

      const step = steps[stepIndex];
      setCurrentStep(step.id);

      setTimeout(() => {
        setCompletedSteps(prev => [...prev, step.id]);
        stepIndex++;
        runStep();
      }, step.duration);
    };

    // Start first step after a brief delay
    const initialDelay = setTimeout(() => {
      runStep();
    }, 300);

    return () => {
      clearTimeout(initialDelay);
    };
  }, [isActive, steps, onComplete]);

  if (!isActive) return null;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="space-y-3">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id && !isCompleted;
          const isPending = !isCompleted && currentStep < step.id;

          return (
            <div
              key={step.id}
              className={cn(
                "flex items-start gap-3 transition-all duration-300",
                isPending && "opacity-40"
              )}
              style={{
                transitionDelay: `${index * 50}ms`,
              }}
            >
              {/* Status Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {isCompleted ? (
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Check className="w-3 h-3 text-emerald-500" />
                  </div>
                ) : isCurrent ? (
                  <div className="w-5 h-5 rounded-full bg-[#F5A623]/10 flex items-center justify-center">
                    <Loader2 className="w-3 h-3 text-[#F5A623] animate-spin" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-[#1A1F36]/20 flex items-center justify-center">
                    <span className="text-[10px] text-[#1A1F36]/40">—</span>
                  </div>
                )}
              </div>

              {/* Step Label */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm leading-5 transition-colors duration-300",
                    isCompleted && "text-emerald-600",
                    isCurrent && "text-[#1A1F36] font-medium",
                    isPending && "text-[#1A1F36]/40"
                  )}
                >
                  <span className="text-[#1A1F36]/50 mr-1.5">Step {step.id}</span>
                  {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="mt-6 h-1 bg-[#1A1F36]/10 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-[#F5A623] to-emerald-500 transition-all duration-500 ease-out rounded-full"
          style={{ 
            width: `${(completedSteps.length / steps.length) * 100}%` 
          }}
        />
      </div>
    </div>
  );
}
