"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Layers3,
  MessageSquareQuote,
  Save,
  Target,
  TriangleAlert,
} from "lucide-react";
import { SkeletonCard } from "@/components/ui/skeleton";
import type {
  StoryBank,
  ProjectStory,
  ProjectEvidencePatch,
} from "@/lib/bootcamp/story-bank";
import { cn } from "@/lib/utils";

type StoryBankResponse = {
  setupNeeded?: boolean;
  storyBank?: StoryBank | null;
  latestGoalBrief?: StoryBank["latestGoalBrief"];
  nextAction?: {
    label: string;
    href: string;
    reason: string;
  };
  error?: string;
};

function getReadinessLabel(score: number) {
  if (score >= 8) return "可直接讲";
  if (score >= 5) return "需要补证据";
  return "高风险项目";
}

function getReadinessClass(score: number) {
  if (score >= 8) return "bg-success-soft text-success";
  if (score >= 5) return "bg-warning-soft text-warning";
  return "bg-danger-soft text-danger";
}

export default function StoryBankPage() {
  const [data, setData] = useState<StoryBankResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [savingProject, setSavingProject] = useState<string>("");
  const [saveError, setSaveError] = useState<string>("");
  const [storyPackStatus, setStoryPackStatus] = useState<
    "idle" | "saving" | "saved" | "failed"
  >("idle");

  useEffect(() => {
    fetch("/api/bootcamp/story-bank")
      .then((response) => response.json())
      .then((payload: StoryBankResponse) => {
        setData(payload);
        const firstProject = payload.storyBank?.projectStories?.[0]?.projectName;
        if (firstProject) setSelectedProject(firstProject);
      })
      .catch((error) => setData({ error: error.message || "加载失败" }))
      .finally(() => setLoading(false));
  }, []);

  const storyBank = data?.storyBank || null;
  const latestGoalBrief =
    data?.latestGoalBrief || storyBank?.latestGoalBrief || null;
  const activeStory = useMemo(() => {
    if (!storyBank?.projectStories.length) return null;
    return (
      storyBank.projectStories.find(
        (story) => story.projectName === selectedProject
      ) || storyBank.projectStories[0]
    );
  }, [selectedProject, storyBank]);

  function handleSelectProject(projectName: string) {
    setSelectedProject(projectName);
    setStoryPackStatus("idle");
  }

  async function onSaveProjectEvidence(patch: ProjectEvidencePatch) {
    setSavingProject(patch.projectName);
    setSaveError("");

    try {
      const response = await fetch("/api/bootcamp/story-bank", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const payload: StoryBankResponse = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "保存失败，请稍后重试");
      }
      setData(payload);
      setSelectedProject(patch.projectName);
    } catch (error: any) {
      setSaveError(error.message || "保存失败，请稍后重试");
    } finally {
      setSavingProject("");
    }
  }

  async function handleSaveProjectStoryPack(story: ProjectStory) {
    setStoryPackStatus("saving");
    try {
      const response = await fetch("/api/profile/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trigger: "project_story_saved",
          projectStory: {
            projectName: story.projectName,
            company: story.company,
            role: story.role,
            readinessScore: story.readinessScore,
            proofGaps: story.proofGaps,
            targetFit: story.targetFit,
            interviewScript: {
              fullScript: story.interviewScript.fullScript,
            },
          },
        }),
      });
      if (!response.ok) throw new Error("故事包入账失败");
      const result = await response.json();
      if (!result.snapshot?.id) throw new Error("故事包未读回快照");
      setStoryPackStatus("saved");
    } catch {
      setStoryPackStatus("failed");
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
          <SkeletonCard className="h-[640px]" />
          <SkeletonCard className="h-[640px]" />
        </div>
      </main>
    );
  }

  if (data?.setupNeeded || !storyBank) {
    const action = data?.nextAction || {
      label: "上传简历",
      href: "/bootcamp/resume",
      reason: "先解析简历，系统才能整理项目故事库。",
    };

    return (
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-xl border border-line bg-surface-raised p-8 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <BriefcaseBusiness className="h-7 w-7" strokeWidth={1.5} />
          </div>
          <h1 className="mt-5 text-display-md font-bold text-ink">
            先建立项目故事库
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-body-md text-ink-muted">
            {action.reason}
          </p>
          <Link
            href={action.href}
            className="mt-7 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-body-md font-bold text-white transition-all hover:bg-primary-hover active:scale-[0.98]"
          >
            {action.label}
            <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1480px] px-4 py-5 sm:px-6 lg:px-8">
      <section className="rounded-xl border border-line bg-surface-raised p-5 shadow-xs sm:p-7">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-label font-bold text-primary">面试证据</p>
            <h1 className="mt-2 text-[32px] font-bold leading-[1.12] text-ink sm:text-[44px]">
              项目故事库
            </h1>
            <p className="mt-3 max-w-3xl text-body-md leading-relaxed text-ink-muted">
              把简历项目、模拟面试追问、AI 改写和证据缺口收在一起。目标不是保存资料，而是让每个项目都变成面试时能讲清的高级 PM 证据。
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-label font-bold text-ink-muted">
            <span className="rounded-md bg-surface px-3 py-2">
              项目 {storyBank.summary.totalProjects}
            </span>
            <span className="rounded-md bg-surface px-3 py-2">
              已答 {storyBank.summary.answeredQuestions}
            </span>
            <span className="rounded-md bg-surface px-3 py-2">
              已评 {storyBank.summary.evaluatedQuestions}
            </span>
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="rounded-xl border border-line bg-surface-raised p-4 shadow-xs">
            <div className="mb-4 flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" strokeWidth={1.5} />
              <h2 className="text-heading-sm font-semibold text-ink">
                项目资产
              </h2>
            </div>
            <div className="space-y-2">
              {storyBank.projectStories.map((story) => (
                <button
                  key={story.projectName}
                  onClick={() => handleSelectProject(story.projectName)}
                  className={cn(
                    "w-full rounded-lg px-3 py-3 text-left transition-all active:scale-[0.99]",
                    activeStory?.projectName === story.projectName
                      ? "bg-primary-soft text-primary"
                      : "bg-surface text-ink hover:bg-surface-hover"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-body-sm font-bold">
                        {story.projectName}
                      </p>
                      <p className="mt-1 text-label opacity-75">
                        {story.company || "公司待补"} · {story.role || "角色待补"}
                      </p>
                      <p className="mt-2 text-label font-bold opacity-80">
                        {story.targetFit.priorityLabel} · 目标匹配度{" "}
                        {story.targetFit.score}/10
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-md px-2 py-1 text-label font-bold",
                        getReadinessClass(story.readinessScore)
                      )}
                    >
                      {story.readinessScore}/10
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <TargetPriorityPanel
            storyBank={storyBank}
            latestGoalBrief={latestGoalBrief}
          />

          <div className="rounded-xl border border-line bg-surface-raised p-4 shadow-xs">
            <h2 className="text-heading-sm font-semibold text-ink">
              当前建议
            </h2>
            <p className="mt-2 text-body-sm leading-relaxed text-ink-muted">
              {storyBank.recommendedNextAction.reason}
            </p>
            <Link
              href={storyBank.recommendedNextAction.href}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-body-sm font-bold text-white transition-all hover:bg-primary-hover active:scale-[0.98]"
            >
              {storyBank.recommendedNextAction.label}
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </Link>
          </div>

          <TrainingExpressionAssets storyBank={storyBank} />
        </aside>

        {activeStory && (
          <StoryDetail
            onSaveProjectStoryPack={handleSaveProjectStoryPack}
            onSaveProjectEvidence={onSaveProjectEvidence}
            saveError={saveError}
            saving={savingProject === activeStory.projectName}
            storyPackStatus={storyPackStatus}
            story={activeStory}
          />
        )}
      </section>
    </main>
  );
}

function TargetPriorityPanel({
  storyBank,
  latestGoalBrief,
}: {
  storyBank: StoryBank;
  latestGoalBrief: StoryBank["latestGoalBrief"];
}) {
  const priorityStory =
    storyBank.projectStories.find(
      (story) => story.projectName === storyBank.summary.targetPriorityProject
    ) || storyBank.projectStories[0];

  return (
    <div className="rounded-xl border border-line bg-ink p-4 text-white shadow-xs">
      <div className="mb-4 flex items-center gap-2">
        <Target className="h-4 w-4 text-white/80" strokeWidth={1.5} />
        <h2 className="text-heading-sm font-semibold">
          目标项目优先级
        </h2>
      </div>
      <div className="space-y-2 text-label leading-relaxed text-white/65">
        <p>目标岗位：{latestGoalBrief?.targetRole || "未设置"}</p>
        <p>
          目标场景：
          {latestGoalBrief?.targetScenario || "先按高级 PM 面试准备"}
        </p>
        <p>优先讲 / 备选讲 / 暂缓讲</p>
      </div>
      {priorityStory && (
        <div className="mt-4 rounded-lg bg-white/10 px-3 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-body-sm font-bold">
                {priorityStory.projectName}
              </p>
              <p className="mt-1 text-label font-bold text-white/60">
                {priorityStory.targetFit.priorityLabel} · 目标匹配度{" "}
                {priorityStory.targetFit.score}/10
              </p>
            </div>
            <span className="rounded-md bg-white px-2 py-1 text-label font-bold text-ink">
              先讲
            </span>
          </div>
          <p className="mt-3 text-body-sm leading-relaxed text-white/80">
            {priorityStory.targetFit.reason}
          </p>
        </div>
      )}
    </div>
  );
}

function TrainingExpressionAssets({ storyBank }: { storyBank: StoryBank }) {
  const assets = storyBank.trainingExpressionAssets ?? [];

  return (
    <div className="rounded-xl border border-line bg-surface-raised p-4 shadow-xs">
      <div className="mb-4 flex items-center gap-2">
        <Layers3 className="h-4 w-4 text-primary" strokeWidth={1.5} />
        <h2 className="text-heading-sm font-semibold text-ink">
          日常训练表达资产
        </h2>
      </div>
      <p className="mb-4 text-body-sm leading-relaxed text-ink-muted">
        训练回答经过二次修正后，也可以变成跳槽时可复述的判断证据。
      </p>
      <div className="space-y-3">
        {assets.length ? (
          assets.slice(0, 3).map((asset) => (
            <Link
              key={asset.sourceRecordId}
              href={asset.href}
              className="block rounded-lg bg-surface px-3 py-3 transition hover:bg-surface-hover active:scale-[0.99]"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2 text-label font-bold text-ink-muted">
                <span>训练回答</span>
                <span>{asset.readiness}</span>
                {asset.score != null && <span>{asset.score} 分</span>}
              </div>
              <p className="text-body-sm font-bold leading-relaxed text-ink">
                {asset.openingClaim}
              </p>
              <p className="mt-1 text-label font-bold text-primary">
                查看训练复盘
              </p>
            </Link>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-line-strong bg-surface px-3 py-4 text-body-sm leading-relaxed text-ink-muted">
            暂无训练表达资产。完成训练并保存二次修正后，这里会出现可迁移到面试的表达材料。
          </div>
        )}
      </div>
    </div>
  );
}

function StoryDetail({
  story,
  onSaveProjectEvidence,
  onSaveProjectStoryPack,
  saveError,
  saving,
  storyPackStatus,
}: {
  story: ProjectStory;
  onSaveProjectEvidence: (patch: ProjectEvidencePatch) => Promise<void>;
  onSaveProjectStoryPack: (story: ProjectStory) => Promise<void>;
  saveError: string;
  saving: boolean;
  storyPackStatus: "idle" | "saving" | "saved" | "failed";
}) {
  const [role, setRole] = useState(story.role);
  const [description, setDescription] = useState(story.description);
  const [outcomesText, setOutcomesText] = useState(story.outcomes.join("\n"));
  const [targetEvidenceText, setTargetEvidenceText] = useState(
    story.targetEvidenceRepair.savedEvidence
  );
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  useEffect(() => {
    setRole(story.role);
    setDescription(story.description);
    setOutcomesText(story.outcomes.join("\n"));
    setTargetEvidenceText(story.targetEvidenceRepair.savedEvidence);
    setCopyState("idle");
  }, [story]);

  async function copyInterviewScript() {
    await navigator.clipboard.writeText(story.interviewScript.fullScript);
    setCopyState("copied");
  }

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-line bg-surface-raised p-5 shadow-xs sm:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <p className="text-label font-bold text-ink-muted">
              {story.company || "公司待补"} · {story.role || "角色待补"}
            </p>
            <h2 className="mt-2 text-heading-lg font-bold text-ink">
              {story.projectName}
            </h2>
            <p className="mt-3 max-w-3xl text-body-md leading-relaxed text-ink-muted">
              {story.description || "简历里还没有足够项目描述，需要补充业务背景、角色边界和关键结果。"}
            </p>
          </div>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-label font-bold",
              getReadinessClass(story.readinessScore)
            )}
          >
            {getReadinessLabel(story.readinessScore)}
            {story.readinessScore}/10
          </span>
        </div>

        <div className="mt-5 flex flex-col gap-3 rounded-lg bg-surface px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-body-sm font-bold text-ink">
              沉淀到画像账本
            </p>
            <p className="mt-1 text-body-sm leading-relaxed text-ink-muted">
              把这份项目讲述稿、成熟度和证据缺口写入能力证据链，后续推荐会知道你已经有可讲项目资产。
            </p>
            {storyPackStatus === "saved" && (
              <p className="mt-2 text-label font-bold text-success">
                故事包已入账
              </p>
            )}
            {storyPackStatus === "failed" && (
              <p className="mt-2 text-label font-bold text-danger">
                故事包入账失败，请稍后重试
              </p>
            )}
          </div>
          <button
            onClick={() => onSaveProjectStoryPack(story)}
            disabled={storyPackStatus === "saving"}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-body-sm font-bold text-white transition-all hover:bg-ink-muted active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45"
          >
            <Save className="h-4 w-4" strokeWidth={1.5} />
            {storyPackStatus === "saving" ? "入账中" : "沉淀到画像账本"}
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <EvidenceBox
            title="目标证据修补台"
            icon={<Target className="h-4 w-4" strokeWidth={1.5} />}
            items={[
              story.targetEvidenceRepair.focusGap,
              story.targetEvidenceRepair.savedEvidence ||
                "还没有保存目标证据。先补一句能支撑目标岗位的结果、归因或取舍证据。",
            ]}
          />
          <EvidenceBox
            title="目标匹配度"
            icon={<Target className="h-4 w-4" strokeWidth={1.5} />}
            items={[
              `${story.targetFit.priorityLabel} · ${story.targetFit.score}/10`,
              story.targetFit.reason,
            ]}
          />
          <EvidenceBox
            title="补齐目标证据"
            icon={<TriangleAlert className="h-4 w-4" strokeWidth={1.5} />}
            items={
              story.targetFit.missingEvidence.length
                ? story.targetFit.missingEvidence
                : ["这个项目已经能支撑当前目标，下一步用模拟追问检查讲述稳定性。"]
            }
          />
          <EvidenceBox
            title="结果证据"
            icon={<CheckCircle2 className="h-4 w-4" strokeWidth={1.5} />}
            items={
              story.outcomes.length
                ? story.outcomes
                : ["结果指标还没有写清，建议补充提升幅度、周期和归因方式。"]
            }
          />
          <EvidenceBox
            title="证据缺口"
            icon={<TriangleAlert className="h-4 w-4" strokeWidth={1.5} />}
            items={
              story.proofGaps.length
                ? story.proofGaps
                : ["这段项目已经具备基本讲述材料，下一步用追问打磨细节。"]
            }
          />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-xl border border-line bg-surface-raised p-5 shadow-xs sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <MessageSquareQuote className="h-4 w-4 text-primary" strokeWidth={1.5} />
            <h3 className="text-heading-sm font-semibold text-ink">
              可讲版本
            </h3>
          </div>
          <p className="rounded-lg bg-surface px-4 py-4 text-body-md leading-relaxed text-ink">
            {story.interviewReadyAnswer}
          </p>

          <div className="mt-5 rounded-xl border border-line bg-white p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" strokeWidth={1.5} />
                <h3 className="text-heading-sm font-semibold text-ink">
                  2 分钟讲述稿
                </h3>
              </div>
              <button
                onClick={copyInterviewScript}
                className="inline-flex items-center gap-2 rounded-lg border border-line-strong bg-transparent px-3 py-2 text-label font-bold text-ink transition-all hover:bg-surface active:scale-[0.98]"
              >
                <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />
                {copyState === "copied" ? "已复制" : "复制讲述稿"}
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {story.interviewScript.sections.map((section) => (
                <div key={section.label} className="rounded-lg bg-surface px-3 py-3">
                  <p className="text-label font-bold text-primary">
                    {section.label}
                  </p>
                  <p className="mt-1 text-body-sm leading-relaxed text-ink-muted">
                    {section.content}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {story.evidenceItems.length ? (
              story.evidenceItems.map((item) => (
                <div key={item.questionId} className="rounded-lg border border-line bg-white px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2 text-label font-bold text-ink-muted">
                    <span>Day {item.dayNumber}</span>
                    <span>Q{item.questionIndex}</span>
                    {item.score != null && <span>评分 {item.score}/10</span>}
                  </div>
                  <p className="mt-2 text-body-sm font-bold text-ink">
                    {item.questionText}
                  </p>
                  {item.improvedAnswer && (
                    <p className="mt-2 text-body-sm leading-relaxed text-ink-muted">
                      {item.improvedAnswer}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-line-strong bg-surface px-4 py-6 text-body-sm text-ink-muted">
                这个项目还没有面试追问记录。进入模拟面试后，相关回答和 AI 改写会自动沉淀到这里。
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-xl border border-line bg-surface-raised p-5 shadow-xs sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <Save className="h-4 w-4 text-primary" strokeWidth={1.5} />
              <h3 className="text-heading-sm font-semibold text-ink">
                补项目证据
              </h3>
            </div>
            <div className="space-y-3">
              <label className="block">
                <span className="text-label font-bold text-ink-muted">
                  我的角色
                </span>
                <textarea
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  className="mt-1 min-h-20 w-full resize-y rounded-lg border border-line bg-surface px-3 py-2 text-body-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                  placeholder="例如：负责权限模型、审批链路和灰度上线"
                />
              </label>
              <label className="block">
                <span className="text-label font-bold text-ink-muted">
                  项目描述
                </span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="mt-1 min-h-24 w-full resize-y rounded-lg border border-line bg-surface px-3 py-2 text-body-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                  placeholder="补充业务背景、关键矛盾和项目边界"
                />
              </label>
              <label className="block">
                <span className="text-label font-bold text-ink-muted">
                  补这条目标证据
                </span>
                <p className="mt-1 text-label leading-relaxed text-primary">
                  {story.targetEvidenceRepair.prompt}
                </p>
                <textarea
                  value={targetEvidenceText}
                  onChange={(event) => setTargetEvidenceText(event.target.value)}
                  className="mt-2 min-h-28 w-full resize-y rounded-lg border border-line bg-surface px-3 py-2 text-body-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                  placeholder="例如：这个项目能证明我适合目标岗位，因为我做过关键取舍、拿到可验证结果，并能说明归因方式。"
                />
              </label>
              <label className="block">
                <span className="text-label font-bold text-ink-muted">
                  结果指标
                </span>
                <textarea
                  value={outcomesText}
                  onChange={(event) => setOutcomesText(event.target.value)}
                  className="mt-1 min-h-24 w-full resize-y rounded-lg border border-line bg-surface px-3 py-2 text-body-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                  placeholder={"一行一个结果，例如：\n审批配置时长下降 31%\n权限相关工单下降 18%"}
                />
              </label>
            </div>
            {saveError && (
              <p className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-body-sm text-danger">
                {saveError}
              </p>
            )}
            <button
              onClick={() =>
                onSaveProjectEvidence({
                  projectName: story.projectName,
                  role,
                  description,
                  outcomesText,
                  targetEvidenceText,
                })
              }
              disabled={saving}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-body-sm font-bold text-white transition-all hover:bg-primary-hover active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
            >
              <Save className="h-4 w-4" strokeWidth={1.5} />
              {saving ? "保存中" : "保存证据"}
            </button>
          </section>

          <section className="rounded-xl border border-line bg-surface-raised p-5 shadow-xs sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" strokeWidth={1.5} />
            <h3 className="text-heading-sm font-semibold text-ink">
              可能追问
            </h3>
          </div>
          <div className="space-y-3">
            {story.likelyQuestions.map((question) => (
              <p
                key={question}
                className="rounded-lg bg-surface px-3 py-3 text-body-sm leading-relaxed text-ink-muted"
              >
                {question}
              </p>
            ))}
          </div>
          <Link
            href="/bootcamp/interview"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-line-strong bg-transparent px-4 py-2.5 text-body-sm font-bold text-ink transition-all hover:bg-surface active:scale-[0.98]"
          >
            继续模拟面试
            <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
          </Link>
          </section>
        </aside>
      </div>
    </section>
  );
}

function EvidenceBox({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
}) {
  return (
    <div className="rounded-lg bg-surface px-4 py-4">
      <div className="mb-3 flex items-center gap-2 text-label font-bold text-primary">
        {icon}
        {title}
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <p key={item} className="text-body-sm leading-relaxed text-ink-muted">
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}
