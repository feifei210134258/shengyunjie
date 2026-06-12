"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  wrapperClassName?: string;
}

export function Textarea({
  label,
  error,
  wrapperClassName,
  className,
  id,
  ...props
}: TextareaProps) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={cn("space-y-1.5", wrapperClassName)}>
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-label font-semibold text-ink"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={cn(
          "w-full resize-none rounded-lg border bg-surface-raised p-4 text-body-md text-ink",
          "transition-all duration-200 outline-none",
          "placeholder:text-ink-faint",
          error
            ? "border-danger focus:border-danger focus:ring-2 focus:ring-danger/10"
            : "border-line focus:border-primary focus:ring-2 focus:ring-primary/10",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      />
      {error && <p className="text-body-sm text-danger">{error}</p>}
    </div>
  );
}
