"use client";

import { AIEvaluation } from "@/types/bootcamp";

interface Props {
  evaluation: AIEvaluation;
}

export default function AnswerEvaluation({ evaluation }: Props) {
  const dimensions = [
    { key: "structure", label: "结构化", score: evaluation.structure },
    { key: "logic", label: "逻辑性", score: evaluation.logic },
    { key: "professionalism", label: "专业度", score: evaluation.professionalism },
    { key: "innovation", label: "创新性", score: evaluation.innovation },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-success";
    if (score >= 6) return "text-warning";
    return "text-error";
  };

  return (
    <div className="bg-surface-container p-6 rounded-xl space-y-6">
      {/* 总分 */}
      <div className="text-center">
        <div
          className={`text-display-lg font-bold ${getScoreColor(evaluation.overall_score)}`}
        >
          {evaluation.overall_score}
        </div>
        <p className="text-body-sm text-on-surface-variant">综合评分 / 10</p>
      </div>

      {/* 维度拆解 */}
      <div className="grid grid-cols-2 gap-3">
        {dimensions.map((dim) => (
          <div key={dim.key} className="bg-surface p-3 rounded-lg text-center">
            <div
              className={`text-headline-sm font-bold ${getScoreColor(dim.score)}`}
            >
              {dim.score}
            </div>
            <p className="text-label-sm text-on-surface-variant">{dim.label}</p>
          </div>
        ))}
      </div>

      {/* 评价反馈 */}
      <div className="space-y-4">
        <div>
          <h4 className="font-label-bold text-on-surface mb-2">总体评价</h4>
          <p className="text-body-md text-on-surface-variant">{evaluation.feedback}</p>
        </div>

        {evaluation.strengths?.length > 0 && (
          <div>
            <h4 className="font-label-bold text-success mb-2">亮点</h4>
            <ul className="space-y-1">
              {evaluation.strengths.map((s, idx) => (
                <li
                  key={idx}
                  className="text-body-sm text-on-surface-variant flex items-start gap-2"
                >
                  <span className="text-success mt-1">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {evaluation.gaps?.length > 0 && (
          <div>
            <h4 className="font-label-bold text-error mb-2">不足</h4>
            <ul className="space-y-1">
              {evaluation.gaps.map((g, idx) => (
                <li
                  key={idx}
                  className="text-body-sm text-on-surface-variant flex items-start gap-2"
                >
                  <span className="text-error mt-1">✗</span>
                  {g}
                </li>
              ))}
            </ul>
          </div>
        )}

        {evaluation.suggestions?.length > 0 && (
          <div className="bg-primary-container p-4 rounded-lg">
            <h4 className="font-label-bold text-on-primary-container mb-2">改进建议</h4>
            <ul className="space-y-1">
              {evaluation.suggestions.map((s, idx) => (
                <li
                  key={idx}
                  className="text-body-sm text-on-primary-container flex items-start gap-2"
                >
                  <span className="mt-1">→</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
