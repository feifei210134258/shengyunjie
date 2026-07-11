"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getDimensionShortLabel } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ArrowRight, ClipboardList, FileText, Lightbulb } from "lucide-react";

interface ReportData {
  id: string;
  completed_at: string;
  overall_score: number | null;
  overall_grade: string | null;
  strengths: string[];
  weaknesses: string[];
}

interface Props {
  report: ReportData | null;
  focusAreas?: string[];
  className?: string;
}

function takeTop(items: string[], count: number) {
  return items.filter(Boolean).slice(0, count);
}

function DimensionBadge({
  item,
  variant,
}: {
  item: string;
  variant: "success" | "warning" | "error";
}) {
  return (
    <Badge variant={variant}>
      {getDimensionShortLabel(item) || item}
    </Badge>
  );
}

export default function LatestReport({
  report,
  focusAreas = [],
  className,
}: Props) {
  const focusList = takeTop(focusAreas.length > 0 ? focusAreas : report?.weaknesses ?? [], 3);
  const strengths = takeTop(report?.strengths ?? [], 2);
  const reportWeaknesses = takeTop(report?.weaknesses ?? [], 3);

  return (
    <Card className={cn("flex min-h-[320px] flex-col", className)}>
      <div className="mb-4 flex items-center gap-2.5">
        <FileText className="h-5 w-5 text-primary" strokeWidth={1.5} />
        <h3 className="text-heading-md font-semibold text-ink">最近诊断</h3>
      </div>

      {!report ? (
        <div className="flex flex-1 flex-col">
          <div className="rounded-lg border border-dashed border-line-strong bg-surface px-4 py-5">
            <ClipboardList
              className="mb-3 h-5 w-5 text-ink-faint"
              strokeWidth={1.5}
            />
            <p className="text-body-sm font-semibold text-ink">暂无诊断报告</p>
            <p className="mt-1 text-body-sm text-ink-muted">
              先完成一次诊断，首页会把你的短板和训练方向自动收拢到这里。
            </p>
          </div>
          <p className="mt-4 text-body-sm text-ink-muted">
            入口已放在页面顶部的主行动里，这里只保留诊断状态。
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col">
          <div className="mb-4 rounded-lg bg-surface px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-data-lg font-bold text-ink">
                  {report.overall_score ?? "-"}
                  {report.overall_score != null && (
                    <span className="ml-1 text-body-md font-normal text-ink-muted">
                      分
                    </span>
                  )}
                </p>
                <p className="text-body-sm text-ink-muted">
                  {new Date(report.completed_at).toLocaleDateString("zh-CN")}
                </p>
              </div>
              {report.overall_grade && (
                <Badge grade={report.overall_grade as "A" | "B" | "C" | "D"}>
                  {report.overall_grade}
                </Badge>
              )}
            </div>
          </div>

          {focusList.length > 0 && (
            <div className="mb-4 rounded-lg border border-warning-soft bg-warning-soft/40 px-3 py-3">
              <div className="mb-2 flex items-center gap-2">
                <Lightbulb
                  className="h-4 w-4 text-warning"
                  strokeWidth={1.5}
                />
                <p className="text-label font-semibold text-warning">
                  下一步建议
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {focusList.map((item) => (
                  <DimensionBadge key={item} item={item} variant="warning" />
                ))}
              </div>
            </div>
          )}

          {strengths.length > 0 && (
            <div className="mb-3">
              <p className="mb-1.5 text-label font-semibold text-ink-muted">
                优势能力
              </p>
              <div className="flex flex-wrap gap-1.5">
                {strengths.map((item) => (
                  <DimensionBadge key={item} item={item} variant="success" />
                ))}
              </div>
            </div>
          )}

          {reportWeaknesses.length > 0 && (
            <div className="mb-4">
              <p className="mb-1.5 text-label font-semibold text-ink-muted">
                待提升
              </p>
              <div className="flex flex-wrap gap-1.5">
                {reportWeaknesses.map((item) => (
                  <DimensionBadge key={item} item={item} variant="error" />
                ))}
              </div>
            </div>
          )}

          <Link
            href={`/diagnosis/report?reportId=${encodeURIComponent(report.id)}`}
            className="mt-auto inline-flex items-center gap-1.5 text-body-sm font-semibold text-primary transition-colors hover:text-primary-hover"
          >
            查看完整报告
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </Card>
  );
}
