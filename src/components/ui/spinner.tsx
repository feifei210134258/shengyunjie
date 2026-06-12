import React from "react";
import { cn } from "@/lib/utils";

const sizes = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-[3px]",
};

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: keyof typeof sizes;
  inverse?: boolean;
}

export function Spinner({
  size = "md",
  inverse = false,
  className,
  ...props
}: SpinnerProps) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full",
        inverse
          ? "border-current border-t-transparent"
          : "border-primary border-t-transparent",
        sizes[size],
        className
      )}
      {...props}
    />
  );
}

export function PageSpinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "min-h-[60vh] bg-bg flex flex-col items-center justify-center gap-4",
        className
      )}
    >
      <Spinner size="lg" />
      <p className="text-body-sm text-ink-muted">加载中...</p>
    </div>
  );
}
