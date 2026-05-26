"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import ProfileCard from "@/components/dashboard/ProfileCard";
import GrowthChart from "@/components/dashboard/GrowthChart";
import TrainingStats from "@/components/dashboard/TrainingStats";
import LatestReport from "@/components/dashboard/LatestReport";

/* ------------------------------------------------------------------ */
/*  Types
/* ------------------------------------------------------------------ */

export interface DashboardData {
  profile: {
    dimensions: { name: string; score: number; grade: string }[];
    weaknesses: string[];
  } | null;
  trainingStats: {
    totalCount: number;
    todayCount: number;
    streak: number;
    dimStats: Record<string, number>;
    dimAverages: Record<string, number>;
  };
  growthTrend: {
    date: string;
    dimension: string;
    avgScore: number;
    count: number;
  }[];
  latestReport: {
    id: string;
    completed_at: string;
    overall_score: number;
    overall_grade: string;
    strengths: string[];
    weaknesses: string[];
  } | null;
}

export interface TrendPoint {
  date: string;
  avgScore: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers
/* ------------------------------------------------------------------ */

function aggregateTrend(growthTrend: DashboardData["growthTrend"]): TrendPoint[] {
  if (!growthTrend?.length) return [];
  const groupMap = new Map<string, number[]>();
  growthTrend.forEach((pt) => {
    const scores = groupMap.get(pt.date) || [];
    scores.push(pt.avgScore);
    groupMap.set(pt.date, scores);
  });
  return Array.from(groupMap.entries())
    .map(([date, scores]) => ({
      date,
      avgScore: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({ ...d, date: d.date.slice(5) }));
}

/* ------------------------------------------------------------------ */
/*  Page
/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const trendData = aggregateTrend(data?.growthTrend ?? []);

  return (
    <>
      {/* Header */}
      <header className="h-20 border-b border-outline-variant bg-white/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <h2 className="text-headline-md font-bold text-on-surface">工作台</h2>
          <div className="h-6 w-px bg-outline-variant mx-1" />
          <span className="text-body-sm text-on-surface-variant">欢迎回来</span>
        </div>
      </header>

      <div className="max-w-[1440px] mx-auto px-8 py-8 space-y-8">
        {loading ? (
          /* Loading skeleton */
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80 bg-surface-container-lowest border border-outline-variant rounded-xl animate-pulse" />
              <div className="h-80 bg-surface-container-lowest border border-outline-variant rounded-xl animate-pulse" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-64 bg-surface-container-lowest border border-outline-variant rounded-xl animate-pulse" />
              <div className="h-64 bg-surface-container-lowest border border-outline-variant rounded-xl animate-pulse" />
            </div>
          </div>
        ) : (
          <>
            {/* Row 1: Profile + Growth */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProfileCard profile={data?.profile ?? null} />
              <GrowthChart trendData={trendData} />
            </div>

            {/* Row 2: Stats + Report */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <TrainingStats stats={data?.trainingStats ?? null} />
              <LatestReport report={data?.latestReport ?? null} />
            </div>
          </>
        )}
      </div>
    </>
  );
}