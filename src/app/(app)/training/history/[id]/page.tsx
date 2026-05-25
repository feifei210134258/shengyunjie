"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function HistoryDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/training/history/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setRecord(data.record);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="animate-spin w-8 h-8 border-3 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen flex items-center justify-center text-on-surface-variant">
        记录不存在或无权查看
      </div>
    );
  }

  const analysis = record.ai_feedback?.analysis || "";
  const score = record.score ? Math.round(record.score / 10) : 0;

  // 解析诊断和建议
  const extractSections = (text: string) => {
    const diagnosisMatch = text.match(/#{1,2}\s*诊断[\s\S]*?(?=#{1,2}\s*建议|$)/i);
    const suggestionMatch = text.match(/#{1,2}\s*建议[\s\S]*?(?=#{1,2}|$)/i);
    return {
      diagnosis: diagnosisMatch ? diagnosisMatch[0].replace(/^#{1,2}\s*诊断\s*/, "").trim() : text,
      suggestion: suggestionMatch ? suggestionMatch[0].replace(/^#{1,2}\s*建议\s*/, "").trim() : "",
    };
  };

  const sections = extractSections(analysis);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1040px] mx-auto py-8 px-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* 标题 */}
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-primary-fixed text-on-primary-fixed-variant font-label-bold text-xs rounded uppercase">
              {record.dimension}
            </span>
            {score > 0 && (
              <span className="px-3 py-1 bg-secondary-fixed text-on-secondary-fixed-variant font-label-bold text-xs rounded uppercase">
                评分：{score}/10
              </span>
            )}
            <span className="text-body-sm text-on-surface-variant">
              {new Date(record.created_at).toLocaleDateString("zh-CN")}
            </span>
          </div>

          {/* 题目 */}
          <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl">
            <h3 className="text-label-bold text-on-surface-variant mb-3">题目</h3>
            <div className="text-base text-on-surface leading-snug">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{record.question_scenario}</ReactMarkdown>
            </div>
          </div>

          {/* 用户答案 */}
          <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl">
            <h3 className="text-label-bold text-on-surface-variant mb-3">你的回答</h3>
            <div className="text-sm text-on-surface leading-snug whitespace-pre-wrap">
              {record.user_answer}
            </div>
          </div>

          {/* AI 分析 */}
          {analysis && (
            <div className="bg-surface-container-lowest border border-primary/20 rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
                <div className="text-sm text-on-surface font-bold">AI 深度解析</div>
              </div>

              {sections.diagnosis && (
                <section className="mb-4">
                  <div className="text-sm text-on-surface flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">analytics</span>
                    诊断
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-4 border border-outline-variant/30">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{sections.diagnosis}</ReactMarkdown>
                  </div>
                </section>
              )}

              {sections.suggestion && (
                <section>
                  <div className="text-sm text-on-surface flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">lightbulb</span>
                    建议
                  </div>
                  <div className="bg-primary-fixed/20 rounded-lg p-4 border border-primary-fixed/40">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{sections.suggestion}</ReactMarkdown>
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
