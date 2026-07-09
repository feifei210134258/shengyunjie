"use client";

import Link from "next/link";
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
import {
  Activity,
  ArrowRight,
  BookOpen,
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
  onPrimaryAction,
}: {
  historyPrimaryAction: {
    label: string;
    description: string;
    kind: "revision" | "expression" | "thinking" | "link";
    href?: string;
    disabled?: boolean;
  };
  steps: { label: string; text: string; active: boolean }[];
  metaItems: { label: string; value: string }[];
  title: string;
  onPrimaryAction: () => void;
}) {
  return (
    <section className="mb-6 rounded-xl border border-line bg-ink p-5 text-white shadow-xs">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_360px]">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge>复盘处理台</Badge>
            <Badge variant="neutral">入账动作台</Badge>
          </div>
          <h1 className="line-clamp-2 text-[28px] font-bold leading-tight sm:text-[36px]">
            {title}
          </h1>
          <p className="mt-3 max-w-3xl text-body-sm leading-relaxed text-white/70">
            这页只处理一个闭环：先对照原答补修正版，再把面试表达或思维升级入账，最后回到训练流水线继续下一题迁移。
          </p>

          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            {metaItems.map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2"
              >
                <p className="text-label font-bold text-white/55">{item.label}</p>
                <p className="mt-1 text-body-sm font-semibold text-white">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-xl border border-white/10 bg-white/[0.07] p-4">
          <p className="text-label font-bold text-white/65">本轮处理顺序</p>
          <div className="mt-3 space-y-3">
            {steps.map((step, index) => (
              <div key={step.label} className="grid grid-cols-[2rem_1fr] gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg font-mono text-label font-bold ${
                    step.active
                      ? "bg-white text-ink"
                      : "bg-white/10 text-white/45"
                  }`}
                >
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div>
                  <p className="text-body-sm font-bold text-white">{step.label}</p>
                  <p className="mt-0.5 text-body-sm leading-relaxed text-white/60">
                    {step.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg bg-white px-4 py-3 text-ink">
            <p className="text-label font-bold text-ink-muted">当前主动作</p>
            <p className="mt-1 text-body-sm font-semibold leading-relaxed text-ink">
              {historyPrimaryAction.description}
            </p>
            {historyPrimaryAction.kind === "link" ? (
              <Link
                href={historyPrimaryAction.href || "/training"}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-body-sm font-semibold text-white transition hover:bg-ink/90 active:scale-[0.98]"
              >
                {historyPrimaryAction.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <button
                onClick={onPrimaryAction}
                disabled={historyPrimaryAction.disabled}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-body-sm font-semibold text-white transition hover:bg-ink/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
              >
                {historyPrimaryAction.label}
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </aside>
      </div>
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
  const title =
    record.ai_feedback?.scenario_title ||
    record.question_scenario.replace(/\n/g, " ").slice(0, 82);
  const hasSavedRevision = Boolean(revisedAnswer) || revisionStatus === "saved";
  const historyPrimaryAction = !hasSavedRevision
    ? {
        label: "先保存修正版",
        description:
          "复盘队列过来的记录先补一版可复述答案，再把它沉淀成表达卡或思维升级证据。",
        kind: "revision" as const,
        disabled: !revisionText.trim() || revisionStatus === "saving",
      }
    : interviewExpressionCard && expressionCardStatus !== "saved"
      ? {
          label: "沉淀表达卡",
          description:
            "修正版已经就位，下一步把面试表达卡写入画像账本，让后续处方能引用这条证据。",
          kind: "expression" as const,
          disabled: expressionCardStatus === "saving",
        }
      : thinkingUpgradeAsset && thinkingUpgradeStatus !== "saved"
        ? {
            label: "沉淀思维升级",
            description:
              "把判断、取舍、归因和落地要求入账，下一题会围绕这张升级卡继续迁移。",
            kind: "thinking" as const,
            disabled: thinkingUpgradeStatus === "saving",
          }
        : {
            label: "回到训练流水线",
            description:
              "本条记录已经完成主要处理，回到训练资产流水线继续下一题或下一条复盘。",
            kind: "link" as const,
            href: "/training",
          };
  const handlePrimaryHistoryAction = () => {
    if (historyPrimaryAction.kind === "revision") {
      void handleSaveRevision();
      return;
    }
    if (historyPrimaryAction.kind === "expression") {
      void handleSaveExpressionCard();
      return;
    }
    if (historyPrimaryAction.kind === "thinking") {
      void handleSaveThinkingUpgrade();
    }
  };
  const reviewSteps = [
    {
      label: "原答与修正版",
      text: hasSavedRevision ? "修正版已保存，可继续入账资产" : "先把原回答改成可复述版本",
      active: true,
    },
    {
      label: "入账动作台",
      text:
        interviewExpressionCard || thinkingUpgradeAsset
          ? "选择表达卡或思维升级卡沉淀到账本"
          : "等待 AI 反馈生成可入账资产",
      active: hasSavedRevision,
    },
    {
      label: "回到训练流水线",
      text: "处理完成后再开下一题，避免只读反馈不迁移",
      active: historyPrimaryAction.kind === "link",
    },
  ];
  const metaItems = [
    { label: "来源", value: sourceLabel },
    { label: "难度", value: `${record.difficulty || 3}/5` },
    { label: "评分", value: score ? `${score}/10` : "-" },
  ];

  return (
    <>
      <PageHeader
        title="训练复盘工作台"
        subtitle="把一次作答处理成下一题能迁移的证据"
        backHref="/training"
      />

      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
        <ReviewProcessingDesk
          historyPrimaryAction={historyPrimaryAction}
          steps={reviewSteps}
          metaItems={metaItems}
          title={title}
          onPrimaryAction={handlePrimaryHistoryAction}
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="space-y-6">
          <section>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-label font-bold text-primary">
                  原答与修正版
                </p>
                <h2 className="mt-1 text-heading-sm font-bold text-ink">
                  先对照题目，把回答改成可复述版本
                </h2>
              </div>
              <p className="text-label font-semibold text-ink-muted">
                {new Date(record.created_at).toLocaleString("zh-CN")}
              </p>
            </div>
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
          </section>
          </div>

          {/* AI analysis */}
          <div className="space-y-6">
          <section>
          <div className="mb-3">
            <p className="text-label font-bold text-primary">入账动作台</p>
            <h2 className="mt-1 text-heading-sm font-bold text-ink">
              把修正版转成画像可用证据
            </h2>
          </div>
          {(interviewExpressionAsset || thinkingUpgradeAsset) && (
            <Card size="md" className="border-primary-muted bg-primary-soft/35">
              <div className="mb-4">
                <p className="text-label font-bold text-primary">
                  主线资产复盘
                </p>
                <h2 className="mt-1 text-heading-sm font-bold text-ink">
                  这次训练已经沉淀出的可复用材料
                </h2>
              </div>

              <div className="space-y-4">
                {interviewExpressionAsset && (
                  <section className="rounded-xl border border-line bg-white p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <FileCheck2 className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-ink">面试表达资产</h3>
                    </div>
                    <p className="text-body-sm font-semibold leading-6 text-ink">
                      {interviewExpressionAsset.opening_judgment ||
                        "先给出清晰判断，再补证据和取舍。"}
                    </p>
                    <p className="mt-2 text-body-sm leading-7 text-ink-muted">
                      {interviewExpressionAsset.answer_version ||
                        "补充可复述版本后，这条训练记录会更适合面试调用。"}
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-label font-bold text-primary">
                          证据抓手
                        </p>
                        <ul className="mt-1 space-y-1">
                          {(interviewExpressionAsset.evidence_hooks || []).map(
                            (item: string) => (
                              <li
                                key={item}
                                className="text-body-sm leading-relaxed text-ink-muted"
                              >
                                {item}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                      <div>
                        <p className="text-label font-bold text-warning">
                          追问风险
                        </p>
                        <ul className="mt-1 space-y-1">
                          {(interviewExpressionAsset.follow_up_risks || []).map(
                            (item: string) => (
                              <li
                                key={item}
                                className="text-body-sm leading-relaxed text-ink-muted"
                              >
                                {item}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    </div>
                  </section>
                )}

                {thinkingUpgradeAsset && (
                  <section className="rounded-xl border border-line bg-white p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-ink">思维升级卡</h3>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        ["判断质量", thinkingUpgradeAsset.judgment_quality],
                        ["取舍质量", thinkingUpgradeAsset.tradeoff_quality],
                        ["归因深度", thinkingUpgradeAsset.attribution_depth],
                        ["落地严谨度", thinkingUpgradeAsset.landing_rigor],
                        ["迁移验证", thinkingUpgradeAsset.migration_check],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="rounded-lg border border-line bg-surface px-3 py-2"
                        >
                          <p className="text-label font-bold text-primary">
                            {label}
                          </p>
                          <p className="mt-1 text-body-sm leading-relaxed text-ink-muted">
                            {value || "继续补充具体判断、证据和落地动作。"}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-label font-semibold text-ink-muted">
                        {thinkingUpgradeStatus === "saved"
                          ? "思维升级已入账，后续训练会参考这次判断证据"
                          : thinkingUpgradeStatus === "failed"
                            ? "入账失败，请稍后重试"
                            : "把这张思维升级卡沉淀进画像账本，作为长期升阶证据。"}
                      </p>
                      <button
                        onClick={handleSaveThinkingUpgrade}
                        disabled={thinkingUpgradeStatus === "saving"}
                        className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-body-sm font-semibold text-white transition hover:bg-ink/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                      >
                        <Lightbulb className="h-4 w-4" />
                        {thinkingUpgradeStatus === "saving"
                          ? "入账中"
                          : "沉淀思维升级"}
                      </button>
                    </div>
                  </section>
                )}
              </div>
            </Card>
          )}

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
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-label font-semibold text-ink-muted">
                  {expressionCardStatus === "saved"
                    ? "表达卡已入账，画像处方会参考这条材料"
                    : expressionCardStatus === "failed"
                      ? "入账失败，请稍后重试"
                      : "把这张表达卡沉淀到画像账本，作为下一轮推荐的证据。"}
                </p>
                <button
                  onClick={handleSaveExpressionCard}
                  disabled={expressionCardStatus === "saving"}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-body-sm font-semibold text-white transition hover:bg-primary-hover active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                >
                  <FileCheck2 className="h-4 w-4" />
                  {expressionCardStatus === "saving"
                    ? "入账中"
                    : "沉淀到画像账本"}
                </button>
              </div>
            </Card>
          )}

          {evaluation && (
            <div className="rounded-xl border border-line bg-white p-4">
              <p className="text-label font-bold text-primary">下一步处方摘要</p>
              <div className="mt-3 space-y-3">
                {[
                  ["下一步", evaluation.next_practice],
                  ["最该补", evaluation.gaps[0]],
                  ["可复用框架", evaluation.thinking_framework[0]],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="grid gap-2 rounded-lg bg-surface px-3 py-2 sm:grid-cols-[6rem_1fr]"
                  >
                    <p className="text-label font-bold text-ink-muted">
                      {label}
                    </p>
                    <p className="line-clamp-2 text-body-sm font-semibold leading-relaxed text-ink">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          </section>

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
