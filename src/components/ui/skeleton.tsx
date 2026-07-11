import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string;
  height?: string;
}

export function Skeleton({
  width,
  height = "h-4",
  className,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-surface",
        width,
        height,
        className
      )}
      {...props}
    />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "space-y-4 rounded-xl border border-line bg-surface-raised p-6",
        className
      )}
    >
      <Skeleton width="w-48" height="h-6" />
      <Skeleton height="h-4" />
      <Skeleton height="h-4" className="w-3/4" />
      <Skeleton height="h-24" />
    </div>
  );
}

export function SkeletonPage({
  cards = 3,
  className,
}: {
  cards?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-6 p-4 sm:p-6 lg:p-8", className)}>
      <Skeleton width="w-64" height="h-8" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
