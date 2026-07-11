"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DIMENSION_COLORS, getDimensionShortLabel } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Brain, ArrowRight, AlertTriangle, Target } from "lucide-react";

interface ProfileData {
  dimensions: { name: string; score: number; grade: string }[];
  weaknesses: string[];
}

interface Props {
  profile: ProfileData | null;
  className?: string;
}

export default function ProfileCard({ profile, className }: Props) {
  if (!profile) {
    return (
      <Card
        className={cn("flex min-h-[280px] flex-col justify-between", className)}
      >
        <div>
          <div className="mb-4 flex items-center gap-2.5">
            <Brain className="h-5 w-5 text-primary" strokeWidth={1.5} />
            <h3 className="text-heading-md font-semibold text-ink">能力画像</h3>
          </div>
          <div className="rounded-xl border border-dashed border-line-strong bg-surface px-4 py-5">
            <p className="text-body-sm font-semibold text-ink">
              还没有可用画像
            </p>
            <p className="mt-1 text-body-sm text-ink-muted">
              完成一次三阶段诊断后，这里会展示 5 个产品能力维度、等级和优先补强项。
            </p>
          </div>
        </div>
        <Link href="/diagnosis/scale" className="mt-4">
          <Button
            size="sm"
            variant="secondary"
            icon={<ArrowRight className="h-4 w-4" />}
          >
            开始诊断
          </Button>
        </Link>
      </Card>
    );
  }

  const sortedDimensions = [...profile.dimensions].sort(
    (a, b) => a.score - b.score
  );
  const weakest = sortedDimensions[0];
  const averageScore =
    profile.dimensions.length > 0
      ? Math.round(
          profile.dimensions.reduce((sum, d) => sum + d.score, 0) /
            profile.dimensions.length
        )
      : 0;

  return (
    <Card className={cn("min-h-[320px]", className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Brain className="h-5 w-5 text-primary" strokeWidth={1.5} />
          <h3 className="text-heading-md font-semibold text-ink">能力画像</h3>
        </div>
        <div className="rounded-lg bg-primary-soft px-3 py-1.5 text-right">
          <p className="font-mono text-data-md font-bold text-primary">
            {averageScore}
          </p>
          <p className="text-label font-semibold text-primary">均分</p>
        </div>
      </div>

      {weakest && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-warning-soft bg-warning-soft/45 px-3 py-2.5">
          <Target className="h-4 w-4 shrink-0 text-warning" strokeWidth={1.5} />
          <div className="min-w-0">
            <p className="text-label font-semibold text-warning">优先补强</p>
            <p className="truncate text-body-sm font-semibold text-ink">
              {getDimensionShortLabel(weakest.name) || weakest.name}
              <span className="ml-2 font-mono text-ink-muted">
                {weakest.score}分
              </span>
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2.5">
        {sortedDimensions.map((d) => {
          const isWeak = profile.weaknesses.includes(d.name);
          const color = DIMENSION_COLORS[d.name] || "#4338CA";

          return (
            <div key = {d.name} className="rounded-lg bg-surface px-3 py-2">
              <div className="mb-1.5 flex items-center gap-2.5">
                <span className="min-w-0 flex-1 truncate text-body-sm font-semibold text-ink">
                  {getDimensionShortLabel(d.name) || d.name}
                </span>
                {isWeak && (
                  <AlertTriangle
                    className="h-3.5 w-3.5 shrink-0 text-danger"
                    strokeWidth={1.5}
                  />
                )}
                <span className="w-9 text-right font-mono text-body-sm text-ink-muted">
                  {d.score}
                </span>
                <Badge grade={d.grade as "A" | "B" | "C" | "D"}>
                  {d.grade}
                </Badge>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${d.score}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
