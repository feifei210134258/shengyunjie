"use client";

import { useEffect, useState } from "react";
import ReportCard from "@/components/bootcamp/ReportCard";
import { BootcampReport } from "@/types/bootcamp";

export default function ReportPage() {
  const [reports, setReports] = useState<BootcampReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      const res = await fetch("/api/bootcamp/report");
      const data = await res.json();
      if (data.reports) {
        setReports(data.reports);
      }
      setLoading(false);
    }
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant">
            description
          </span>
          <h2 className="text-headline-lg font-bold text-on-surface">尚未完成特训</h2>
          <p className="text-body-md text-on-surface-variant">完成 3 天特训后将生成详细的成长报告</p>
        </div>
      </div>
    );
  }

  const comprehensiveReport = reports.find(
    (r) => r.report_type === "comprehensive"
  );
  const dailyReports = reports.filter((r) => r.report_type === "daily");

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface">特训报告</h1>
          <p className="text-body-md text-on-surface-variant mt-2">查看你的特训成果和能力成长轨迹</p>
        </div>

        {/* 综合报告 */}
        {comprehensiveReport && (
          <div className="space-y-4">
            <h2 className="text-title-lg font-bold text-on-surface">综合成长报告</h2>
            <ReportCard report={comprehensiveReport} />
          </div>
        )}

        {/* 日报列表 */}
        {dailyReports.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-title-lg font-bold text-on-surface">每日报告</h2>
            <div className="space-y-4">
              {dailyReports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
