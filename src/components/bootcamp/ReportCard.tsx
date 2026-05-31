"use client";

import { BootcampReport } from "@/types/bootcamp";
import AbilityRadarChart from "@/components/training/RadarChart";

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
    <div className="bg-surface-container p-6 rounded-xl space-y-6">
      {/* 报告类型标签 */}
      <div className="flex items-center justify-between">
        <span
          className={`px-3 py-1 rounded-full text-label-sm ${
            isComprehensive
              ? "bg-primary-container text-on-primary-container"
              : "bg-secondary-container text-on-secondary-container"
          }`}
        >
          {isComprehensive ? "综合报告" : `第 ${report.day_number} 天日报`}
        </span>
        {isComprehensive && report.content.grade && (
          <span className="text-headline-lg font-bold text-primary">等级 {report.content.grade}</span>
        )}
      </div>

      {/* 雷达图 */}
      {radarData.length > 0 && (
        <div className="h-[240px]">
          <AbilityRadarChart data={radarData} />
        </div>
      )}

      {/* 摘要 */}
      <div>
        <h4 className="font-label-bold text-on-surface mb-2">总体评价</h4>
        <p className="text-body-md text-on-surface-variant">{report.content.summary}</p>
      </div>

      {/* 关键要点 */}
      {report.content.key_takeaways?.length > 0 && (
        <div>
          <h4 className="font-label-bold text-on-surface mb-2">关键要点</h4>
          <ul className="space-y-2">
            {report.content.key_takeaways.map((takeaway, idx) => (
              <li
                key={idx}
                className="text-body-sm text-on-surface-variant flex items-start gap-2"
              >
                <span className="text-primary mt-1">•</span>
                {takeaway}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 对比（仅综合报告） */}
      {isComprehensive && report.content.comparison && (
        <div className="bg-primary-container p-4 rounded-lg">
          <h4 className="font-label-bold text-on-primary-container mb-2">成长对比</h4>
          <p className="text-body-sm text-on-primary-container">
            {report.content.comparison.growth}
          </p>
        </div>
      )}

      {/* 推荐资源 */}
      {report.content.recommended_reading && report.content.recommended_reading.length > 0 && (
        <div>
          <h4 className="font-label-bold text-on-surface mb-2">推荐学习资源</h4>
          <ul className="space-y-1">
            {report.content.recommended_reading.map((resource, idx) => (
              <li key={idx} className="text-body-sm text-primary">{resource}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
