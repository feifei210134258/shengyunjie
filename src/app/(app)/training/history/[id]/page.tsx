"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { PageSpinner } from "@/components/ui/spinner";
import TrainingEvaluationPanel from "@/components/training/TrainingEvaluationPanel";
import { normalizeTrainingEvaluation } from "@/lib/training/personalization";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Clipboard,
  FileCheck2,
  Lightbulb,
  PenLine,
  Sparkles,
  Target,
} from "lucide-react";

function ReviewProcessingDesk({
  historyPrimaryAction,
  steps,
  metaItems,
  title,
}: {
  historyPrimaryAction: {
    label: string;
    description: string;
    kind: "revision" | "expression" | "thinking" | "link";
    href: string;
  };
  steps: {
    label: string;
    text: string;
    status: "done" | "current" | "pending";
  }[];
  metaItems: { label: string; value: string }[];
  title: string;
}) {
  return (
    <section className="mb-8 border-b border-line pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/training"
          className="inline-flex items-center gap-2 text-body-sm font-semibold text-ink-muted transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <ArrowLeft className="h-4 w-4" />
          返回训练队列
        </Link>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {metaItems.map((item) => (
            <p key={item.label} className="text-label font-semibold text-ink-muted">
              {item.label}
              <span className="ml-1.5 text-ink">{item.value}</span>
            </p>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
        <div>
          <p className="text-label font-bold text-primary">训练复盘</p>
          <h1 className="mt-2 line-clamp-2 max-w-4xl text-[24px] font-bold leading-8 text-ink">
            {title}
          </h1>
        </div>
        <div className="rounded-lg border border-line bg-white p-4">
          <p className="text-label font-bold text-ink-muted">当前阶段</p>
          <p className="mt-1 text-body-sm font-semibold leading-6 text-ink">
            {historyPrimaryAction.description}
          </p>
          <Link
            href={historyPrimaryAction.href}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-body-sm font-semibold text-white transition hover:bg-primary-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            {historyPrimaryAction.label}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <ol className="mt-5 grid overflow-hidden rounded-lg border border-line bg-white sm:grid-cols-3">
        {steps.map((step, index) => (
          <li
            key={step.label}
            className="border-b border-line px-4 py-3 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
          >
            <div className="flex items-start gap-3">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-label font-bold ${
                  step.status === "done"
                    ? "bg-success-soft text-success"
                    : step.status === "current"
                      ? "bg-primary text-white"
                      : "bg-surface text-ink-muted"
                }`}
              >
                {step.status === "done" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </span>
              <div>
                <p className="text-body-sm font-bold text-ink">{step.label}</p>
                <p className="mt-0.5 text-label leading-5 text-ink-muted">
                  {step.text}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

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
  const [expressionCardStatus, setExpressionCardStatus] = useState<
    "idle" | "saving" | "saved" | "failed"
  >("idle");
  const [thinkingUpgradeStatus, setThinkingUpgradeStatus] = useState<
    "idle" | "saving" | "saved" | "failed"
  >("idle");
  const [copyStatus, setCopyStatus] = useState<
    "idle" | "copied" | "failed"
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
  const revision = record.ai_feedback?.__revision;
  const revisedAnswer =
    revision && typeof revision.revisedAnswer === "string"
      ? revision.revisedAnswer
      : "";
  const revisionSavedAt =
    revision && typeof revision.savedAt === "string" ? revision.savedAt : "";
  const showRevisionWorkbench = true;
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

  const handleSaveExpressionCard = async () => {
    if (!id || !interviewExpressionCard) return;

    setExpressionCardStatus("saving");
    try {
      const response = await fetch("/api/profile/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trigger: "expression_card_saved",
          trainingRecordId: id,
          dimension: record.dimension,
          expressionCard: {
            readiness: interviewExpressionCard.readiness,
            openingClaim: interviewExpressionCard.openingClaim,
            proofPoint: interviewExpressionCard.proofPoint,
            followupRisk: interviewExpressionCard.followupRisk,
          },
        }),
      });
      if (!response.ok) throw new Error("表达卡入账失败");
      const result = await response.json();
      if (!result.snapshot?.id) throw new Error("表达卡未读回快照");
      setExpressionCardStatus("saved");
    } catch {
      setExpressionCardStatus("failed");
    }
  };

  const handleSaveThinkingUpgrade = async () => {
    const thinkingUpgrade = record.ai_feedback?.thinking_upgrade;
    if (!id || !thinkingUpgrade || typeof thinkingUpgrade !== "object") return;

    setThinkingUpgradeStatus("saving");
    try {
      const response = await fetch("/api/profile/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trigger: "thinking_upgrade_saved",
          trainingRecordId: id,
          dimension: record.dimension,
          thinkingUpgrade: {
            judgment_quality: thinkingUpgrade.judgment_quality,
            tradeoff_quality: thinkingUpgrade.tradeoff_quality,
            attribution_depth: thinkingUpgrade.attribution_depth,
            landing_rigor: thinkingUpgrade.landing_rigor,
            migration_check: thinkingUpgrade.migration_check,
          },
        }),
      });
      if (!response.ok) throw new Error("思维升级入账失败");
      const result = await response.json();
      if (!result.snapshot?.id) throw new Error("思维升级未读回快照");
      setThinkingUpgradeStatus("saved");
    } catch {
      setThinkingUpgradeStatus("failed");
    }
  };

  const handleCopyExpression = async () => {
    const copyScript = interviewExpressionCard?.copyScript;
    if (!copyScript) return;

    try {
      await navigator.clipboard.writeText(copyScript);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
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
  const interviewExpressionAsset =
    record.ai_feedback?.interview_expression &&
    typeof record.ai_feedback.interview_expression === "object"
      ? record.ai_feedback.interview_expression
      : null;
  const thinkingUpgradeAsset =
    record.ai_feedback?.thinking_upgrade &&
    typeof record.ai_feedback.thinking_upgrade === "object"
      ? record.ai_feedback.thinking_upgrade
      : null;
  const rawTitle =
    record.ai_feedback?.scenario_title || record.question_scenario;
  const title = rawTitle
    .replace(/^\s*---\s*/, "")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 82);
  const hasSavedRevision = Boolean(revisedAnswer) || revisionStatus === "saved";
  const historyPrimaryAction = !hasSavedRevision
    ? {
        label: "前往修正版",
        description: "先完成修正版，保存后再集中处理资产入账。",
        kind: "revision" as const,
        href: "#revision-editor",
      }
    : interviewExpressionCard && expressionCardStatus !== "saved"
      ? {
          label: "前往保存并入账",
          description: "修正版已保存，现在沉淀面试表达证据。",
          kind: "expression" as const,
          href: "#deposit-assets",
        }
      : thinkingUpgradeAsset && thinkingUpgradeStatus !== "saved"
        ? {
            label: "前往保存并入账",
            description: "把判断、取舍、归因、落地和迁移验证写入画像。",
            kind: "thinking" as const,
            href: "#deposit-assets",
          }
        : {
            label: "返回训练队列",
            description: "本条记录已完成修正与入账。",
            kind: "link" as const,
            href: "/training",
          };
  const reviewSteps = [
    {
      label: "原回答 / AI 反馈",
      text: "对照原始判断与反馈缺口",
      status: "done" as const,
    },
    {
      label: "修正版",
      text: hasSavedRevision ? "已保存，仍可继续修订" : "用编辑器重写可复述答案",
      status: hasSavedRevision ? ("done" as const) : ("current" as const),
    },
    {
      label: "保存并入账",
      text: "写入修正快照、表达卡或思维升级证据",
      status:
        historyPrimaryAction.kind === "link"
          ? ("done" as const)
          : hasSavedRevision
            ? ("current" as const)
            : ("pending" as const),
    },
  ];
  const metaItems = [
    { label: "来源", value: sourceLabel },
    { label: "难度", value: `${record.difficulty || 3}/5` },
    { label: "评分", value: score ? `${score}/10` : "-" },
  ];

  return (
    <>
      <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <ReviewProcessingDesk
          historyPrimaryAction={historyPrimaryAction}
          steps={reviewSteps}
          metaItems={metaItems}
          title={title}
        />

        <section className="mb-8">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-label font-bold text-primary">01 对照</p>
              <h2 className="mt-1 text-[20px] font-bold leading-7 text-ink">
                原回答 / AI 反馈
              </h2>
            </div>
            <p className="text-label font-semibold text-ink-muted">
              {new Date(record.created_at).toLocaleString("zh-CN")}
            </p>
          </div>

          <div className="grid overflow-hidden rounded-lg border border-line bg-white lg:grid-cols-2">
            <article className="p-5 lg:border-r lg:border-line">
              <div className="flex items-center gap-2 text-body-sm font-bold text-ink">
                <BookOpen className="h-4 w-4 text-primary" />
                原回答
              </div>
              <div className="mt-4 border-b border-line pb-4">
                <p className="text-label font-bold text-ink-muted">题目摘要</p>
                <div className="markdown-content mt-2 text-body-sm leading-6 text-ink">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {record.question_scenario}
                  </ReactMarkdown>
                </div>
              </div>
              <div className="mt-4 whitespace-pre-wrap text-body-md leading-7 text-ink">
                {record.user_answer}
              </div>
            </article>

            <article className="p-5">
              <div className="flex items-center gap-2 text-body-sm font-bold text-ink">
                <Sparkles className="h-4 w-4 text-primary" />
                AI 反馈
              </div>
              <div className="mt-4">
                {evaluation ? (
                  <TrainingEvaluationPanel
                    evaluation={evaluation}
                    hideReviewAssets
                  />
                ) : (
                  <div className="divide-y divide-line border-y border-line">
                    {sections.diagnosis && (
                      <section className="py-4">
                        <div className="mb-2 flex items-center gap-2 text-body-sm font-bold text-ink">
                          <Activity className="h-4 w-4 text-primary" />
                          诊断
                        </div>
                        <div className="markdown-content text-body-sm leading-6 text-ink-muted">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {sections.diagnosis}
                          </ReactMarkdown>
                        </div>
                      </section>
                    )}
                    {sections.suggestion && (
                      <section className="py-4">
                        <div className="mb-2 flex items-center gap-2 text-body-sm font-bold text-ink">
                          <Lightbulb className="h-4 w-4 text-primary" />
                          建议
                        </div>
                        <div className="markdown-content text-body-sm leading-6 text-ink-muted">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {sections.suggestion}
                          </ReactMarkdown>
                        </div>
                      </section>
                    )}
                  </div>
                )}
              </div>

              {record.ai_feedback?.hidden_risks?.length > 0 && (
                <div className="mt-5 border-t border-line pt-4">
                  <div className="flex items-center gap-2 text-label font-bold text-warning">
                    <Target className="h-4 w-4" />
                    案例推演隐藏风险
                  </div>
                  <ul className="mt-2 divide-y divide-line">
                    {record.ai_feedback.hidden_risks.map((risk: string) => (
                      <li key={risk} className="py-2 text-body-sm leading-6 text-ink-muted">
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          </div>
        </section>

        {showRevisionWorkbench && (
          <section
            id="revision-editor"
            className="mb-8 scroll-mt-24 overflow-hidden rounded-lg border border-primary-muted bg-white"
          >
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-primary-muted bg-primary-soft/40 px-5 py-4">
              <div>
                <p className="text-label font-bold text-primary">02 二次修正</p>
                <h2 className="mt-1 text-[20px] font-bold leading-7 text-ink">
                  修正版
                </h2>
              </div>
              <span className="rounded-md border border-line bg-white px-3 py-1.5 text-label font-semibold text-ink-muted">
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
            <div className="p-5">
              <textarea
                ref={revisionEditorRef}
                value={revisionText}
                onChange={(event) => {
                  setRevisionText(event.target.value);
                  setRevisionStatus("idle");
                }}
                className="min-h-[300px] w-full resize-y rounded-md border border-line bg-white p-4 text-body-md leading-7 text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                placeholder="基于 AI 反馈重写：关键判断、依据、取舍、验证指标..."
              />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-label font-semibold text-ink-muted">
                  {revisionProfileStatus === "saved"
                    ? "二次修正已进入能力证据账本"
                    : revisionProfileStatus === "failed"
                      ? "修正已保存，画像证据稍后可刷新"
                      : "保存后会同步创建 revision_saved 画像快照。"}
                </p>
                <button
                  onClick={handleSaveRevision}
                  disabled={!revisionText.trim() || revisionStatus === "saving"}
                  className="inline-flex items-center gap-2 rounded-md border border-primary px-4 py-2.5 text-body-sm font-semibold text-primary transition hover:bg-primary-soft active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:pointer-events-none disabled:opacity-50"
                >
                  <PenLine className="h-4 w-4" />
                  {revisionStatus === "saving" ? "保存中" : "保存并入账"}
                </button>
              </div>
            </div>
          </section>
        )}

        <section id="deposit-assets" className="scroll-mt-24">
          <div className="mb-3">
            <p className="text-label font-bold text-primary">03 沉淀</p>
            <h2 className="mt-1 text-[20px] font-bold leading-7 text-ink">
              保存并入账
            </h2>
            <p className="mt-1 text-body-sm text-ink-muted">
              主线资产复盘以分组行呈现，只沉淀后续处方会复用的证据。
            </p>
          </div>

          <div className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
            {(interviewExpressionAsset || interviewExpressionCard) && (
              <article className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-soft text-primary">
                      <FileCheck2 className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-label font-bold text-primary">面试表达资产</p>
                      <h3 className="mt-1 text-body-md font-bold text-ink">面试表达卡</h3>
                    </div>
                  </div>
                  {interviewExpressionCard && (
                    <Badge
                      variant={
                        interviewExpressionCard.readiness === "面试可用"
                          ? "success"
                          : "neutral"
                      }
                    >
                      {interviewExpressionCard.readiness}
                    </Badge>
                  )}
                </div>

                <dl className="mt-4 divide-y divide-line border-y border-line">
                  <div className="grid gap-1 py-3 sm:grid-cols-[7rem_1fr] sm:gap-4">
                    <dt className="text-label font-bold text-ink-muted">开场判断</dt>
                    <dd className="text-body-sm leading-6 text-ink">
                      {interviewExpressionCard?.openingClaim ||
                        interviewExpressionAsset?.opening_judgment ||
                        "先给出清晰判断，再补证据和取舍。"}
                    </dd>
                  </div>
                  <div className="grid gap-1 py-3 sm:grid-cols-[7rem_1fr] sm:gap-4">
                    <dt className="text-label font-bold text-ink-muted">证据抓手</dt>
                    <dd className="text-body-sm leading-6 text-ink">
                      {interviewExpressionCard?.proofPoint ||
                        (interviewExpressionAsset?.evidence_hooks || []).join("；") ||
                        "补充可验证的用户、业务和结果证据。"}
                    </dd>
                  </div>
                  <div className="grid gap-1 py-3 sm:grid-cols-[7rem_1fr] sm:gap-4">
                    <dt className="text-label font-bold text-warning">追问风险</dt>
                    <dd className="text-body-sm leading-6 text-ink">
                      {interviewExpressionCard?.followupRisk ||
                        (interviewExpressionAsset?.follow_up_risks || []).join("；") ||
                        "继续补充角色贡献、取舍依据和结果口径。"}
                    </dd>
                  </div>
                </dl>

                {interviewExpressionCard && (
                  <div className="mt-4 rounded-md bg-surface p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-label font-bold text-ink-muted">可复制表达版本</p>
                      <button
                        onClick={handleCopyExpression}
                        className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-label font-semibold text-ink transition hover:border-primary-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                      >
                        <Clipboard className="h-4 w-4" />
                        {copyStatus === "copied"
                          ? "已复制"
                          : copyStatus === "failed"
                            ? "复制失败"
                            : "复制表达"}
                      </button>
                    </div>
                    <p className="mt-2 text-body-sm leading-6 text-ink">
                      {interviewExpressionCard.copyScript}
                    </p>
                  </div>
                )}

                {interviewExpressionCard && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-label font-semibold text-ink-muted">
                      {expressionCardStatus === "saved"
                        ? "表达卡已入账，画像处方会参考这条材料"
                        : expressionCardStatus === "failed"
                          ? "入账失败，请稍后重试"
                          : "把这张表达卡沉淀到画像账本。"}
                    </p>
                    <button
                      onClick={handleSaveExpressionCard}
                      disabled={expressionCardStatus === "saving"}
                      className="inline-flex items-center gap-2 rounded-md border border-line px-4 py-2.5 text-body-sm font-semibold text-ink transition hover:border-primary-muted hover:text-primary active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:pointer-events-none disabled:opacity-50"
                    >
                      <FileCheck2 className="h-4 w-4" />
                      {expressionCardStatus === "saving"
                        ? "入账中"
                        : "沉淀到画像账本"}
                    </button>
                  </div>
                )}
              </article>
            )}

            {thinkingUpgradeAsset && (
              <article className="p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-soft text-primary">
                    <Lightbulb className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-label font-bold text-primary">高级产品思维</p>
                    <h3 className="mt-1 text-body-md font-bold text-ink">思维升级卡</h3>
                  </div>
                </div>

                <dl className="mt-4 divide-y divide-line border-y border-line">
                  {[
                    ["判断质量", thinkingUpgradeAsset.judgment_quality],
                    ["取舍质量", thinkingUpgradeAsset.tradeoff_quality],
                    ["归因深度", thinkingUpgradeAsset.attribution_depth],
                    ["落地严谨度", thinkingUpgradeAsset.landing_rigor],
                    ["迁移验证", thinkingUpgradeAsset.migration_check],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="grid gap-1 py-3 sm:grid-cols-[7rem_1fr] sm:gap-4"
                    >
                      <dt className="text-label font-bold text-ink-muted">{label}</dt>
                      <dd className="text-body-sm leading-6 text-ink">
                        {value || "继续补充具体判断、证据和落地动作。"}
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-label font-semibold text-ink-muted">
                    {thinkingUpgradeStatus === "saved"
                      ? "思维升级已入账，后续训练会参考这次判断证据"
                      : thinkingUpgradeStatus === "failed"
                        ? "入账失败，请稍后重试"
                        : "连同迁移验证沉淀到画像账本。"}
                  </p>
                  <button
                    onClick={handleSaveThinkingUpgrade}
                    disabled={thinkingUpgradeStatus === "saving"}
                    className="inline-flex items-center gap-2 rounded-md border border-line px-4 py-2.5 text-body-sm font-semibold text-ink transition hover:border-primary-muted hover:text-primary active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:pointer-events-none disabled:opacity-50"
                  >
                    <Lightbulb className="h-4 w-4" />
                    {thinkingUpgradeStatus === "saving"
                      ? "入账中"
                      : "沉淀思维升级"}
                  </button>
                </div>
              </article>
            )}

            {evaluation && (
              <article className="p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-surface text-ink-muted">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-label font-bold text-primary">下一步处方摘要</p>
                    <dl className="mt-2 divide-y divide-line">
                      {[
                        ["下一步", evaluation.next_practice],
                        ["最该补", evaluation.gaps[0]],
                        ["可复用框架", evaluation.thinking_framework[0]],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="grid gap-1 py-2 sm:grid-cols-[7rem_1fr] sm:gap-4"
                        >
                          <dt className="text-label font-bold text-ink-muted">{label}</dt>
                          <dd className="text-body-sm font-semibold leading-6 text-ink">
                            {value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              </article>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
