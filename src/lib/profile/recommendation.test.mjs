import assert from "node:assert/strict";
import test from "node:test";

import { buildRecommendationPlan } from "./recommendation.ts";

test("builds an actionable recommendation plan from the growth profile", () => {
  const plan = buildRecommendationPlan({
    summary: {
      overallScore: 74,
      overallGrade: "B",
      evidenceCount: 9,
      snapshotCount: 2,
      lastEvidenceAt: "2026-07-06T12:00:00.000Z",
    },
    dimensions: [
      {
        id: "strategic_thinking",
        label: "战略思维",
        shortLabel: "战略思维",
        score: 62,
        grade: "C",
        diagnosisScore: 64,
        trainingAverage: 60,
        evidenceCount: 4,
        lastEvidenceAt: "2026-07-06T10:00:00.000Z",
        insight: "指标归因和反证链路需要补强",
      },
      {
        id: "system_design",
        label: "系统设计能力",
        shortLabel: "系统设计",
        score: 84,
        grade: "A",
        diagnosisScore: 86,
        trainingAverage: 82,
        evidenceCount: 5,
        lastEvidenceAt: "2026-07-05T10:00:00.000Z",
        insight: "系统边界清晰",
      },
    ],
    weakestDimensions: [
      {
        id: "strategic_thinking",
        label: "战略思维",
        shortLabel: "战略思维",
        score: 62,
        grade: "C",
        diagnosisScore: 64,
        trainingAverage: 60,
        evidenceCount: 4,
        lastEvidenceAt: "2026-07-06T10:00:00.000Z",
        insight: "指标归因和反证链路需要补强",
      },
    ],
    strongestDimensions: [],
    careerReadiness: {
      label: "还需补项目证据",
      score: 4,
      evaluatedInterviewCount: 1,
      answeredInterviewCount: 2,
      nextAction: "复盘低分追问，把项目证据补进故事库。",
    },
    focusPlan: {
      title: "优先补强 战略思维",
      reason: "战略思维 需要补强反证、归因或结果证据。",
      href: "/training/session",
      targetDimension: "strategic_thinking",
    },
    storyAssets: [],
    thinkingAssets: [],
  });

  assert.equal(plan.primaryFocus.dimensionId, "strategic_thinking");
  assert.equal(plan.recommendations.length, 3);
  assert.deepEqual(
    plan.recommendations.map((item) => item.type),
    ["training", "interview", "review"]
  );
  assert.match(plan.recommendations[0].reason, /战略思维|反证|归因/);
  assert.match(plan.recommendations[1].href, /bootcamp/);
});

test("turns saved story asset proof gaps into project-specific interview prescriptions", () => {
  const plan = buildRecommendationPlan({
    summary: {
      overallScore: 78,
      overallGrade: "B",
      evidenceCount: 12,
      snapshotCount: 4,
      lastEvidenceAt: "2026-07-08T10:00:00.000Z",
    },
    dimensions: [
      {
        id: "data_decision",
        label: "数据决策能力",
        shortLabel: "数据决策",
        score: 70,
        grade: "B",
        diagnosisScore: 72,
        trainingAverage: 68,
        evidenceCount: 5,
        lastEvidenceAt: "2026-07-08T09:00:00.000Z",
        insight: "归因噪音识别还需要更多业务证据",
      },
    ],
    weakestDimensions: [],
    strongestDimensions: [],
    careerReadiness: {
      label: "可进入高压追问",
      score: 8,
      evaluatedInterviewCount: 4,
      answeredInterviewCount: 5,
      nextAction: "整理可复述项目证据。",
    },
    focusPlan: {
      title: "优先补强 数据决策",
      reason: "数据决策需要补强归因链路。",
      href: "/training/session",
      targetDimension: "data_decision",
    },
    storyAssets: [
      {
        snapshotId: "snap-story-1",
        savedAt: "2026-07-08",
        projectName: "客户健康度评分系统",
        company: "云杉科技",
        role: "产品负责人",
        readinessScore: 8,
        proofGaps: ["续费提升归因还缺反证", "运营跟进动作缺少前后对照"],
        targetFit: {
          score: 9,
          priorityLabel: "优先讲",
          reason: "命中续费增长和数据经营，是当前目标岗位的主讲项目。",
          missingEvidence: ["目标场景里的续费归因反证还要补齐"],
        },
        scriptPreview: "我负责客户健康度评分系统。",
        href: "/bootcamp/story-bank",
      },
    ],
    thinkingAssets: [],
  });

  const interviewPrescription = plan.recommendations.find(
    (item) => item.type === "interview"
  );

  assert.equal(interviewPrescription.id, "story-gap-snap-story-1");
  assert.match(interviewPrescription.title, /客户健康度评分系统/);
  assert.match(interviewPrescription.reason, /目标场景里的续费归因反证还要补齐/);
  assert.equal(interviewPrescription.href, "/bootcamp/story-bank");
  assert.equal(interviewPrescription.evidence, "优先讲 · 目标匹配 9/10");
});

