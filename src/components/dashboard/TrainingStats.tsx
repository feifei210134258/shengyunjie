"use client";

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

const DIM_COLORS: Record<string, string> = {
  "战略思维": "#4f46e5",
  "系统设计能力": "#0d9488",
  "数据决策能力": "#d97706",
  "用户洞察与需求管理": "#dc2626",
  "商业思维": "#7c3aed",
};

/* ------------------------------------------------------------------ */
/*  Component
/* ------------------------------------------------------------------ */

interface TrainingStatsData {
  totalCount: number;
  todayCount: number;
  streak: number;
  dimAverages: Record<string, number>;
}

interface Props {
  stats: TrainingStatsData | null;
}

export default function TrainingStats({ stats }: Props) {
  return (
    <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
      {/* Title */}
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary">bar_chart</span>
        <h3 className="text-headline-md font-bold text-on-surface">训练统计</h3>
      </div>

      {!stats ? (
        <p className="text-body-sm text-on-surface-variant text-center py-8">
          暂无训练数据
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {/* Card 1: Streak */}
          <div className="bg-surface-container rounded-xl p-4 flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-secondary mb-2">
              local_fire_department
            </span>
            <p className="text-headline-lg font-bold text-on-surface">
              {stats.streak}
            </p>
            <p className="text-label-bold text-on-surface-variant">
              连续训练(天)
            </p>
          </div>

          {/* Card 2: Total + Today */}
          <div className="bg-surface-container rounded-xl p-4 flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-primary mb-2">
              task_alt
            </span>
            <p className="text-headline-lg font-bold text-on-surface">
              {stats.totalCount}
            </p>
            <p className="text-label-bold text-on-surface-variant">
              累计完成题数
            </p>
            <p className="text-body-sm text-on-surface-variant mt-1">
              今日 +{stats.todayCount}
            </p>
          </div>

          {/* Card 3: Dimension averages */}
          <div className="bg-surface-container rounded-xl p-4 flex flex-col justify-center">
            <p className="text-label-bold text-on-surface-variant mb-3">
              能力维度
            </p>
            <div className="space-y-2">
              {Object.entries(DIM_LABELS).map(([key, label]) => {
                const avg = stats.dimAverages?.[key];
                const pct = avg != null ? Math.min(Math.round((avg / 10) * 100), 100) : 0;
                const color = DIM_COLORS[key] || "#2a14b4";
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-body-sm text-on-surface-variant w-14 truncate">
                      {label}
                    </span>
                    <div className="flex-1 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                    <span className="text-body-sm text-on-surface-variant w-8 text-right">
                      {avg != null ? avg : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}