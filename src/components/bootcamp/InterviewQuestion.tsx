"use client";

import { useState } from "react";
import { InterviewQuestion as InterviewQuestionType } from "@/types/bootcamp";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface Props {
  question: InterviewQuestionType;
  onSubmit: (answer: string) => void;
  isEvaluating: boolean;
}

const typeLabels: Record<string, string> = {
  strategy: "战略思维",
  system_design: "系统设计",
  data_driven: "数据驱动",
  user_insight: "用户洞察",
  business_thinking: "商业思维",
};

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

  return (
    <div className="space-y-5">
      <Card variant="subtle" size="md">
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="default">
            {typeLabels[question.question_type] || question.question_type}
          </Badge>
          <Badge variant="neutral">
            难度 {question.difficulty}/5
          </Badge>
        </div>
        <h3 className="text-body-lg font-semibold text-ink">
          {question.question_text}
        </h3>
      </Card>

      {question.ai_evaluation && question.user_answer ? (
        <Card variant="subtle" size="sm">
          <p className="text-label font-semibold text-ink-muted">你的原回答</p>
          <p className="mt-2 whitespace-pre-wrap text-body-sm leading-relaxed text-ink-muted">
            {question.user_answer}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          <Textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="请详细阐述你的思路和解决方案..."
            rows={12}
          />

          {warning && (
            <div className="flex items-center gap-2 text-warning text-body-sm">
              <AlertTriangle className="w-4 h-4" />
              {warning}
            </div>
          )}

          <Button
            fullWidth
            onClick={handleSubmit}
            disabled={isEvaluating || !answer.trim()}
            loading={isEvaluating}
          >
            {isEvaluating ? "AI 评分中..." : "提交回答"}
          </Button>
        </div>
      )}
    </div>
  );
}
