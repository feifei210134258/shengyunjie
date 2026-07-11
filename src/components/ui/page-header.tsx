"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  className?: string;
  extra?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel,
  actions,
  extra,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {backHref && (
            <Link
              href={backHref}
              className="mt-1 flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface"
              aria-label={backLabel || "返回"}
            >
              <ArrowLeft className="w-[18px] h-[18px]" strokeWidth={1.5} />
            </Link>
          )}
          <div>
            <h1 className="text-display-lg font-bold text-ink">{title}</h1>
            {subtitle && (
              <p className="text-body-lg text-ink-muted mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0 mt-1">{actions}</div>
        )}
      </div>
      {extra && <div className="mt-4">{extra}</div>}
    </div>
  );
}
