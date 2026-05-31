"use client";

interface Props {
  dayNumber: number;
  averageScore: number;
  onContinue: () => void;
  isLastDay: boolean;
}

export default function DailySummary({
  dayNumber,
  averageScore,
  onContinue,
  isLastDay,
}: Props) {
  return (
    <div className="bg-surface-container p-8 rounded-xl text-center space-y-6">
      <div className="flex justify-center">
        <span className="material-symbols-outlined text-6xl text-success">celebration</span>
      </div>

      <h2 className="text-headline-lg font-bold text-on-surface">第 {dayNumber} 天特训完成！</h2>

      <div className="py-4">
        <div className="text-display-lg font-bold text-primary">{averageScore.toFixed(1)}</div>
        <p className="text-body-sm text-on-surface-variant">今日平均分 / 10</p>
      </div>

      <p className="text-body-md text-on-surface-variant">
        {isLastDay
          ? "恭喜完成全部 3 天特训！查看你的综合成长报告。"
          : `休息片刻，准备迎接第 ${dayNumber + 1} 天的挑战！`}
      </p>

      <button
        onClick={onContinue}
        className="px-8 py-3 bg-primary text-on-primary rounded-xl font-label-bold"
      >
        {isLastDay ? "查看综合报告" : "继续下一天"}
      </button>
    </div>
  );
}
