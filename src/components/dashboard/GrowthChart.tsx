"use client";

import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";
import { CHART_COLORS } from "@/lib/constants";
import { getLatestTrendScore, type TrendPoint } from "@/lib/dashboard/trend";
import { TRAINING_SESSION_ROUTE } from "@/lib/routes";
import { Activity, ArrowRight, TrendingUp } from "lucide-react";

interface Props {
  trendData: TrendPoint[];
}

export default function GrowthChart({ trendData }: Props) {
  const hasEnough = trendData.length >= 2;
  const latest = getLatestTrendScore(trendData);

  return (
    <Card size="sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <TrendingUp className="h-4 w-4 text-primary" strokeWidth={1.5} />
          <h3 className="text-heading-sm font-semibold text-ink">成长趋势</h3>
        </div>
        <div className="text-right">
          <p className="font-mono text-data-md font-bold text-ink">
            {latest != null ? latest.toFixed(1) : "-"}
          </p>
          <p className="text-label font-semibold text-ink-muted">最近均分</p>
        </div>
      </div>

      {!hasEnough ? (
        <div className="flex min-h-[170px] flex-col justify-center rounded-lg border border-dashed border-line-strong bg-surface px-4 py-5">
          <Activity className="mb-2 h-5 w-5 text-ink-faint" strokeWidth={1.5} />
          <p className="text-body-sm font-semibold text-ink">
            完成更多训练后生成曲线
          </p>
          <Link
            href={TRAINING_SESSION_ROUTE}
            className="mt-2 inline-flex items-center gap-1 text-body-sm font-semibold text-primary hover:underline underline-offset-2"
          >
            去做一题
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="h-[170px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trendData}
              margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={CHART_COLORS.grid}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 10]}
                tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "10px",
                  border: `1px solid ${CHART_COLORS.tooltipBorder}`,
                  backgroundColor: CHART_COLORS.tooltip,
                  boxShadow: "0 4px 12px rgba(28,25,23,0.08)",
                  fontSize: "13px",
                }}
                formatter={(value) => [`${value} 分`, "日均评分"]}
              />
              <Line
                type="monotone"
                dataKey="avgScore"
                stroke={CHART_COLORS.primary}
                strokeWidth={2.25}
                dot={{ fill: CHART_COLORS.primary, r: 3, strokeWidth: 0 }}
                activeDot={{ r: 4.5, strokeWidth: 2, stroke: "#fff" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
