"use client";

import { WeaknessPrediction } from "@/types/bootcamp";
import AbilityRadarChart from "@/components/training/RadarChart";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  prediction: WeaknessPrediction;
}

const severityVariant: Record<string, "error" | "warning" | "success"> = {
  high: "error",
  medium: "warning",
  low: "success",
};

const severityLabel: Record<string, string> = {
  high: "严重",
  medium: "中等",
  low: "轻微",
};

export default function WeaknessReport({ prediction }: Props) {
  const radarData =
    prediction.weak_dimensions?.map((w) => ({
      dimension: w.dimension,
      score: w.severity === "high" ? 3 : w.severity === "medium" ? 5 : 7,
      fullMark: 10,
    })) || [];

  return (
    <div className="space-y-6">
      <h3 className="text-heading-lg font-semibold text-ink">面试弱点预测</h3>

      {radarData.length > 0 && (
        <Card variant="subtle" size="sm">
          <AbilityRadarChart data={radarData} />
        </Card>
      )}

      <div className="divide-y divide-line border-y border-line bg-white">
        {prediction.weak_dimensions?.map((w, idx) => (
          <div key={idx} className="px-4 py-4 sm:px-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="font-semibold text-ink">
                {w.dimension}
              </span>
              <Badge variant={severityVariant[w.severity]}>
                {severityLabel[w.severity]}
              </Badge>
            </div>
            <p className="text-body-sm text-ink-muted">
              {w.gap_description}
            </p>
          </div>
        ))}
      </div>

      {prediction.recommended_focus?.length > 0 && (
        <div className="rounded-lg bg-primary-soft p-4">
          <h4 className="font-semibold text-primary mb-2">
            建议重点训练
          </h4>
          <ul className="space-y-1">
            {prediction.recommended_focus.map((focus, idx) => (
              <li
                key={idx}
                className="text-body-sm text-ink-muted flex items-start gap-2"
              >
                <span className="text-primary mt-1">→</span>
                {focus}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
