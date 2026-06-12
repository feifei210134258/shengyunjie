"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PartyPopper } from "lucide-react";

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
    <Card variant="subtle" size="lg" className="text-center space-y-6">
      <div className="flex justify-center">
        <PartyPopper className="w-12 h-12 text-success" strokeWidth={1.5} />
      </div>

      <h2 className="text-heading-lg font-semibold text-ink">
        第 {dayNumber} 天特训完成
      </h2>

      <div className="py-4">
        <div className="text-display-xl font-bold text-primary">
          {averageScore.toFixed(1)}
        </div>
        <p className="text-body-sm text-ink-muted mt-1">
          今日平均分 / 10
        </p>
      </div>

      <p className="text-body-md text-ink-muted">
        {isLastDay
          ? "恭喜完成全部 3 天特训，查看你的综合成长报告。"
          : `休息片刻，准备迎接第 ${dayNumber + 1} 天的挑战。`}
      </p>

      <Button size="lg" onClick={onContinue}>
        {isLastDay ? "查看综合报告" : "继续下一天"}
      </Button>
    </Card>
  );
}
