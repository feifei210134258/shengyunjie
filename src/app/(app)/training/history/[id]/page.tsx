"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageSpinner } from "@/components/ui/spinner";
import TrainingEvaluationPanel from "@/components/training/TrainingEvaluationPanel";
import { normalizeTrainingEvaluation } from "@/lib/training/personalization";
import { Sparkles, Activity, Lightbulb, BookOpen, FileCheck2, Target, PenLine } from "lucide-react";

export default function HistoryDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const shouldOpenRevision = searchParams.get("revise") === "1";

  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [revisionText, setRevisionText] = useState("");
  const [revisionStatus, setRevisionStatus] = useState<
    "idle" | "saving" | "saved" | "failed"
  >("idle");
  const [revisionProfileStatus, setRevisionProfileStatus] = useState<
    "idle" | "syncing" | "saved" | "failed"
  >("idle");
  const revisionEditorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/training/history/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setRecord(data.record);
        const savedRevision = data.record?.ai_feedback?.__revision;
        setRevisionText(
          savedRevision && typeof savedRevision.revisedAnswer === "string"
            ? savedRevision.revisedAnswer
            : ""
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!shouldOpenRevision || loading) return;
    revisionEditorRef.current?.focus();
    revisionEditorRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [loading, shouldOpenRevision]);

  if (loading) {
    return <PageSpinner />;
  }

  if (!record) {
    return (
      <>
        <PageHeader title="训练记录" backHref="/training" />
        <div className="min-h-[60vh] flex items-center justify-center text-ink-muted">
          记录不存在或无权查看
        </div>
      </>
    );
  }

  const hasStructuredEvaluation =
    record.ai_feedback?.overall_score != null || record.ai_feedback?.scores;
  const evaluation = hasStructuredEvaluation
    ? normalizeTrainingEvaluation(record.ai_feedback)
    : null;
  const analysis = record.ai_feedback?.analysis || "";
  const score = record.score ? Math.round((record.score / 10) * 10) / 10 : 0;
  const isCaseSimulation = record.ai_feedback?.source === "case_simulation";
  const sourceLabel = isCaseSimulation ? "案例推演" : "日常训练";
  const productName = record.ai_feedback?.product;
  const revision = record.ai_feedback?.__revision;
  const revisedAnswer =
    revision && typeof revision.revisedAnswer === "string"
      ? revision.revisedAnswer
      : "";
  const revisionSavedAt =
    revision && typeof revision.savedAt === "string" ? revision.savedAt : "";
  const showRevisionWorkbench = shouldOpenRevision || Boolean(revisedAnswer);
  const interviewExpressionCard = record.interviewExpressionCard;

  const handleSaveRevision = async () => {
    const nextRevision = revisionText.trim();
    if (!id || !nextRevision) return;

    setRevisionStatus("saving");
    try {
      const response = await fetch("/api/training/record", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId: id, revisedAnswer: nextRevision }),
      });
      if (!response.ok) throw new Error("二次修正保存失败");

      const result = await response.json();
      const currentRevision = result.revision || {
        revisedAnswer: nextRevision,
        savedAt: new Date().toISOString(),
      };
      setRevisionProfileStatus("syncing");
      try {
        const profileResponse = await fetch("/api/profile/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trigger: "revision_saved",
            trainingRecordId: id,
            dimension: record.dimension,
            revisedAnswer: nextRevision,
          }),
        });
        setRevisionProfileStatus(profileResponse.ok ? "saved" : "failed");
      } catch {
        setRevisionProfileStatus("failed");
      }
      setRecord((current: any) => ({
        ...current,
        ai_feedback: {
          ...(current?.ai_feedback && typeof current.ai_feedback === "object"
            ? current.ai_feedback
            : {}),
          __revision: currentRevision,
        },
      }));
      setRevisionText(currentRevision.revisedAnswer || nextRevision);
      setRevisionStatus("saved");
    } catch {
      setRevisionStatus("failed");
    }
  };

  const extractSections = (text: string) => {
    const diagnosisMatch = text.match(
      /#{1,2}\s*诊断[\s\S]*?(?=#{1,2}\s*建议|$)/i
    );
    const suggestionMatch = text.match(
      /#{1,2}\s*建议[\s\S]*?(?=#{1,2}|$)/i
    );
    return {
      diagnosis: diagnosisMatch
        ? diagnosisMatch[0].replace(/^#{1,2}\s*诊断\s*/, "").trim()
        : text,
      suggestion: suggestionMatch
        ? suggestionMatch[0].replace(/^#{1,2}\s*建议\s*/, "").trim()
        : "",
    };
  };

  const sections = extractSections(analysis);

  return (
    <>
      <PageHeader
        title="复盘归档"
        subtitle="把一次作答沉淀成可复用的判断框架"
        backHref="/training"
      />

      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-6 rounded-xl border border-line bg-surface-raised px-5 py-4 shadow-xs">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge>{sourceLabel}</Badge>
                <Badge variant="neutral">{record.dimension}</Badge>
                {productName && <Badge variant="outline">{productName}</Badge>}
                {score > 0 && <Badge variant="success">评分：{score}/10</Badge>}
              </div>
              <h1 className="line-clamp-2 text-heading-lg font-bold text-ink">
                {record.ai_feedback?.scenario_title ||
                  record.question_scenario.replace(/\n/g, " ").slice(0, 82)}
              </h1>
              <p className="mt-2 text-body-sm text-ink-muted">
                {new Date(record.created_at).toLocaleString("zh-CN")}
              </p>
            </div>
            <div className="grid min-w-[280px] grid-cols-3 gap-2">
              <div className="rounded-lg bg-surface px-3 py-2">
                <p className="text-label font-bold text-ink-muted">来源</p>
                <p className="mt-1 text-body-sm font-semibold text-ink">
                  {sourceLabel}
                </p>
              </div>
              <div className="rounded-lg bg-surface px-3 py-2">
                <p className="text-label font-bold text-ink-muted">难度</p>
                <p className="mt-1 font-mono text-body-sm font-bold text-ink">
                  {record.difficulty || 3}/5
                </p>
              </div>
              <div className="rounded-lg bg-surface px-3 py-2">
                <p className="text-label font-bold text-ink-muted">评分</p>
                <p className="mt-1 font-mono text-body-sm font-bold text-ink">
                  {score || "-"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="space-y-6">
          {/* Question */}
          <Card size="md">
            <div className="mb-3 flex items-center gap-2 text-label font-bold text-ink-muted">
              <BookOpen className="h-4 w-4 text-primary" />
              题目
            </div>
            <div className="text-body-md text-ink leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {record.question_scenario}
              </ReactMarkdown>
            </div>
          </Card>

          {/* User answer */}
          <Card size="md">
            <div className="mb-3 flex items-center gap-2 text-label font-bold text-ink-muted">
              <FileCheck2 className="h-4 w-4 text-secondary" />
              你的回答
            </div>
            <div className="text-body-md text-ink leading-relaxed whitespace-pre-wrap">
              {record.user_answer}
            </div>
          </Card>

          {showRevisionWorkbench && (
            <Card size="md" className="border-primary-muted bg-primary-soft/50">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-label font-bold text-primary">
                  <PenLine className="h-4 w-4" />
                  二次修正
                </div>
                <span className="rounded-md bg-white px-3 py-1.5 text-label font-semibold text-ink-muted">
                  {revisionStatus === "saving"
                    ? "保存中"
                    : revisionStatus === "saved"
                      ? revisionProfileStatus === "saved"
                        ? "已进证据账本"
                        : "已保存"
                      : revisionStatus === "failed"
                        ? "保存失败"
                        : revisionSavedAt
                          ? `最近保存：${new Date(revisionSavedAt).toLocaleString("zh-CN", {
                              hour12: false,
                            })}`
                          : "待修正"}
                </span>
              </div>
              <p className="mb-3 text-body-sm font-semibold text-ink-muted">
                修正版
              </p>
              <textarea
                ref={revisionEditorRef}
                value={revisionText}
                onChange={(event) => {
                  setRevisionText(event.target.value);
                  setRevisionStatus("idle");
                }}
                className="min-h-[180px] w-full resize-none rounded-lg border border-primary-muted bg-white/80 p-4 text-body-md leading-7 text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                placeholder="基于 AI 反馈重写：关键判断、依据、取舍、验证指标..."
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-label font-semibold text-ink-muted">
                  {revisionProfileStatus === "saved"
                    ? "二次修正已进入能力证据账本"
                    : revisionProfileStatus === "failed"
                      ? "修正已保存，画像证据稍后可刷新"
                      : "从复盘队列进入时，先补这一版，再继续开新题。"}
                </p>
                <button
                  onClick={handleSaveRevision}
                  disabled={!revisionText.trim() || revisionStatus === "saving"}
                  className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-body-sm font-semibold text-white transition hover:bg-ink/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                >
                  <PenLine className="h-4 w-4" />
                  保存二次修正
                </button>
              </div>
            </Card>
          )}
          </div>

          {/* AI analysis */}
          <div className="space-y-6">
          {interviewExpressionCard && (
            <Card size="md" className="border-primary-muted bg-white">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-label font-bold text-primary">
                    面试表达卡
                  </p>
                  <h2 className="mt-1 text-heading-sm font-bold text-ink">
                    把这次训练讲成一段高级 PM 回答
                  </h2>
                </div>
                <Badge
                  variant={
                    interviewExpressionCard.readiness === "面试可用"
                      ? "success"
                      : "neutral"
                  }
                >
                  {interviewExpressionCard.readiness}
                </Badge>
              </div>

              <div className="grid gap-3">
                <div className="rounded-lg bg-surface px-4 py-3">
                  <p className="text-label font-bold text-ink-muted">
                    开场判断
                  </p>
                  <p className="mt-1 text-body-sm leading-6 text-ink">
                    {interviewExpressionCard.openingClaim}
                  </p>
                </div>
                <div className="rounded-lg bg-surface px-4 py-3">
                  <p className="text-label font-bold text-ink-muted">
                    证据抓手
                  </p>
                  <p className="mt-1 text-body-sm leading-6 text-ink">
                    {interviewExpressionCard.proofPoint}
                  </p>
                </div>
                <div className="rounded-lg bg-warning-soft px-4 py-3">
                  <p className="text-label font-bold text-warning">
                    追问风险
                  </p>
                  <p className="mt-1 text-body-sm leading-6 text-ink">
                    {interviewExpressionCard.followupRisk}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-line bg-surface-raised p-4">
                <p className="text-label font-bold text-ink-muted">
                  可复制表达版本
                </p>
                <p className="mt-2 text-body-sm leading-6 text-ink">
                  {interviewExpressionCard.copyScript}
                </p>
              </div>
            </Card>
          )}

          {evaluation && (
            <div className="grid gap-3 sm:grid-cols-3">
              <Card size="sm" className="bg-primary-soft">
                <p className="text-label font-bold text-primary">下一步</p>
                <p className="mt-2 line-clamp-3 text-body-sm text-ink">
                  {evaluation.next_practice}
                </p>
              </Card>
              <Card size="sm">
                <p className="text-label font-bold text-ink-muted">最该补</p>
                <p className="mt-2 line-clamp-3 text-body-sm text-ink">
                  {evaluation.gaps[0]}
                </p>
              </Card>
              <Card size="sm">
                <p className="text-label font-bold text-ink-muted">可复用框架</p>
                <p className="mt-2 line-clamp-3 text-body-sm text-ink">
                  {evaluation.thinking_framework[0]}
                </p>
              </Card>
            </div>
          )}

          {(analysis || evaluation) && (
            <Card size="md" className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
              <div className="flex items-center gap-2 mb-4 pt-1">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-body-md font-bold text-ink">
                  AI 深度解析
                </span>
              </div>

              {evaluation ? (
                <TrainingEvaluationPanel evaluation={evaluation} />
              ) : (
                <>
                  {sections.diagnosis && (
                    <section className="mb-4">
                      <div className="text-body-sm text-ink flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-primary" />
                        诊断
                      </div>
                      <div className="bg-surface rounded-xl p-4 border border-line">
                        <div className="markdown-content text-body-sm">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {sections.diagnosis}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </section>
                  )}

                  {sections.suggestion && (
                    <section>
                      <div className="text-body-sm text-ink flex items-center gap-2 mb-2">
                        <Lightbulb className="w-4 h-4 text-primary" />
                        建议
                      </div>
                      <div className="bg-primary-soft rounded-xl p-4 border border-primary-muted">
                        <div className="markdown-content text-body-sm">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {sections.suggestion}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </section>
                  )}
                </>
              )}
            </Card>
          )}

          {record.ai_feedback?.hidden_risks?.length > 0 && (
            <Card size="md">
              <div className="mb-3 flex items-center gap-2 text-label font-bold text-ink-muted">
                <Target className="h-4 w-4 text-warning" />
                案例推演隐藏风险
              </div>
              <div className="space-y-2">
                {record.ai_feedback.hidden_risks.map((risk: string) => (
                  <p
                    key={risk}
                    className="rounded-lg bg-warning-soft px-3 py-2 text-body-sm text-ink"
                  >
                    {risk}
                  </p>
                ))}
              </div>
            </Card>
          )}
          </div>
        </div>
      </div>
    </>
  );
}
