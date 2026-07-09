"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import InterviewQuestion from "@/components/bootcamp/InterviewQuestion";
import AnswerEvaluation from "@/components/bootcamp/AnswerEvaluation";
import DailySummary from "@/components/bootcamp/DailySummary";
import { InterviewQuestion as InterviewQuestionType } from "@/types/bootcamp";
import {
  calculateDayProgress,
  canAdvanceFromQuestion,
  isQuestionEvaluated,
} from "@/lib/bootcamp";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { PageSpinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface TargetEvidenceFocus {
  projectName: string;
  company: string;
  role: string;
  targetEvidence: string;
  finalInterviewAnswer?: string;
  targetFit?: {
    score: number | null;
    priorityLabel: string;
    reason: string;
  } | null;
}

export default function BootcampInterviewPage() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <BootcampInterviewContent />
    </Suspense>
  );
}

function BootcampInterviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const interviewFocus =
    searchParams.get("focus") === "target_evidence" ? "target_evidence" : "";
  const [questions, setQuestions] = useState<InterviewQuestionType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentDay, setCurrentDay] = useState(1);
  const [targetEvidenceFocus, setTargetEvidenceFocus] =
    useState<TargetEvidenceFocus | null>(null);
  const [validationSnapshot, setValidationSnapshot] = useState<any>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isRegeneratingEvaluation, setIsRegeneratingEvaluation] =
    useState(false);
  const [loading, setLoading] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchQuestions() {
      const focusQuery = interviewFocus ? `&focus=${interviewFocus}` : "";
      const res = await fetch(`/api/bootcamp/interview?day=${currentDay}${focusQuery}`);
      const data = await res.json();
      if (data.questions) {
        setQuestions(data.questions);
      }
      setTargetEvidenceFocus(data.targetEvidenceFocus || null);
      setLoading(false);
    }
    fetchQuestions();
  }, [currentDay, interviewFocus]);

  const handleSubmitAnswer = async (answer: string) => {
    const question = questions[currentIndex];
    if (!question) return;

    setIsEvaluating(true);
    setError("");
    try {
      const res = await fetch("/api/bootcamp/interview/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interview_id: question.id, answer, interviewFocus }),
      });

      const data = await res.json();
      if (res.ok && data.evaluation) {
        const updated = [...questions];
        updated[currentIndex] = {
          ...question,
          user_answer: answer,
          ai_evaluation: data.evaluation,
          status: "evaluated",
        };
        setQuestions(updated);
        setValidationSnapshot(data.validationSnapshot || null);
        return;
      }

      setError(data.error || "评分失败，请稍后重试");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleRegenerateEvaluation = async () => {
    const question = questions[currentIndex];
    if (!question) return;

    setIsRegeneratingEvaluation(true);
    setError("");
    try {
      const res = await fetch("/api/bootcamp/interview/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interview_id: question.id, interviewFocus }),
      });

      const data = await res.json();
      if (res.ok && data.evaluation) {
        const updated = [...questions];
        updated[currentIndex] = {
          ...question,
          ai_evaluation: data.evaluation,
          status: "evaluated",
        };
        setQuestions(updated);
        setValidationSnapshot(data.validationSnapshot || null);
        return;
      }

      setError(data.error || "重新生成反馈失败，请稍后重试");
    } finally {
      setIsRegeneratingEvaluation(false);
    }
  };

  const handleNextDay = async () => {
    if (currentDay >= 3) {
      await fetch("/api/bootcamp/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_type: "comprehensive" }),
      });
      router.push("/bootcamp/report");
      return;
    }

    await fetch("/api/bootcamp/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report_type: "daily", day_number: currentDay }),
    });

    const nextDay = currentDay + 1;
    await fetch("/api/bootcamp/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day_number: nextDay, interviewFocus }),
    });

    setCurrentDay(nextDay);
    setCurrentIndex(0);
    setShowSummary(false);
    setLoading(true);

    const focusQuery = interviewFocus ? `&focus=${interviewFocus}` : "";
    const res = await fetch(`/api/bootcamp/interview?day=${nextDay}${focusQuery}`);
    const data = await res.json();
    if (data.questions) {
      setQuestions(data.questions);
    }
    setTargetEvidenceFocus(data.targetEvidenceFocus || null);
    setLoading(false);
  };

  if (loading) {
    return <PageSpinner />;
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
      <>
        <PageHeader title={`Day ${currentDay} 完成`} backHref="/bootcamp" />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <DailySummary
            dayNumber={currentDay}
            averageScore={avgScore}
            onContinue={handleNextDay}
            isLastDay={currentDay >= 3}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`Day ${currentDay} / ${getDifficultyLabel(currentDay)}`}
        subtitle={`第 ${currentIndex + 1} / ${questions.length} 题`}
        backHref="/bootcamp"
      />

      <div className="mx-auto grid max-w-[1480px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(360px,0.82fr)_minmax(560px,1.18fr)] lg:px-8">
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          {targetEvidenceFocus && (
            <section className="rounded-xl border border-primary/20 bg-primary-soft p-4">
              <p className="text-label font-bold text-primary">
                {targetEvidenceFocus.finalInterviewAnswer
                  ? "终版表达复述"
                  : "目标证据追问"}
              </p>
              <h2 className="mt-2 text-heading-sm font-bold text-ink">
                {targetEvidenceFocus.finalInterviewAnswer ? "模拟复述" : "高压追问"}：
                {targetEvidenceFocus.projectName}
              </h2>
              {targetEvidenceFocus.finalInterviewAnswer && (
                <div className="mt-3 rounded-lg bg-surface-raised px-3 py-3">
                  <p className="text-label font-bold text-primary">
                    终版面试表达
                  </p>
                  <p className="mt-1 text-body-sm leading-relaxed text-ink-muted">
                    {targetEvidenceFocus.finalInterviewAnswer}
                  </p>
                </div>
              )}
              <p className="mt-2 text-body-sm leading-relaxed text-ink-muted">
                {targetEvidenceFocus.targetEvidence}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-label font-bold">
                <span className="rounded-md bg-surface-raised px-2.5 py-1 text-primary">
                  {targetEvidenceFocus.targetFit?.priorityLabel || "已入账"}
                </span>
                {targetEvidenceFocus.targetFit?.score != null && (
                  <span className="rounded-md bg-surface-raised px-2.5 py-1 text-ink">
                    目标匹配 {targetEvidenceFocus.targetFit.score}/10
                  </span>
                )}
              </div>
              {validationSnapshot && (
                <p className="mt-3 rounded-md bg-surface-raised px-3 py-2 text-label font-bold text-success">
                  验证结果已入账
                </p>
              )}
              {targetEvidenceFocus.finalInterviewAnswer && (
                <p className="mt-3 text-label font-semibold text-ink-muted">
                  先练 90 秒复述，再用追问检查临场稳定度。
                </p>
              )}
            </section>
          )}

          <div className="rounded-xl border border-line bg-surface p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-label font-semibold text-ink-muted">
                今日进度
              </span>
              <span className="font-mono text-label font-semibold text-ink-muted">
                {progress.completed}/{questions.length}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    "h-2.5 rounded-full transition-colors",
                    idx === currentIndex
                      ? "bg-primary"
                      : isQuestionEvaluated(q)
                        ? "bg-success"
                        : "bg-line"
                  )}
                  aria-label={`第 ${idx + 1} 题`}
                />
              ))}
            </div>
          </div>

          {currentQuestion && (
            <InterviewQuestion
              question={currentQuestion}
              onSubmit={handleSubmitAnswer}
              isEvaluating={isEvaluating}
            />
          )}

          {error && (
            <div className="rounded-xl border border-danger/20 bg-danger-soft p-4 text-body-sm text-danger">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
            >
              上一题
            </Button>
            <Button
              fullWidth
              onClick={() => {
                if (currentIndex < questions.length - 1) {
                  setCurrentIndex((prev) => prev + 1);
                } else if (progress.allEvaluated) {
                  setShowSummary(true);
                }
              }}
              disabled={
                currentIndex < questions.length - 1 &&
                !canAdvanceFromQuestion(currentQuestion)
              }
            >
              {currentIndex < questions.length - 1
                ? "下一题"
                : "完成今日特训"}
            </Button>
          </div>
        </aside>

        <main className="min-w-0">
          {currentQuestion?.ai_evaluation ? (
            <AnswerEvaluation
              evaluation={currentQuestion.ai_evaluation}
              onRegenerate={handleRegenerateEvaluation}
              isRegenerating={isRegeneratingEvaluation}
            />
          ) : (
            <section className="rounded-xl border border-line bg-surface p-6">
              <p className="text-label font-semibold text-primary">
                作答抓手
              </p>
              <h2 className="mt-2 text-heading-lg font-semibold text-ink">
                先把面试官想听的证据摆上桌
              </h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {[
                  ["背景", "一句话说明业务目标、用户角色和当时的约束。"],
                  ["证据", "讲清你用了哪些调研、数据或客户现场信息。"],
                  ["取舍", "至少对比两个方案，说出选择和放弃的理由。"],
                  ["结果", "用指标、反馈或复盘说明这个判断是否成立。"],
                ].map(([title, description]) => (
                  <div
                    key={title}
                    className="rounded-lg bg-surface-raised p-4"
                  >
                    <h3 className="font-semibold text-ink">{title}</h3>
                    <p className="mt-2 text-body-sm leading-relaxed text-ink-muted">
                      {description}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </>
  );
}

function getDifficultyLabel(day: number): string {
  switch (day) {
    case 1: return "基础";
    case 2: return "进阶";
    case 3: return "实战";
    default: return "基础";
  }
}
