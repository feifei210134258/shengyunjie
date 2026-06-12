import React from "react";
import { cn } from "@/lib/utils";
import { GRADE_STYLES } from "@/lib/constants";

const variants = {
  default: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  error: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  outline: "border border-line text-ink-muted",
  neutral: "bg-surface text-ink-muted",
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variants;
  grade?: "A" | "B" | "C" | "D";
}

export function Badge({
  variant = "default",
  grade,
  className,
  children,
  ...props
}: BadgeProps) {
  const style = grade ? GRADE_STYLES[grade] : null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-0.5 text-label font-semibold",
        style ? `${style.bg} ${style.text}` : variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