test("turns ledgered target evidence into a high-pressure interview validation prescription", () => {
  const plan = buildRecommendationPlan(
    {
      summary: {
        overallScore: 82,
        overallGrade: "B",
        evidenceCount: 14,
        snapshotCount: 5,
        lastEvidenceAt: "2026-07-09T10:00:00.000Z",
      },
      dimensions: [
        {
          id: "commercial_thinking",
          label: "商业思维",
          shortLabel: "商业",
          score: 78,
          grade: "B",
          diagnosisScore: 76,
          trainingAverage: 80,
          evidenceCount: 6,
          lastEvidenceAt: "2026-07-09T09:00:00.000Z",
          insight: "续费增长证据已经形成，下一步需要高压追问验证。",
        },
      ],
      weakestDimensions: [],
      strongestDimensions: [],
      careerReadiness: {
        label: "可进入高压追问",
        score: 8,
        evaluatedInterviewCount: 4,
        answeredInterviewCount: 5,
        nextAction: "用模拟追问检查项目故事是否经得起深挖。",
      },
      focusPlan: {
        title: "优先补强 商业思维",
        reason: "商业思维需要继续验证续费归因。",
        href: "/training/session",
        targetDimension: "commercial_thinking",
      },
      storyAssets: [
        {
          snapshotId: "snap-story-ledgered",
          savedAt: "2026-07-09",
          projectName: "客户健康度评分系统",
          company: "云杉科技",
          role: "产品负责人",
          readinessScore: 9,
          targetEvidence:
            "我用客户健康度模型提前识别续费风险，推动 CS 分层跟进，续费率提升 8.6%。",
          proofGaps: [],
          targetFit: {
            score: 9,
            priorityLabel: "优先讲",
            reason: "目标证据已修好，可支撑 SaaS 续费增长负责人面试。",
            missingEvidence: [],
          },
          scriptPreview: "我负责客户健康度评分系统。",
          href: "/bootcamp/story-bank",
        },
      ],
      thinkingAssets: [],
    },
    {
      targetRole: "B 端高级产品经理",
      targetScenario: "SaaS 续费增长负责人面试",
      targetDeadline: "两周内",
    }
  );

  const interviewPrescription = plan.recommendations.find(
    (item) => item.type === "interview"
  );

  assert.equal(interviewPrescription.id, "story-validate-snap-story-ledgered");
  assert.match(interviewPrescription.title, /验证 客户健康度评分系统 的高压追问/);
  assert.match(interviewPrescription.reason, /目标证据已入账/);
  assert.match(interviewPrescription.reason, /续费率提升 8\.6%/);
  assert.equal(interviewPrescription.href, "/bootcamp/interview?focus=target_evidence");
  assert.equal(interviewPrescription.cta, "进入模拟追问");
  assert.equal(interviewPrescription.evidence, "优先讲 · 目标匹配 9/10");
});

