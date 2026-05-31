"use client";

import { useState } from "react";
import { InterviewQuestion as InterviewQuestionType } from "@/types/bootcamp";

interface Props {
  question: InterviewQuestionType;
  onSubmit: (answer: string) => void;
  isEvaluating: boolean;
}

export default function InterviewQuestion({
  question,
  onSubmit,
  isEvaluating,
}: Props) {
  const [answer, setAnswer] = useState(question.user_answer || "");
  const [warning, setWarning] = useState("");

  const handleSubmit = () => {
    if (answer.length < 20) {
      setWarning("回答过于简短，建议详细阐述你的思路");
      return;
    }
    setWarning("");
    onSubmit(answer);
  };

  const typeLabels: Record<string, string> = {
    strategy: "战略思维",
    system_design: "系统设计",
    data_driven: "数据驱动",
    user_insight: "用户洞察",
    business_thinking: "商业思维",
  };

  return (
    <div className="space-y-6">
      {/* 题目卡片 */}
      <div className="bg-surface-container p-6 rounded-xl">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-2 py-1 bg-secondary-container text-on-secondary-container rounded text-label-sm">
            {typeLabels[question.question_type] || question.question_type}
          </span>
          <span className="px-2 py-1 bg-tertiary-container text-on-tertiary-container rounded text-label-sm">
            难度 {question.difficulty}/5
          </span>
        </div>
        <h3 className="text-headline-sm font-bold text-on-surface">{question.question_text}</h3>
      </div>

      {/* 作答区 */}
      {!question.ai_evaluation && (
        <div className="space-y-3">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="请详细阐述你的思路和解决方案..."
            className="w-full h-48 p-4 bg-surface-container rounded-xl border border-outline-variant text-on-surface placeholder-on-surface-variant resize-none focus:outline-none focus:border-primary"
          />

          {warning && (
            <div className="flex items-center gap-2 text-warning text-body-sm">
              <span className="material-symbols-outlined">warning</span>
              {warning}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isEvaluating || !answer.trim()}
            className="w-full py-3 bg-primary text-on-primary rounded-xl font-label-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEvaluating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-5 w-5 border-2 border-on-primary border-t-transparent" />
                AI 评分中...
              </span>
            ) : (
              "提交回答"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
