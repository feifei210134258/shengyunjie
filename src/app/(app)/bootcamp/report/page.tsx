"use client";

import { useEffect, useState } from "react";
import ReportCard from "@/components/bootcamp/ReportCard";
import { BootcampReport } from "@/types/bootcamp";
import { PageHeader } from "@/components/ui/page-header";
import { PageSpinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText } from "lucide-react";

export default function BootcampReportPage() {
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
    return <PageSpinner />;
  }

  if (reports.length === 0) {
    return (
      <>
        <PageHeader title="训练报告" backHref="/bootcamp" />
        <EmptyState
          icon={<FileText className="w-7 h-7" strokeWidth={1.5} />}
          title="尚未完成特训"
          description="完成三天训练后生成报告。"
          action={
            <Link href="/bootcamp">
              <Button>开始特训</Button>
            </Link>
          }
        />
      </>
    );
  }

  const comprehensiveReport = reports.find(
    (r) => r.report_type === "comprehensive"
  );
  const dailyReports = reports.filter((r) => r.report_type === "daily");

  return (
    <>
      <PageHeader
        title="训练报告"
        backHref="/bootcamp"
      />

      <div className="mx-auto max-w-4xl space-y-7 px-4 py-5 sm:px-6 lg:px-8">
        {comprehensiveReport && (
          <div className="space-y-4">
            <h2 className="text-heading-lg font-semibold text-ink">
              综合成长报告
            </h2>
            <ReportCard report={comprehensiveReport} />
          </div>
        )}

        {dailyReports.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-heading-lg font-semibold text-ink">
              每日报告
            </h2>
            <div className="space-y-4">
              {dailyReports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