test("turns weak target evidence validation into a specific evidence repair prescription", () => {
  const plan = buildRecommendationPlan({
    summary: {
      overallScore: 82,
      overallGrade: "B",
      evidenceCount: 15,
      snapshotCount: 6,
      lastEvidenceAt: "2026-07-09T12:00:00.000Z",
    },
    dimensions: [
      {
        id: "commercial_thinking",
        label: "商业思维",
        shortLabel: "商业",
        score: 78,
        grade: "B",
        diagnosisScore: 76,
        trainingAverage: 80,
        evidenceCount: 6,
        lastEvidenceAt: "2026-07-09T09:00:00.000Z",
        insight: "续费增长证据已经形成，需要补归因反证。",
      },
    ],
    weakestDimensions: [],
    strongestDimensions: [],
    careerReadiness: {
      label: "可进入高压追问",
      score: 8,
      evaluatedInterviewCount: 5,
      answeredInterviewCount: 6,
      nextAction: "补齐高压追问暴露的击穿点。",
    },
    focusPlan: {
      title: "优先补强 商业思维",
      reason: "商业思维需要继续验证续费归因。",
      href: "/training/session",
      targetDimension: "commercial_thinking",
    },
    storyAssets: [
      {
        snapshotId: "snap-story-ledgered",
        savedAt: "2026-07-09",
        projectName: "客户健康度评分系统",
        company: "云杉科技",
        role: "产品负责人",
        readinessScore: 9,
        targetEvidence:
          "续费率提升 8.6%，并通过客户健康度模型提前识别风险。",
        proofGaps: [],
        targetFit: {
          score: 9,
          priorityLabel: "优先讲",
          reason: "目标证据已修好，可支撑 SaaS 续费增长负责人面试。",
          missingEvidence: [],
        },
        scriptPreview: "我负责客户健康度评分系统。",
        href: "/bootcamp/story-bank",
      },
    ],
    thinkingAssets: [],
    targetEvidenceValidations: [
      {
        snapshotId: "snap-validation-weak",
        savedAt: "2026-07-09",
        interviewId: "interview-1",
        projectName: "客户健康度评分系统",
        targetEvidence:
          "续费率提升 8.6%，并通过客户健康度模型提前识别风险。",
        score: 5.5,
        status: "weak",
        verdict: "能讲结果，但归因反证还不够稳。",
        unresolvedRisks: ["销售动作和运营跟进的贡献没有拆开"],
        nextDrill: "下一轮先补归因反证，再讲角色价值。",
        href: "/bootcamp/interview?focus=target_evidence",
      },
    ],
  });

  const interviewPrescription = plan.recommendations.find(
    (item) => item.type === "interview"
  );

  assert.equal(interviewPrescription.id, "target-validation-repair-snap-validation-weak");
  assert.match(interviewPrescription.title, /修补 客户健康度评分系统 的抗追问击穿点/);
  assert.match(interviewPrescription.reason, /销售动作和运营跟进的贡献没有拆开/);
  assert.match(interviewPrescription.reason, /下一轮先补归因反证/);
  assert.equal(interviewPrescription.href, "/bootcamp/story-bank");
  assert.equal(interviewPrescription.cta, "补击穿点");
  assert.equal(interviewPrescription.evidence, "抗追问 5.5/10");
});

test("turns defended target evidence validation into final interview answer packaging", () => {
  const plan = buildRecommendationPlan({
    summary: {
      overallScore: 86,
      overallGrade: "A",
      evidenceCount: 16,
      snapshotCount: 7,
      lastEvidenceAt: "2026-07-09T12:00:00.000Z",
    },
    dimensions: [
      {
        id: "commercial_thinking",
        label: "商业思维",
        shortLabel: "商业",
        score: 84,
        grade: "A",
        diagnosisScore: 82,
        trainingAverage: 86,
        evidenceCount: 7,
        lastEvidenceAt: "2026-07-09T09:00:00.000Z",
        insight: "目标证据已经抗住追问，可以打包表达。",
      },
    ],
    weakestDimensions: [],
    strongestDimensions: [],
    careerReadiness: {
      label: "可进入高压追问",
      score: 9,
      evaluatedInterviewCount: 5,
      answeredInterviewCount: 6,
      nextAction: "把已验证证据打包成面试表达。",
    },
    focusPlan: {
      title: "优先补强 商业思维",
      reason: "商业思维证据已验证。",
      href: "/training/session",
      targetDimension: "commercial_thinking",
    },
    storyAssets: [
      {
        snapshotId: "snap-story-ledgered",
        savedAt: "2026-07-09",
        projectName: "客户健康度评分系统",
        company: "云杉科技",
        role: "产品负责人",
        readinessScore: 9,
        targetEvidence:
          "续费率提升 8.6%，并通过客户健康度模型提前识别风险。",
        proofGaps: [],
        targetFit: {
          score: 9,
          priorityLabel: "优先讲",
          reason: "目标证据已修好，可支撑 SaaS 续费增长负责人面试。",
          missingEvidence: [],
        },
        scriptPreview: "我负责客户健康度评分系统。",
        href: "/bootcamp/story-bank",
      },
    ],
    thinkingAssets: [],
    targetEvidenceValidations: [
      {
        snapshotId: "snap-validation-strong",
        savedAt: "2026-07-09",
        interviewId: "interview-1",
        projectName: "客户健康度评分系统",
        targetEvidence:
          "续费率提升 8.6%，并通过客户健康度模型提前识别风险。",
        score: 8.6,
        status: "defended",
        verdict: "归因、角色价值和可复用机制都能解释清楚。",
        unresolvedRisks: [],
        nextDrill: "把这段证据压缩成 90 秒终版表达。",
        href: "/bootcamp/interview?focus=target_evidence",
      },
    ],
  });

  const interviewPrescription = plan.recommendations.find(
    (item) => item.type === "interview"
  );

  assert.equal(interviewPrescription.id, "target-validation-package-snap-validation-strong");
  assert.match(interviewPrescription.title, /打包 客户健康度评分系统 的终版面试表达/);
  assert.match(interviewPrescription.reason, /归因、角色价值和可复用机制都能解释清楚/);
  assert.equal(interviewPrescription.href, "/bootcamp/story-bank");
  assert.equal(interviewPrescription.cta, "打包表达");
  assert.equal(interviewPrescription.evidence, "抗追问 8.6/10");
});

