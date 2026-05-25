"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const ALL_DIMS = [
  "战略思维",
  "系统设计能力",
  "数据决策能力",
  "用户洞察与需求管理",
  "商业思维",
];

const DIM_LABELS: Record<string, string> = {
  "战略思维": "策略选题",
  "系统设计能力": "架构设计",
  "数据决策能力": "数据驱动",
  "用户洞察与需求管理": "用户研究",
  "商业思维": "商业分析",
};

export default function TrainingSessionPage() {
  const router = useRouter();

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentDim = ALL_DIMS[currentIndex];

  const [questions, setQuestions] = useState<Record<string, { text: string; loading: boolean }>>({});
  const [answers, setAnswers] = useState<Record<string, { text: string; submitting: boolean }>>({});
  const [analyses, setAnalyses] = useState<Record<string, { text: string; loading: boolean }>>({});

  const [difficulty, setDifficulty] = useState<string>("");
  const [score, setScore] = useState<number>(0);

  const [round, setRound] = useState(1);

  useEffect(() => {
    if (!questions[currentDim]?.text && !questions[currentDim]?.loading) {
      generateQuestion(currentDim);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  const generateQuestion = useCallback(async (dim: string) => {
    setQuestions((prev) => ({ ...prev, [dim]: { text: "", loading: true } }));

    try {
      const res = await fetch("/api/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", dimension: dim }),
      });
      if (!res.body) throw new Error("无响应");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("0:")) {
            try {
              const t = JSON.parse(line.slice(2));
              if (typeof t === "string") {
                text += t;
                setQuestions((prev) => ({ ...prev, [dim]: { text, loading: true } }));
              }
            } catch {}
          }
        }
      }

      setQuestions((prev) => ({ ...prev, [dim]: { text, loading: false } }));

      // 解析难度标签
      const diffMatch = text.match(/【难度：(初级|中级|高级)】/);
      if (diffMatch) {
        setDifficulty(diffMatch[1]);
      }

      if (text) {
        fetch("/api/training/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dimension: dim, question: text }),
        }).catch(() => {});
      }
    } catch {
      setQuestions((prev) => ({
        ...prev,
        [dim]: { text: "（出题失败，请重新出题）", loading: false },
      }));
    }
  }, []);

  const handleSubmit = async () => {
    const answerText = answers[currentDim]?.text?.trim();
    if (!answerText) return;
    const q = questions[currentDim]?.text;
    if (!q || q.startsWith("（出题失败")) return;

    setAnswers((prev) => ({ ...prev, [currentDim]: { text: answerText, submitting: true } }));
    setAnalyses((prev) => ({ ...prev, [currentDim]: { text: "", loading: true } }));

    try {
      const res = await fetch("/api/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "analyze", question: q, userAnswer: answerText }),
      });
      if (!res.body) throw new Error("无响应");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("0:")) {
            try {
              const text = JSON.parse(line.slice(2));
              if (typeof text === "string") {
                fullText += text;
                setAnalyses((prev) => ({ ...prev, [currentDim]: { text: fullText, loading: true } }));
              }
            } catch {}
          }
        }
      }

      setAnalyses((prev) => ({ ...prev, [currentDim]: { text: fullText, loading: false } }));

      // 提取评分
      const scoreMatch = fullText.match(/【评分：(\\d+)\\/10】/);
      const extractedScore = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;
      setScore(extractedScore);

      await fetch("/api/training/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dimension: currentDim,
          question_scenario: q,
          user_answer: answerText,
          ai_feedback: { analysis: fullText, score: extractedScore },
          score: extractedScore,
        }),
      });
    } catch {
      setAnalyses((prev) => ({
        ...prev,
        [currentDim]: { text: "AI 分析暂时不可用，请稍后再试。", loading: false },
      }));
    } finally {
      setAnswers((prev) => ({ ...prev, [currentDim]: { text: answerText, submitting: false } }));
    }
  };

  const handleNext = () => {
    if (currentIndex < ALL_DIMS.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setScore(0);
      setDifficulty("");
    } else {
      // 完成一轮，触发 session 闭环
      const roundQuestions = ALL_DIMS.map((d) => questions[d]?.text).filter(Boolean);
      if (roundQuestions.length > 0) {
        fetch("/api/training/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questions: roundQuestions }),
        }).catch(() => {});
      }

      setRound((r) => r + 1);
      setCurrentIndex(0);
      setQuestions({});
      setAnswers({});
      setAnalyses({});
      setScore(0);
      setDifficulty("");
    }
  };

  const handleFinish = () => router.push("/training");

  const handleFeedback = async (type: "up" | "down") => {
    const q = questions[currentDim]?.text;
    if (!q) return;
    await fetch("/api/training/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question_text: q, feedback_type: type }),
    }).catch(() => {});
  };

  const handleRegenerate = () => {
    setAnswers((prev) => ({ ...prev, [currentDim]: { text: "", submitting: false } }));
    setAnalyses((prev) => ({ ...prev, [currentDim]: { text: "", loading: false } }));
    generateQuestion(currentDim);
  };

  const qState = questions[currentDim];
  const aState = answers[currentDim];
  const analysisState = analyses[currentDim];
  const hasAnalysis = !!analysisState?.text && !analysisState.loading;
  const isLast = currentIndex === ALL_DIMS.length - 1;

  // 从分析文本中提取诊断和建议
  const extractSections = (text: string) => {
    const diagnosisMatch = text.match(/#{1,2}\s*诊断[\s\S]*?(?=#{1,2}\s*建议|$)/i);
    const suggestionMatch = text.match(/#{1,2}\s*建议[\s\S]*?(?=#{1,2}|$)/i);
    return {
      diagnosis: diagnosisMatch ? diagnosisMatch[0].replace(/^#{1,2}\s*诊断\s*/, "").trim() : text,
      suggestion: suggestionMatch ? suggestionMatch[0].replace(/^#{1,2}\s*建议\s*/, "").trim() : "",
    };
  };

  const sections = hasAnalysis ? extractSections(analysisState.text) : { diagnosis: "", suggestion: "" };

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <header className="bg-surface/80 backdrop-blur-md fixed top-0 right-0 left-[280px] z-40 border-b border-outline-variant flex justify-between items-center h-16 px-6">
        <div className="flex items-center gap-4">
          <span className="text-body-md text-primary font-bold">日常训练</span>
        </div>
        <button
          onClick={handleFinish}
          className="px-4 py-2 text-xs text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-lg transition-colors"
        >
          结束训练
        </button>
      </header>

      {/* 主内容 */}
      <div className="mt-16 bg-surface flex-1 overflow-y-auto min-h-screen">
        <div className="max-w-[1040px] mx-auto py-4 px-6">
          <div className="max-w-3xl mx-auto">
            {/* 标题行 */}
            <div className="flex justify-between items-end mb-2">
              <div className="space-y-1">
                <span className="text-primary font-label-bold uppercase tracking-widest text-xs">每日挑战</span>
                <div className="text-on-surface text-sm font-bold">第 {currentIndex + 1} / {ALL_DIMS.length} 题</div>
              </div>
              <div className="flex gap-1.5 pb-2">
                {ALL_DIMS.map((_, i) => (
                  <div
                    key={i}
                    className={`w-8 h-1.5 rounded-full ${
                      i < currentIndex ? "bg-primary" : i === currentIndex ? "bg-primary" : "bg-surface-container-highest"
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-secondary-container/30 text-on-secondary-container rounded-full w-fit">
                <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                  local_fire_department
                </span>
                <span className="font-label-bold text-[10px]">已连续训练 12 天</span>
              </div>
            </div>

            {/* 题目卡片 */}
            <div className="bg-surface-container-lowest border border-outline-variant p-3 rounded-xl shadow-sm relative overflow-hidden ring-1 ring-black/5 mb-2">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
              <div className="flex items-center gap-sm mb-2">
                <span className="px-2.5 py-0.5 bg-primary-fixed text-on-primary-fixed-variant font-label-bold text-[10px] rounded uppercase">
                  {DIM_LABELS[currentDim] || "选题"}
                </span>
                <span className="px-2.5 py-0.5 bg-tertiary-fixed text-on-tertiary-fixed-variant font-label-bold text-[10px] rounded uppercase">
                  能力维度：{currentDim}
                </span>
                {difficulty && (
                  <span className="px-2.5 py-0.5 bg-secondary-fixed text-on-secondary-fixed-variant font-label-bold text-[10px] rounded uppercase">
                    {difficulty}
                  </span>
                )}
                <div className="flex-1" />
                <button
                  onClick={handleRegenerate}
                  disabled={qState?.loading}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-lg transition-colors disabled:opacity-40"
                >
                  <span className={`material-symbols-outlined text-sm ${qState?.loading ? "animate-spin" : ""}`}>
                    refresh
                  </span>
                  {qState?.loading ? "出题中..." : "重新出题"}
                </button>
              </div>

              {qState?.loading && !qState.text ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-4 bg-surface-container-high rounded w-full" />
                  <div className="h-4 bg-surface-container-high rounded w-5/6" />
                  <div className="h-4 bg-surface-container-high rounded w-4/6" />
                </div>
              ) : (
                <>
                  <div className="text-base text-on-surface mb-2 leading-snug font-bold">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{qState?.text || ""}</ReactMarkdown>
                  </div>
                  {/* 反馈按钮 */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-on-surface-variant">题目质量：</span>
                    <button
                      onClick={() => handleFeedback("up")}
                      className="p-1 hover:bg-surface-container-high rounded transition-colors"
                      title="好题"
                    >
                      <span className="material-symbols-outlined text-sm">thumb_up</span>
                    </button>
                    <button
                      onClick={() => handleFeedback("down")}
                      className="p-1 hover:bg-surface-container-high rounded transition-colors"
                      title="需要改进"
                    >
                      <span className="material-symbols-outlined text-sm">thumb_down</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* 答题区 */}
            {!hasAnalysis && (
              <div className="space-y-2">
                <div className="group relative">
                  <textarea
                    value={answers[currentDim]?.text || ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({
                        ...prev,
                        [currentDim]: { text: e.target.value, submitting: false },
                      }))
                    }
                    placeholder="写下你的思考..."
                    rows={4}
                    disabled={aState?.submitting}
                    className="w-full p-3 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-outline-variant/60 shadow-inner resize-none disabled:opacity-60"
                  />
                  <div className="absolute bottom-4 right-4 text-outline-variant font-label-bold text-xs pointer-events-none group-focus-within:text-primary/50">
                    支持 Markdown 格式
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleSubmit}
                    disabled={!answers[currentDim]?.text?.trim() || aState?.submitting || qState?.loading}
                    className="px-8 py-3 bg-primary text-on-primary hover:bg-primary-container transition-all font-label-bold text-body-md rounded-full flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-40"
                  >
                    {aState?.submitting ? (
                      <>
                        <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        AI 深度思考中...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                          bolt
                        </span>
                        提交并获取 AI 分析
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* AI 分析 */}
            {analysisState?.loading && (
              <div className="bg-surface-container-lowest border border-primary/20 rounded-xl p-6 flex items-center justify-center gap-3">
                <span className="animate-spin w-6 h-6 border-3 border-primary border-t-transparent rounded-full" />
                <span className="text-sm text-on-surface-variant">AI 正在深度思考你的答案...</span>
              </div>
            )}

            {hasAnalysis && (
              <div className="space-y-2">
                {/* AI 分析容器 */}
                <div className="mt-2 bg-surface-container-lowest border border-primary/20 rounded-xl p-3 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      auto_awesome
                    </span>
                    <div className="text-sm text-on-surface font-bold">AI 深度解析</div>
                    {score > 0 && (
                      <span className="ml-auto px-2.5 py-0.5 bg-primary-fixed text-on-primary-fixed-variant font-label-bold text-[10px] rounded-full">
                        评分：{score}/10
                      </span>
                    )}
                  </div>

                  {/* 诊断 */}
                  {sections.diagnosis && (
                    <section className="mb-2">
                      <div className="text-sm text-on-surface flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-primary text-[20px]">analytics</span>
                        诊断
                      </div>
                      <div className="space-y-2">
                        <div className="bg-surface-container-low rounded-lg p-3 border border-outline-variant/30">
                          <div className="text-sm text-on-surface-variant leading-snug">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                h3: ({ children }) => <h5 className="font-label-bold text-secondary flex items-center gap-1 mb-2">{children}</h5>,
                                h4: ({ children }) => <h5 className="font-label-bold text-error flex items-center gap-1 mb-2">{children}</h5>,
                                ul: ({ children }) => <ul className="text-sm text-on-surface-variant list-disc list-inside space-y-1 ml-1">{children}</ul>,
                                li: ({ children }) => <li className="leading-snug">{children}</li>,
                                p: ({ children }) => <p className="text-sm text-on-surface leading-snug mb-2">{children}</p>,
                              }}
                            >
                              {sections.diagnosis}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* 建议 */}
                  {sections.suggestion && (
                    <section>
                      <div className="text-sm text-on-surface flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-primary text-[20px]">lightbulb</span>
                        建议
                      </div>
                      <div className="bg-primary-fixed/20 rounded-lg p-3 border border-primary-fixed/40">
                        <div className="text-sm text-on-surface-variant leading-snug">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              ul: ({ children }) => <ul className="text-sm text-on-surface-variant list-disc list-inside space-y-2 ml-1">{children}</ul>,
                              li: ({ children }) => <li className="leading-snug">{children}</li>,
                              p: ({ children }) => <p className="text-sm text-on-surface-variant leading-snug mb-2">{children}</p>,
                              strong: ({ children }) => <strong className="font-bold text-on-surface">{children}</strong>,
                            }}
                          >
                            {sections.suggestion}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </section>
                  )}
                </div>

                {/* 操作按钮 */}
                <div className="flex justify-between items-center">
                  <button
                    onClick={handleFinish}
                    className="px-6 py-3 text-xs text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-xl transition-colors"
                  >
                    结束训练
                  </button>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleSubmit}
                      disabled={aState?.submitting}
                      className="px-8 py-3 bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-all font-label-bold text-body-md rounded-full flex items-center gap-2 border border-outline-variant disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                        bolt
                      </span>
                      重新分析
                    </button>
                    <button
                      onClick={handleNext}
                      className="px-8 py-3 bg-primary text-on-primary hover:bg-primary-container transition-all font-label-bold text-body-md rounded-full flex items-center gap-2 shadow-lg shadow-primary/20"
                    >
                      {isLast ? "再来一轮" : "下一题"}
                      <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
