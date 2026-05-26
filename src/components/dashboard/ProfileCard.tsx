"use client";

import Link from "next/link";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

/* ------------------------------------------------------------------ */
/*  Constants
/* ------------------------------------------------------------------ */

const DIM_LABELS: Record<string, string> = {
  "战略思维": "战略思维",
  "系统设计能力": "系统设计",
  "数据决策能力": "数据决策",
  "用户洞察与需求管理": "用户洞察",
  "商业思维": "商业思维",
};

const GRADE_COLORS: Record<string, string> = {
  A: "bg-green-100 text-green-800",
  B: "bg-blue-100 text-blue-800",
  C: "bg-yellow-100 text-yellow-800",
  D: "bg-red-100 text-red-800",
};

/* ------------------------------------------------------------------ */
/*  Component
/* ------------------------------------------------------------------ */

interface ProfileData {
  dimensions: { name: string; score: number; grade: string }[];
  weaknesses: string[];
}

interface Props {
  profile: ProfileData | null;
}

export default function ProfileCard({ profile }: Props) {
  // ---------- Empty state ----------
  if (!profile) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col items-center justify-center min-h-[320px]">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-3">
          psychology
        </span>
        <h3 className="text-headline-md font-bold text-on-surface mb-2">能力画像</h3>
        <p className="text-body-sm text-on-surface-variant mb-6 text-center">
          完成 AI 诊断，了解你的产品能力水平
        </p>
        <Link
          href="/diagnosis/scale"
          className="bg-primary text-on-primary px-6 py-3 rounded-xl text-body-md font-bold hover:opacity-90 transition-all flex items-center gap-2"
        >
          开始诊断
          <span className="material-symbols-outlined">arrow_forward</span>
        </Link>
      </div>
    );
  }

  // ---------- Data ----------
  const radarData = profile.dimensions.map((d) => ({
    dimension: DIM_LABELS[d.name] || d.name,
    score: d.score,
    fullMark: 100,
  }));

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
      {/* Title */}
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary">radar</span>
        <h3 className="text-headline-md font-bold text-on-surface">能力画像</h3>
      </div>

      {/* Radar Chart (0-100) */}
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fill: "#6b7280", fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={false}
              axisLine={false}
            />
            <Radar
              name="能力评分"
              dataKey="score"
              stroke="#2a14b4"
              fill="#2a14b4"
              fillOpacity={0.15}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Dimension list with scores & grades */}
      <div className="mt-4 space-y-2">
        {profile.dimensions.map((d) => {
          const isWeak = profile.weaknesses.includes(d.name);
          return (
            <div key={d.name} className="flex items-center gap-2">
              <span className="text-body-sm text-on-surface w-16 shrink-0 truncate">
                {DIM_LABELS[d.name] || d.name}
              </span>
              <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${d.score}%` }}
                />
              </div>
              <span
                className={`text-label-bold px-2 py-0.5 rounded-full ${GRADE_COLORS[d.grade] || "bg-gray-100 text-gray-700"}`}
              >
                {d.grade}
              </span>
              {isWeak && (
                <span
                  className="material-symbols-outlined text-sm text-red-500"
                  title="薄弱项"
                >
                  warning
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}