"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepProgressProps {
  steps: string[];
  current: number;
  variant?: "bar" | "circle";
  className?: string;
}

export function StepProgress({
  steps,
  current,
  variant = "bar",
  className,
}: StepProgressProps) {
  if (variant === "circle") {
    return (
      <div className={cn("flex items-center justify-center gap-2", className)}>
        {steps.map((label, i) => {
          const isCompleted = i < current;
          const isActive = i === current;

          return (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex items-center justify-center rounded-full transition-all duration-300",
                    "w-7 h-7 text-label font-bold",
                    isCompleted && "bg-primary text-white",
                    isActive && "bg-primary text-white ring-4 ring-primary/15",
                    !isCompleted && !isActive && "bg-surface text-ink-faint border border-line"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-semibold whitespace-nowrap",
                    (isActive || isCompleted)
                      ? "text-primary"
                      : "text-ink-faint"
                  )}
                >
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "h-px flex-1 min-w-[32px] max-w-[80px] mb-5 transition-colors duration-500",
                    i < current ? "bg-primary" : "bg-line"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {steps.map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex-1 h-1.5 rounded-full transition-all duration-500",
            i <= current ? "bg-primary" : "bg-line"
          )}
        />
      ))}
    </div>
  );
}
