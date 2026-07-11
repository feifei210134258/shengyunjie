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
        <div className="font-mono text-[36px] font-bold leading-10 text-primary">
          {averageScore.toFixed(1)}
        </div>
        <p className="text-body-sm text-ink-muted mt-1">
          今日平均分 / 10
        </p>
      </div>

      <p className="text-body-md text-ink-muted">
        {isLastDay
          ? "三天训练已完成。"
          : `下一步：第 ${dayNumber + 1} 天。`}
      </p>

      <Button size="lg" onClick={onContinue}>
        {isLastDay ? "查看综合报告" : "继续下一天"}
      </Button>
    </Card>
  );
}
