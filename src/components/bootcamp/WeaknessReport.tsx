"use client";

import { WeaknessPrediction } from "@/types/bootcamp";
import AbilityRadarChart from "@/components/training/RadarChart";

interface Props {
  prediction: WeaknessPrediction;
}

export default function WeaknessReport({ prediction }: Props) {
  const radarData =
    prediction.weak_dimensions?.map((w) => ({
      dimension: w.dimension,
      score: w.severity === "high" ? 3 : w.severity === "medium" ? 5 : 7,
      fullMark: 10,
    })) || [];

  const severityColor = {
    high: "bg-error text-on-error",
    medium: "bg-warning text-on-warning",
    low: "bg-success text-on-success",
  };

  const severityLabel = {
    high: "严重",
    medium: "中等",
    low: "轻微",
  };

  return (
    <div className="space-y-6">
      <h3 className="text-title-md font-bold text-on-surface">面试弱点预测</h3>

      {/* 雷达图 */}
      {radarData.length > 0 && (
        <div className="bg-surface-container rounded-xl p-4">
          <AbilityRadarChart data={radarData} />
        </div>
      )}

      {/* 弱点列表 */}
      <div className="space-y-3">
        {prediction.weak_dimensions?.map((w, idx) => (
          <div key={idx} className="bg-surface-container p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-label-bold text-on-surface">{w.dimension}</span>
              <span
                className={`px-2 py-1 rounded-full text-label-sm ${severityColor[w.severity]}`}
              >
                {severityLabel[w.severity]}
              </span>
            </div>
            <p className="text-body-sm text-on-surface-variant">
              {w.gap_description}
            </p>
          </div>
        ))}
      </div>

      {/* 推荐关注 */}
      {prediction.recommended_focus?.length > 0 && (
        <div className="bg-primary-container p-4 rounded-lg">
          <h4 className="font-label-bold text-on-primary-container mb-2">建议重点训练</h4>
          <ul className="space-y-1">
            {prediction.recommended_focus.map((focus, idx) => (
              <li
                key={idx}
                className="text-body-sm text-on-primary-container flex items-start gap-2"
              >
                <span className="mt-1">→</span>
                {focus}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
