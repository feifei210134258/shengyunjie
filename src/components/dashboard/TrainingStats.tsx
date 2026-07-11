"use client";

import { Card } from "@/components/ui/card";
import { DIMENSION_COLORS, DIM_LABELS } from "@/lib/constants";
import { BarChart3 } from "lucide-react";

interface TrainingStatsData {
  totalCount: number;
  todayCount: number;
  streak: number;
  dimAverages: Record<string, number>;
}

interface Props {
  stats: TrainingStatsData | null;
}

export default function TrainingStats({ stats }: Props) {
  return (
    <Card size="sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <BarChart3 className="h-4 w-4 text-primary" strokeWidth={1.5} />
          <h3 className="text-heading-sm font-semibold text-ink">维度训练表现</h3>
        </div>
        <p className="text-label font-semibold text-ink-muted">
          {stats ? `${stats.totalCount} 次累计` : "暂无数据"}
        </p>
      </div>

      {!stats ? (
        <div className="rounded-lg border border-dashed border-line-strong bg-surface px-4 py-5">
          <p className="text-body-sm font-semibold text-ink">还没有训练记录</p>
          <p className="mt-1 text-body-sm text-ink-muted">
            完成训练后，这里会显示各能力维度的平均得分。
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {Object.entries(DIM_LABELS).map(([key, label]) => {
            const avg = stats.dimAverages?.[key];
            const pct =
              avg != null ? Math.min(Math.round((avg / 10) * 100), 100) : 0;
            const color = DIMENSION_COLORS[key] || "#4338CA";

            return (
              <div key = {key} className="rounded-lg bg-surface px-3 py-2">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-body-sm font-semibold text-ink">
                    {label}
                  </span>
                  <span className="font-mono text-body-sm text-ink-muted">
                    {avg != null ? avg.toFixed(1) : "-"}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
