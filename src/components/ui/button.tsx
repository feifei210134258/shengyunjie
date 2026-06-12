"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

const variants = {
  primary:
    "bg-primary !text-white hover:bg-primary-hover active:scale-[0.97] shadow-sm",
  secondary:
    "border border-line-strong text-ink bg-transparent hover:bg-surface active:scale-[0.97]",
  ghost:
    "text-ink-muted bg-transparent hover:bg-surface hover:text-ink active:scale-[0.97]",
  danger:
    "bg-danger !text-white hover:bg-danger/90 active:scale-[0.97]",
  soft:
    "bg-primary-soft text-primary hover:bg-primary-muted active:scale-[0.97]",
};

const sizes = {
  xs: "px-3 py-1.5 text-label",
  sm: "px-4 py-2 text-body-sm",
  md: "px-5 py-2.5 text-body-md",
  lg: "px-7 py-3 text-body-md",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  icon,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200",
        "disabled:opacity-35 disabled:pointer-events-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Spinner size="sm" inverse />
      ) : icon ? (
        <span className="flex items-center">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
