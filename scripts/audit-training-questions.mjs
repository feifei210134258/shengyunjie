#!/usr/bin/env node

import {
  calculateChineseTrigramSimilarity,
  getTrainingQuestionText,
  validateGeneratedTrainingQuestion,
} from "../src/lib/training/question-generation.ts";

const DIMENSIONS = [
  "战略思维",
  "系统设计能力",
  "数据决策能力",
  "用户洞察与需求管理",
  "商业思维",
];

function readArg(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function makeFixture(dimension, index) {
  const scenarios = [
    "采购平台的大客户收入增长，但每个客户都要求不同审批节点，交付团队已无法按期支持存量客户。",
    "制造现场的异常处理跨越班组长、质量经理和供应商，三方对关闭条件的定义互相冲突。",
    "客服自动分流上线后平均响应更快，但续费客户的升级投诉反而增加，现有样本只覆盖活跃客户。",
    "人事系统中采购负责人要求统一权限，实际使用者认为这会让临时调岗流程无法完成。",
    "协同产品的高阶套餐签约增加，但实施和客户成功成本同步上涨，部分客户只使用基础能力。",
  ];
  const tasks = [
    "请决定下一阶段应承诺什么、停止什么，并说明哪条新证据会改变你的选择。",
    "请判断产品边界应如何划分，并说明异常状态由谁处理以及如何恢复。",
    "请排列最值得优先验证的解释，并给出足以触发产品动作的判断条件。",
    "请定义真正需要解决的问题，并说明如何处理不同角色之间不可同时满足的诉求。",
    "请判断当前增长是否值得继续投入，并说明价值、成本和转向条件。",
  ];
  return {
    title: `开放判断 ${index + 1}`,
    scenario: scenarios[index],
    task: tasks[index],
    defaultHint: "先找出谁获得价值、谁承担成本。",
    secondaryHint: "注意当前信息中仍然没有被验证的关键假设。",
    evaluationCriteria: [
      {
        id: "specific_judgment",
        label: "特定判断",
        description: "是否根据题设做出有边界的具体判断",
        weight: 100,
      },
    ],
    questionMeta: {
      dimension,
      subSkillId: `fixture.${index}`,
      archetypeId: "decision_memo",
      contextFamily: `fixture_context_${index}`,
      productStage: "validation",
      tensionId: `fixture_tension_${index}`,
      answerFormat: "结构化产品判断",
      signature: `${dimension}::fixture.${index}::decision_memo::fixture_context_${index}::validation::fixture_tension_${index}`,
    },
  };
}

function fixtureQuestions() {
  return DIMENSIONS.map(makeFixture);
}

async function fetchLiveQuestions(baseUrl) {
  let generationRetryCount = 0;
  const batches = await Promise.all(
    DIMENSIONS.map(async (dimension) => {
      const questions = [];
      const excludedSignatures = [];
      for (let index = 0; index < 5; index += 1) {
        let generated;
        let lastError = "未知错误";
        for (let requestAttempt = 0; requestAttempt < 3; requestAttempt += 1) {
          const response = await fetch(`${baseUrl}/api/train`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "generate",
              dimension,
              excludedSignatures,
            }),
          });
          const payload = await response.json();
          if (response.ok && payload.question) {
            generated = payload.question;
            break;
          }
          lastError = payload.error || String(response.status);
          generationRetryCount += 1;
        }
        if (!generated) {
          throw new Error(`${dimension} 第 ${index + 1} 题生成失败：${lastError}`);
        }
        questions.push(generated);
        excludedSignatures.push(generated.questionMeta.signature);
      }
      return questions;
    })
  );

  return { questions: batches.flat(), generationRetryCount };
}

function auditQuestions(questions) {
  const signatures = questions.map((item) => item.questionMeta.signature);
  const coverageByDimension = {};
  const contextConcentration = {};
  let methodLeakCount = 0;
  let hardIssueCount = 0;

  for (const dimension of DIMENSIONS) {
    const selected = questions.filter(
      (item) => item.questionMeta.dimension === dimension
    );
    const contexts = new Map();
    for (const item of selected) {
      contexts.set(
        item.questionMeta.contextFamily,
        (contexts.get(item.questionMeta.contextFamily) || 0) + 1
      );
      const issues = validateGeneratedTrainingQuestion(item, []);
      methodLeakCount += issues.filter(
        (issue) => issue.code === "answer_leak" || issue.code === "source_leak"
      ).length;
      hardIssueCount += issues.filter((issue) => issue.severity === "hard").length;
    }
    coverageByDimension[dimension] = {
      count: selected.length,
      uniqueSubskills: new Set(selected.map((item) => item.questionMeta.subSkillId))
        .size,
      uniqueArchetypes: new Set(
        selected.map((item) => item.questionMeta.archetypeId)
      ).size,
      uniquePairs: new Set(
        selected.map(
          (item) =>
            `${item.questionMeta.subSkillId}|${item.questionMeta.archetypeId}`
        )
      ).size,
    };
    const maxContextCount = Math.max(0, ...contexts.values());
    contextConcentration[dimension] = selected.length
      ? Number((maxContextCount / selected.length).toFixed(2))
      : 0;
  }

  const similarityPairs = [];
  for (let left = 0; left < questions.length; left += 1) {
    for (let right = left + 1; right < questions.length; right += 1) {
      const similarity = calculateChineseTrigramSimilarity(
        getTrainingQuestionText(questions[left]),
        getTrainingQuestionText(questions[right])
      );
      similarityPairs.push({
        left: signatures[left],
        right: signatures[right],
        similarity: Number(similarity.toFixed(3)),
      });
    }
  }
  similarityPairs.sort((left, right) => right.similarity - left.similarity);

  return {
    total: questions.length,
    uniqueSignatures: new Set(signatures).size,
    coverageByDimension,
    maxTextSimilarity: similarityPairs[0]?.similarity || 0,
    topSimilarityPairs: similarityPairs.slice(0, 5),
    methodLeakCount,
    hardIssueCount,
    contextConcentration,
  };
}

function assertAudit(metrics, fixtureMode) {
  const expectedTotal = fixtureMode ? DIMENSIONS.length : DIMENSIONS.length * 5;
  const problems = [];
  if (metrics.total !== expectedTotal) problems.push("题目数量不完整");
  if (metrics.uniqueSignatures !== metrics.total) problems.push("存在重复签名");
  if (metrics.methodLeakCount > 0) problems.push("题面泄露了方法或答题步骤");
  if (metrics.hardIssueCount > 0) problems.push("存在硬性质量问题");
  if (!fixtureMode) {
    for (const [dimension, coverage] of Object.entries(
      metrics.coverageByDimension
    )) {
      if (coverage.uniqueSubskills < 5) problems.push(`${dimension} 子能力覆盖不足`);
      if (coverage.uniquePairs < 5) problems.push(`${dimension} 题型组合重复`);
    }
  }
  if (problems.length) throw new Error(problems.join("；"));
}

const fixtureMode = process.argv.includes("--fixture");
const baseUrl = readArg(
  "--base-url",
  process.env.TRAINING_AUDIT_BASE_URL || "http://127.0.0.1:3000"
).replace(/\/$/, "");
const liveResult = fixtureMode
  ? { questions: fixtureQuestions(), generationRetryCount: 0 }
  : await fetchLiveQuestions(baseUrl);
const metrics = {
  ...auditQuestions(liveResult.questions),
  generationRetryCount: liveResult.generationRetryCount,
};
process.stdout.write(`${JSON.stringify(metrics, null, 2)}\n`);
assertAudit(metrics, fixtureMode);
