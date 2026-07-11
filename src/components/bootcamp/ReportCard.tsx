"use client";

import { BootcampReport } from "@/types/bootcamp";
import AbilityRadarChart from "@/components/training/RadarChart";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  report: BootcampReport;
}

export default function ReportCard({ report }: Props) {
  const isComprehensive = report.report_type === "comprehensive";

  const radarData = report.scores_snapshot
    ? Object.entries(report.scores_snapshot).map(([dimension, score]) => ({
        dimension:
          dimension === "structure"
            ? "结构化"
            : dimension === "logic"
              ? "逻辑性"
              : dimension === "professionalism"
                ? "专业度"
                : "创新性",
        score,
        fullMark: 10,
      }))
    : [];

  return (
    <Card variant="subtle" size="md" className="space-y-6">
      {/* Report type badge */}
      <div className="flex items-center justify-between">
        <Badge variant={isComprehensive ? "default" : "neutral"}>
          {isComprehensive ? "综合报告" : `第 ${report.day_number} 天日报`}
        </Badge>
        {isComprehensive && report.content.grade && (
          <span className="text-heading-lg font-bold text-primary">
            等级 {report.content.grade}
          </span>
        )}
      </div>

      {/* Radar chart */}
      {radarData.length > 0 && (
        <div className="h-[240px]">
          <AbilityRadarChart data={radarData} />
        </div>
      )}

      {/* Summary */}
      <div>
        <h4 className="font-semibold text-ink mb-2">总体评价</h4>
        <p className="text-body-md text-ink-muted leading-relaxed">
          {report.content.summary}
        </p>
      </div>

      {/* Key takeaways */}
      {report.content.key_takeaways?.length > 0 && (
        <div>
          <h4 className="font-semibold text-ink mb-2">关键要点</h4>
          <ul className="space-y-2">
            {report.content.key_takeaways.map((takeaway, idx) => (
              <li
                key={idx}
                className="text-body-sm text-ink-muted flex items-start gap-2"
              >
                <span className="text-primary mt-1">•</span>
                {takeaway}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Comparison (comprehensive only) */}
      {isComprehensive && report.content.comparison && (
        <div className="bg-primary-soft p-4 rounded-xl">
          <h4 className="font-semibold text-primary mb-2">成长对比</h4>
          <p className="text-body-sm text-ink-muted">
            {report.content.comparison.growth}
          </p>
        </div>
      )}

      {/* Recommended reading */}
      {report.content.recommended_reading &&
        report.content.recommended_reading.length > 0 && (
          <div>
            <h4 className="font-semibold text-ink mb-2">推荐学习资源</h4>
            <ul className="space-y-1">
              {report.content.recommended_reading.map((resource, idx) => (
                <li key={idx} className="text-body-sm text-primary">
                  {resource}
                </li>
              ))}
            </ul>
          </div>
        )}
    </Card>
  );
}
