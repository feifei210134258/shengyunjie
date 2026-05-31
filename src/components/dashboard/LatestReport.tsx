"use client";

import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Constants
/* ------------------------------------------------------------------ */

const GRADE_COLORS: Record<string, string> = {
  A: "bg-green-100 text-green-800",
  B: "bg-blue-100 text-blue-800",
  C: "bg-yellow-100 text-yellow-800",
  D: "bg-red-100 text-red-800",
};

/* ------------------------------------------------------------------ */
/*  Component
/* ------------------------------------------------------------------ */

interface ReportData {
  id: string;
  completed_at: string;
  overall_score: number;
  overall_grade: string;
  strengths: string[];
  weaknesses: string[];
}

interface Props {
  report: ReportData | null;
}

export default function LatestReport({ report }: Props) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col">
      {/* Title */}
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary">description</span>
        <h3 className="text-headline-md font-bold text-on-surface">最近诊断</h3>
      </div>

      {!report ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center flex-1">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-3">
            clinical_notes
          </span>
          <p className="text-body-sm text-on-surface-variant mb-4">暂无诊断报告</p>
          <Link
            href="/diagnosis/scale"
            className="text-primary text-label-bold hover:underline flex items-center gap-1"
          >
            开始诊断
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
      ) : (
        /* Has report */
        <>
          {/* Score + Grade */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-headline-lg font-bold text-on-surface">
                {report.overall_score}
                <span className="text-body-md font-normal text-on-surface-variant">
                  {" "}分
                </span>
              </p>
              <p className="text-body-sm text-on-surface-variant">
                {new Date(report.completed_at).toLocaleDateString("zh-CN")}
              </p>
            </div>
            <span
              className={`text-headline-md font-bold px-3 py-1 rounded-full ${GRADE_COLORS[report.overall_grade] || "bg-gray-100 text-gray-700"}`}
            >
              {report.overall_grade}
            </span>
          </div>

          {/* Strengths */}
          {report.strengths.length > 0 && (
            <div className="mb-3">
              <p className="text-label-bold text-on-surface-variant mb-1.5">
                优势能力
              </p>
              <div className="flex flex-wrap gap-1">
                {report.strengths.map((s) => (
                  <span
                    key={s}
                    className="text-body-sm px-2 py-0.5 bg-green-50 text-green-700 rounded-md"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Weaknesses */}
          {report.weaknesses.length > 0 && (
            <div className="mb-4">
              <p className="text-label-bold text-on-surface-variant mb-1.5">
                待提升
              </p>
              <div className="flex flex-wrap gap-1">
                {report.weaknesses.map((w) => (
                  <span
                    key={w}
                    className="text-body-sm px-2 py-0.5 bg-red-50 text-red-700 rounded-md"
                  >
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action */}
          <Link
            href="/diagnosis/report"
            className="mt-auto bg-primary text-on-primary text-center px-6 py-2.5 rounded-xl text-body-md font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            查看完整报告
            <span className="material-symbols-outlined">open_in_new</span>
          </Link>
        </>
      )}
    </div>
  );
}