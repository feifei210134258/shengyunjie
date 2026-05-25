"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import AbilityRadarChart from "@/components/training/RadarChart";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

const DIM_COLORS: Record<string, string> = {
  "战略思维": "bg-primary",
  "系统设计能力": "bg-secondary",
  "数据决策能力": "bg-tertiary",
  "用户洞察与需求管理": "bg-primary",
  "商业思维": "bg-secondary",
};

const DIM_LABELS: Record<string, string> = {
  "战略思维": "战略思维",
  "系统设计能力": "系统设计",
  "数据决策能力": "数据决策",
  "用户洞察与需求管理": "用户洞察",
  "商业思维": "商业思维",
};

export default function TrainingPage() {
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  // 统计数据
  const [stats, setStats] = useState<{
    totalCount: number;
    todayCount: number;
    streak: number;
    dimStats: Record<string, number>;
    dimAverages: Record<string, number>;
    recent: { id: string; dimension: string; question_scenario: string; created_at: string }[];
  } | null>(null);

  // 日历数据（有训练的日期）
  const [trainedDays, setTrainedDays] = useState<number[]>([]);
  const [monthCount, setMonthCount] = useState(0);

  const monthStr = `${year}-${String(month).padStart(2, "0")}`;

  // 当月天数
  const daysInMonth = new Date(year, month, 0).getDate();
  // 当月 1 号是星期几（0=日）
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();

  // 今天
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  useEffect(() => {
    // 获取统计
    fetch("/api/training/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => {});

    // 获取当月训练日历
    fetch(`/api/training/sessions?month=${monthStr}`)
      .then((r) => r.json())
      .then((data) => {
        setTrainedDays(data.days || []);
        setMonthCount(data.count || 0);
      })
      .catch(() => {});
  }, [monthStr]);

  const prevMonth = () => {
    if (month === 1) { setYear(year - 1); setMonth(12); }
    else { setMonth(month - 1); }
  };

  const nextMonth = () => {
    if (month === 12) { setYear(year + 1); setMonth(1); }
    else { setMonth(month + 1); }
  };

  // 计算连击天数（从今天往前数连续有训练的日期）
  const calcStreak = (): number => {
    if (!trainedDays.length) return 0;
    let streak = 0;
    const d = new Date(year, month - 1, 1);
    for (let i = 0; i < daysInMonth; i++) {
      const day = d.getDate();
      if (trainedDays.includes(day)) streak++;
      else if (day < today.getDate()) streak = 0; // 中断
      d.setDate(d.getDate() + 1);
    }
    // 简化：返回本月训练天数
    return monthCount;
  };

  return (
    <>
      {/* 顶部栏 */}
      <header className="h-20 border-b border-outline-variant bg-white/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <h2 className="text-headline-md font-bold text-on-surface">日常训练</h2>
          <div className="h-6 w-px bg-outline-variant mx-1" />
          <span className="text-body-sm text-on-surface-variant">持续成长，每日精进</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-9 h-9 flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-full transition-colors">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="w-9 h-9 flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-full transition-colors">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
      </header>

      <div className="max-w-[1440px] mx-auto px-8 py-8 space-y-8">
        {/* Hero 统计区 */}
        <section className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* 连击卡片 */}
          <div className="col-span-1 md:col-span-2 bg-primary text-on-primary rounded-xl p-6 relative overflow-hidden flex flex-col justify-between">
            <div className="relative z-10">
              <span className="bg-white/20 text-on-primary px-3 py-1 rounded-full text-label-bold">
                {monthCount > 0 ? "本月已训练" : "尚未训练"}
              </span>
              <h3 className="text-headline-xl font-bold mt-3">
                {monthCount} <span className="text-headline-md font-normal">天</span>
              </h3>
              <p className="opacity-80 text-body-md">
                {monthCount > 0 ? "再接再厉，能成大器" : "今天就开始吧"}
              </p>
              {stats?.streak ? (
                <p className="text-body-sm opacity-70 mt-1">
                  已连续训练 {stats.streak} 天
                </p>
              ) : null}
            </div>
            <button
              onClick={() => router.push("/training/session")}
              className="relative z-10 mt-6 w-fit bg-on-primary text-primary px-6 py-3 rounded-xl font-bold text-body-md hover:opacity-90 transition-all flex items-center gap-2"
            >
              开启今日训练
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-1/4 translate-y-1/4">
              <span className="material-symbols-outlined text-[240px]">trending_up</span>
            </div>
          </div>

          {/* 累计完成题数 */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col justify-between">
            <div>
              <span className="material-symbols-outlined text-secondary mb-2">task_alt</span>
              <p className="text-label-bold text-on-surface-variant">累计完成题数</p>
            </div>
            <div className="mt-4">
              <p className="text-headline-lg font-bold">
                {stats?.totalCount ?? "—"}
              </p>
              <p className="text-body-sm text-on-surface-variant mt-1">
                今日已答 {stats?.todayCount ?? 0} 题
              </p>
            </div>
          </div>

          {/* 各维度完成情况 */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col justify-between">
            <div>
              <span className="material-symbols-outlined text-primary mb-2">donut_small</span>
              <p className="text-label-bold text-on-surface-variant">各维度完成</p>
            </div>
            <div className="mt-4 space-y-3">
              {Object.entries(DIM_LABELS).map(([key, label]) => {
                const count = stats?.dimStats?.[key] ?? 0;
                const total = stats?.totalCount ?? 1;
                const pct = Math.min(Math.round((count / Math.max(total, 1)) * 100), 100);
                const color = DIM_COLORS[key] || "bg-primary";
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-body-sm text-on-surface-variant w-14 truncate">{label}</span>
                    <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-body-sm text-on-surface-variant w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 能力雷达图 */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col justify-between">
            <div>
              <span className="material-symbols-outlined text-secondary mb-2">radar</span>
              <p className="text-label-bold text-on-surface-variant">能力雷达</p>
            </div>
            <div className="mt-4">
              {stats?.dimAverages && Object.keys(stats.dimAverages).length >= 3 ? (
                <AbilityRadarChart
                  data={Object.entries(stats.dimAverages).map(([dim, score]) => ({
                    dimension: DIM_LABELS[dim] || dim,
                    score: Math.min(score, 10),
                    fullMark: 10,
                  }))}
                />
              ) : (
                <p className="text-body-sm text-on-surface-variant text-center py-8">
                  完成更多训练以解锁能力分析
                </p>
              )}
            </div>
          </div>
        </section>

        {/* 日历 + 历史记录 */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 日历 */}
          <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-headline-md font-bold">本月训练概览</h3>
                <p className="text-body-sm text-on-surface-variant">
                  {year}年{month}月 · 本月已训练 {monthCount} 天
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={prevMonth} className="p-1.5 hover:bg-surface-container rounded-lg transition-colors">
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <span className="text-label-bold px-3">{month}月</span>
                <button onClick={nextMonth} className="p-1.5 hover:bg-surface-container rounded-lg transition-colors">
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>

            {/* 星期行 */}
            <div className="grid grid-cols-7 text-center text-label-bold text-on-surface-variant mb-2">
              {WEEKDAYS.map((d) => (
                <div key={d} className="py-1">{d}</div>
              ))}
            </div>

            {/* 日期网格 */}
            <div className="grid grid-cols-7">
              {/* 前导空白 */}
              {Array.from({ length: firstDayOfWeek }, (_, i) => (
                <div key={`pad-${i}`} className="h-10" />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isToday = dateStr === todayStr;
                const isTrained = trainedDays.includes(day);
                const isFuture = dateStr > todayStr;
                return (
                  <div
                    key={day}
                    className={`h-10 flex items-center justify-center text-body-sm rounded-lg transition-colors ${
                      isToday
                        ? "bg-primary text-on-primary font-bold ring-4 ring-primary/20"
                        : isTrained
                          ? "bg-secondary-container text-on-secondary-container font-bold"
                          : isFuture
                            ? ""
                            : "opacity-30"
                    }`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 历史记录 */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-label-bold text-primary">历史记录</h4>
            </div>
            <div className="space-y-3">
              {stats?.recent && stats.recent.length > 0 ? (
                stats.recent.slice(0, 5).map((r) => (
                  <Link
                    key={r.id}
                    href={`/training/history/${r.id}`}
                    className="flex items-center gap-3 p-3 hover:bg-surface-container rounded-xl transition-all w-full text-left group"
                  >
                    <div className="w-10 h-10 bg-tertiary-container text-on-tertiary-container rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                      <span className="material-symbols-outlined">data_object</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-bold text-on-surface truncate">
                        {r.question_scenario.slice(0, 30)}
                        {r.question_scenario.length > 30 ? "…" : ""}
                      </p>
                      <p className="text-body-sm text-on-surface-variant">
                        {r.dimension} · {new Date(r.created_at).toLocaleDateString("zh-CN")}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-body-sm text-on-surface-variant text-center py-8">
                  还没有训练记录，去完成第一题吧
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
