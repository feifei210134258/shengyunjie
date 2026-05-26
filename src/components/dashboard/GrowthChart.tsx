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

/* ------------------------------------------------------------------ */
/*  Component
/* ------------------------------------------------------------------ */

interface TrendPoint {
  date: string;
  avgScore: number;
}

interface Props {
  trendData: TrendPoint[];
}

export default function GrowthChart({ trendData }: Props) {
  const hasEnough = trendData.length >= 2;

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
      {/* Title */}
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary">trending_up</span>
        <h3 className="text-headline-md font-bold text-on-surface">成长趋势</h3>
      </div>

      {!hasEnough ? (
        <div className="flex flex-col items-center justify-center min-h-[260px]">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-3">
            show_chart
          </span>
          <p className="text-body-sm text-on-surface-variant mb-4">
            完成更多训练以解锁成长曲线
          </p>
          <Link
            href="/training"
            className="text-primary text-label-bold hover:underline flex items-center gap-1"
          >
            前往训练
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
      ) : (
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trendData}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#6b7280", fontSize: 12 }}
              />
              <YAxis
                domain={[0, 10]}
                tick={{ fill: "#6b7280", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                }}
                formatter={(value: any) => [`${value} 分`, "日均评分"]}
              />
              <Line
                type="monotone"
                dataKey="avgScore"
                stroke="#2a14b4"
                strokeWidth={2}
                dot={{ fill: "#2a14b4", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}