test("turns saved thinking upgrade cards into the next training prescription", () => {
  const plan = buildRecommendationPlan({
    summary: {
      overallScore: 76,
      overallGrade: "B",
      evidenceCount: 10,
      snapshotCount: 5,
      lastEvidenceAt: "2026-07-08T11:00:00.000Z",
    },
    dimensions: [
      {
        id: "strategic_thinking",
        label: "战略思维",
        shortLabel: "战略思维",
        score: 74,
        grade: "B",
        diagnosisScore: 76,
        trainingAverage: 72,
        evidenceCount: 5,
        lastEvidenceAt: "2026-07-08T10:00:00.000Z",
        insight: "判断链路正在形成，但取舍依据还需要更具体。",
      },
    ],
    weakestDimensions: [],
    strongestDimensions: [],
    careerReadiness: {
      label: "还需补项目证据",
      score: 5,
      evaluatedInterviewCount: 1,
      answeredInterviewCount: 2,
      nextAction: "复盘低分追问，把项目证据补进故事库。",
    },
    focusPlan: {
      title: "优先补强 战略思维",
      reason: "战略思维需要继续补强取舍和归因。",
      href: "/training/session",
      targetDimension: "strategic_thinking",
    },
    storyAssets: [],
    thinkingAssets: [
      {
        snapshotId: "snap-thinking-1",
        savedAt: "2026-07-08",
        trainingRecordId: "record-1",
        dimension: "strategic_thinking",
        dimensionLabel: "战略思维",
        judgmentQuality: "先判断是否值得做，而不是直接列功能。",
        tradeoffQuality: "说明为什么先放弃低频客户的定制需求。",
        attributionDepth: "把增长变化拆成渠道、人群和激活动作。",
        landingRigor: "用一周灰度和续费风险指标验证。",
        migrationCheck: "上一题没有把取舍标准迁移到新场景，仍然停留在功能清单。",
        href: "/training/history/record-1",
      },
    ],
  });

  const trainingPrescription = plan.recommendations.find(
    (item) => item.type === "training"
  );
  const reviewPrescription = plan.recommendations.find(
    (item) => item.type === "review"
  );

  assert.equal(trainingPrescription.id, "thinking-upgrade-snap-thinking-1");
  assert.match(trainingPrescription.title, /补上 战略思维 的迁移缺口/);
  assert.match(trainingPrescription.reason, /上一题没有把取舍标准迁移到新场景/);
  assert.match(trainingPrescription.reason, /下一题先补迁移/);
  assert.match(trainingPrescription.href, /thinking_training/);
  assert.equal(trainingPrescription.evidence, "思维升级卡 2026-07-08");
  assert.equal(reviewPrescription.href, "/training/history/record-1");
  assert.match(reviewPrescription.reason, /取舍标准迁移到新场景/);
});

test("uses the outcome goal brief to frame recommendations around the user's target", () => {
  const plan = buildRecommendationPlan(
    {
      summary: {
        overallScore: 72,
        overallGrade: "B",
        evidenceCount: 8,
        snapshotCount: 3,
        lastEvidenceAt: "2026-07-08T12:00:00.000Z",
      },
      dimensions: [
        {
          id: "system_design",
          label: "系统设计能力",
          shortLabel: "系统设计",
          score: 64,
          grade: "C",
          diagnosisScore: 66,
          trainingAverage: 62,
          evidenceCount: 4,
          lastEvidenceAt: "2026-07-08T10:00:00.000Z",
          insight: "复杂角色和异常路径还需要补强。",
        },
      ],
      weakestDimensions: [],
      strongestDimensions: [],
      careerReadiness: {
        label: "还需补项目证据",
        score: 5,
        evaluatedInterviewCount: 2,
        answeredInterviewCount: 3,
        nextAction: "补充项目证据并准备高压追问。",
      },
      focusPlan: {
        title: "优先补强 系统设计",
        reason: "系统设计需要补强角色、权限和异常路径。",
        href: "/training/session",
        targetDimension: "system_design",
      },
      storyAssets: [],
      thinkingAssets: [],
    },
    {
      targetRole: "高级 B 端产品经理",
      targetScenario: "30 天内面试平台产品负责人",
      targetDeadline: "30 天内",
    }
  );

  const trainingPrescription = plan.recommendations.find(
    (item) => item.type === "training"
  );
  const interviewPrescription = plan.recommendations.find(
    (item) => item.type === "interview"
  );

  assert.match(trainingPrescription.title, /高级 B 端产品经理/);
  assert.match(trainingPrescription.reason, /30 天内面试平台产品负责人/);
  assert.match(trainingPrescription.reason, /30 天内/);
  assert.match(interviewPrescription.reason, /高级 B 端产品经理/);
});
