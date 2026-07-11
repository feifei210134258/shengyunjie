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
        "mx-auto max-w-[1400px] px-4 pb-4 pt-6 sm:px-6 lg:px-8",
        className
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          {backHref && (
            <Link
              href={backHref}
              className="flex h-9 w-9 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface"
              aria-label={backLabel || "返回"}
            >
              <ArrowLeft className="w-[18px] h-[18px]" strokeWidth={1.5} />
            </Link>
          )}
          <div>
            <h1 className="text-[28px] font-bold leading-9 text-ink">{title}</h1>
            {subtitle && (
              <p className="mt-0.5 text-body-sm text-ink-muted">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 sm:mt-1">{actions}</div>
        )}
      </div>
      {extra && <div className="mt-4">{extra}</div>}
    </div>
  );
}
