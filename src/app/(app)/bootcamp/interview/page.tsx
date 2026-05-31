"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import InterviewQuestion from "@/components/bootcamp/InterviewQuestion";
import AnswerEvaluation from "@/components/bootcamp/AnswerEvaluation";
import DailySummary from "@/components/bootcamp/DailySummary";
import { InterviewQuestion as InterviewQuestionType } from "@/types/bootcamp";
import { calculateDayProgress } from "@/lib/bootcamp";

export default function InterviewPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<InterviewQuestionType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentDay, setCurrentDay] = useState(1);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    async function fetchQuestions() {
      const res = await fetch(`/api/bootcamp/interview?day=${currentDay}`);
      const data = await res.json();
      if (data.questions) {
        setQuestions(data.questions);
      }
      setLoading(false);
    }
    fetchQuestions();
  }, [currentDay]);

  const handleSubmitAnswer = async (answer: string) => {
    const question = questions[currentIndex];
    if (!question) return;

    setIsEvaluating(true);
    try {
      const res = await fetch("/api/bootcamp/interview/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interview_id: question.id, answer }),
      });

      const data = await res.json();
      if (res.ok && data.evaluation) {
        // 更新本地状态
        const updated = [...questions];
        updated[currentIndex] = {
          ...question,
          user_answer: answer,
          ai_evaluation: data.evaluation,
          status: "evaluated",
        };
        setQuestions(updated);
      }
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNextDay = async () => {
    if (currentDay >= 3) {
      // 生成综合报告
      await fetch("/api/bootcamp/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_type: "comprehensive" }),
      });
      router.push("/bootcamp/report");
      return;
    }

    // 生成日报并进入下一天
    await fetch("/api/bootcamp/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report_type: "daily", day_number: currentDay }),
    });

    // 生成下一天题目
    const nextDay = currentDay + 1;
    await fetch("/api/bootcamp/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day_number: nextDay }),
    });

    setCurrentDay(nextDay);
    setCurrentIndex(0);
    setShowSummary(false);
    setLoading(true);

    // 重新获取题目
    const res = await fetch(`/api/bootcamp/interview?day=${nextDay}`);
    const data = await res.json();
    if (data.questions) {
      setQuestions(data.questions);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const progress = calculateDayProgress(questions);
  const currentQuestion = questions[currentIndex];

  if (showSummary) {
    const avgScore =
      questions.reduce(
        (sum, q) => sum + (q.ai_evaluation?.overall_score || 0),
        0
      ) / questions.length;
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-2xl mx-auto">
          <DailySummary
            dayNumber={currentDay}
            averageScore={avgScore}
            onContinue={handleNextDay}
            isLastDay={currentDay >= 3}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* 进度条 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-label-sm text-on-surface-variant">Day {currentDay} / 3</span>
            <span className="text-label-sm text-primary">({getDifficultyLabel(currentDay)})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-label-sm text-on-surface-variant">第 {currentIndex + 1} / {questions.length} 题</span>
          </div>
        </div>

        {/* 进度指示器 */}
        <div className="flex gap-2">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(idx)}
              className={`flex-1 h-2 rounded-full transition-colors ${
                idx === currentIndex
                  ? "bg-primary"
                  : q.status === "evaluated"
                  ? "bg-success"
                  : "bg-outline-variant"
              }`}
            />
          ))}
        </div>

        {/* 题目 */}
        {currentQuestion && (
          <InterviewQuestion
            question={currentQuestion}
            onSubmit={handleSubmitAnswer}
            isEvaluating={isEvaluating}
          />
        )}

        {/* 评分结果 */}
        {currentQuestion?.ai_evaluation && (
          <AnswerEvaluation evaluation={currentQuestion.ai_evaluation} />
        )}

        {/* 导航按钮 */}
        <div className="flex gap-4">
          <button
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="flex-1 py-3 border border-outline-variant text-on-surface rounded-xl font-label-bold disabled:opacity-50"
          >上一题</button>
          <button
            onClick={() => {
              if (currentIndex < questions.length - 1) {
                setCurrentIndex((prev) => prev + 1);
              } else if (progress.allEvaluated) {
                setShowSummary(true);
              }
            }}
            disabled={
              currentIndex < questions.length - 1 &&
              currentQuestion?.status !== "evaluated"
            }
            className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-label-bold disabled:opacity-50"
          >
            {currentIndex < questions.length - 1 ? "下一题" : "完成今日特训"}
          </button>
        </div>
      </div>
    </div>
  );
}

function getDifficultyLabel(day: number): string {
  switch (day) {
    case 1:
      return "基础";
    case 2:
      return "进阶";
    case 3:
      return "实战";
    default:
      return "基础";
  }
}
