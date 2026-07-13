import {
  getAnswerFormat,
  getArchetypeTaskBrief,
  getCapabilitiesForDimension,
  isTrainingDimension,
} from "./capability-catalog.ts";
import type {
  TrainingArchetypeId,
  TrainingCapabilityDefinition,
  TrainingDimension,
} from "./capability-catalog.ts";

export interface TrainingQuestionMeta {
  dimension: TrainingDimension;
  subSkillId: string;
  archetypeId: TrainingArchetypeId;
  contextFamily: string;
  productStage: string;
  tensionId: string;
  answerFormat: string;
  signature: string;
}

export interface TrainingEvaluationCriterion {
  id: string;
  label: string;
  description: string;
  weight: number;
}

export interface GeneratedTrainingQuestion {
  title: string;
  scenario: string;
  task: string;
  defaultHint: string;
  secondaryHint: string;
  evaluationCriteria: TrainingEvaluationCriterion[];
  questionMeta: TrainingQuestionMeta;
}

export interface SelectedTrainingTarget {
  capability: TrainingCapabilityDefinition;
  meta: TrainingQuestionMeta;
  contextLabel: string;
  productStageLabel: string;
  tensionLabel: string;
  evidenceState: string;
}

export interface QuestionValidationIssue {
  code:
    | "missing_field"
    | "answer_leak"
    | "source_leak"
    | "too_long"
    | "too_similar";
  severity: "hard" | "soft";
  message: string;
  similarity?: number;
}

const CONTEXT_FAMILIES = [
  { id: "procurement", label: "企业采购与供应商协同" },
  { id: "manufacturing", label: "制造业计划、质量与现场协同" },
  { id: "finance", label: "企业费控、对账与财务管理" },
  { id: "hr", label: "人力资源、组织与绩效管理" },
  { id: "customer_service", label: "客户服务与客户成功" },
  { id: "workflow", label: "审批、合同与业务流程自动化" },
  { id: "analytics", label: "企业数据分析与决策支持" },
  { id: "developer_platform", label: "开发者平台与企业集成" },
  { id: "supply_chain", label: "供应链履约、库存与物流" },
  { id: "collaboration", label: "企业协同、知识与项目管理" },
] as const;

const PRODUCT_STAGES = [
  { id: "validation", label: "新场景尚在验证" },
  { id: "growth", label: "产品进入规模增长期" },
  { id: "enterprise_expansion", label: "正在向更复杂的企业客户扩展" },
  { id: "platformization", label: "业务正从单点产品走向平台化" },
  { id: "maturity", label: "产品成熟且开始关注效率与可持续增长" },
] as const;

const TENSIONS = [
  { id: "standard_custom", label: "标准化能力与大客户定制冲突" },
  { id: "short_long", label: "短期业务结果与长期能力建设冲突" },
  { id: "compliance_efficiency", label: "风险治理与业务效率冲突" },
  { id: "local_system", label: "局部效率与全链路结果冲突" },
  { id: "new_existing", label: "新客获取与存量客户价值冲突" },
  { id: "buyer_user", label: "采购决策者与高频使用者价值冲突" },
  { id: "speed_evidence", label: "决策速度与证据完整度冲突" },
  { id: "control_flexibility", label: "统一控制与一线灵活性冲突" },
  { id: "growth_quality", label: "规模增长与交付质量冲突" },
  { id: "automation_accountability", label: "自动化效率与责任可追溯性冲突" },
] as const;

const EVIDENCE_STATES = [
  "已知信息不完整，但等待也有明确成本",
  "多个来源的信号相互冲突",
  "现有数据可能存在选择偏差",
  "外部条件正在变化，过去经验不能直接外推",
] as const;

function countBy<T>(items: T[], read: (item: T) => string) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = read(item);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

function makeCandidate(
  dimension: TrainingDimension,
  capability: TrainingCapabilityDefinition,
  archetypeId: TrainingArchetypeId,
  capabilityIndex: number,
  archetypeIndex: number
): SelectedTrainingTarget {
  const offset = capabilityIndex * 3 + archetypeIndex;
  const context = CONTEXT_FAMILIES[offset % CONTEXT_FAMILIES.length];
  const stage = PRODUCT_STAGES[(capabilityIndex + archetypeIndex) % PRODUCT_STAGES.length];
  const tension = TENSIONS[(capabilityIndex * 2 + archetypeIndex) % TENSIONS.length];
  const answerFormat = getAnswerFormat(archetypeId);
  const signature = [
    dimension,
    capability.id,
    archetypeId,
    context.id,
    stage.id,
    tension.id,
  ].join("::");

  return {
    capability,
    meta: {
      dimension,
      subSkillId: capability.id,
      archetypeId,
      contextFamily: context.id,
      productStage: stage.id,
      tensionId: tension.id,
      answerFormat,
      signature,
    },
    contextLabel: context.label,
    productStageLabel: stage.label,
    tensionLabel: tension.label,
    evidenceState: EVIDENCE_STATES[offset % EVIDENCE_STATES.length],
  };
}

export function selectTrainingTarget(input: {
  dimension: string;
  recentMeta?: TrainingQuestionMeta[];
  excludedSignatures?: string[];
  random?: () => number;
}): SelectedTrainingTarget {
  if (!isTrainingDimension(input.dimension)) {
    throw new Error("不支持的训练维度");
  }

  const capabilities = getCapabilitiesForDimension(input.dimension);
  if (!capabilities.length) throw new Error("训练维度缺少能力定义");

  const recent = (input.recentMeta || []).filter(
    (item) => item?.dimension === input.dimension
  );
  const excluded = new Set(input.excludedSignatures || []);
  const currentRoundMeta = (input.excludedSignatures || [])
    .map((signature) => {
      const [dimension, subSkillId, archetypeId, contextFamily, productStage, tensionId] =
        signature.split("::");
      if (!dimension || !subSkillId || !archetypeId) return null;
      return {
        dimension,
        subSkillId,
        archetypeId,
        contextFamily,
        productStage,
        tensionId,
      };
    })
    .filter(Boolean) as Array<{
    dimension: string;
    subSkillId: string;
    archetypeId: string;
    contextFamily: string;
    productStage: string;
    tensionId: string;
  }>;
  const subSkillCounts = countBy(recent, (item) => item.subSkillId);
  const archetypeCounts = countBy(recent, (item) => item.archetypeId);
  const pairCounts = countBy(
    recent,
    (item) => `${item.subSkillId}|${item.archetypeId}`
  );
  const contextCounts = countBy(recent, (item) => item.contextFamily);
  const tensionCounts = countBy(recent, (item) => item.tensionId);
  const currentDimensionMeta = currentRoundMeta.filter(
    (item) => item.dimension === input.dimension
  );
  const currentSubSkillCounts = countBy(
    currentDimensionMeta,
    (item) => item.subSkillId
  );
  const currentArchetypeCounts = countBy(
    currentRoundMeta,
    (item) => item.archetypeId
  );
  const currentContextCounts = countBy(
    currentRoundMeta,
    (item) => item.contextFamily
  );
  const currentTensionCounts = countBy(
    currentRoundMeta,
    (item) => item.tensionId
  );
  const candidates = capabilities.flatMap((capability, capabilityIndex) =>
    capability.archetypes.map((archetypeId, archetypeIndex) =>
      makeCandidate(
        input.dimension as TrainingDimension,
        capability,
        archetypeId,
        capabilityIndex,
        archetypeIndex
      )
    )
  );
  const available = candidates.filter(
    (candidate) => !excluded.has(candidate.meta.signature)
  );
  const pool = available.length ? available : candidates;
  const scored = pool.map((candidate) => {
    const pair = `${candidate.meta.subSkillId}|${candidate.meta.archetypeId}`;
    const score =
      (currentSubSkillCounts.get(candidate.meta.subSkillId) || 0) * 200 +
      (currentArchetypeCounts.get(candidate.meta.archetypeId) || 0) * 120 +
      (currentContextCounts.get(candidate.meta.contextFamily) || 0) * 8 +
      (currentTensionCounts.get(candidate.meta.tensionId) || 0) * 4 +
      (pairCounts.get(pair) || 0) * 30 +
      (subSkillCounts.get(candidate.meta.subSkillId) || 0) * 12 +
      (archetypeCounts.get(candidate.meta.archetypeId) || 0) * 4 +
      (contextCounts.get(candidate.meta.contextFamily) || 0) * 2 +
      (tensionCounts.get(candidate.meta.tensionId) || 0) * 2;
    return { candidate, score };
  });
  const minScore = Math.min(...scored.map((item) => item.score));
  const best = scored.filter((item) => item.score === minScore);
  const random = input.random || Math.random;
  const index = Math.min(
    best.length - 1,
    Math.floor(Math.max(0, random()) * best.length)
  );

  return best[index].candidate;
}

function normalizeSimilarityText(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/下滑|下跌/g, "下降")
    .replace(/新上线的?|刚上线的?/g, "新")
    .replace(/造成|引起|带来/g, "导致")
    .replace(/是否由/g, "是否")
    .replace(/[为什么练这题目正文请回答分析如何]/g, "")
    .replace(/[\s\p{P}\p{S}]/gu, "");
}

function toTrigrams(value: string) {
  const normalized = normalizeSimilarityText(value);
  const result = new Set<string>();
  if (normalized.length < 3) {
    if (normalized) result.add(normalized);
    return result;
  }
  for (let index = 0; index <= normalized.length - 3; index += 1) {
    result.add(normalized.slice(index, index + 3));
  }
  return result;
}

export function calculateChineseTrigramSimilarity(left: string, right: string) {
  const leftSet = toTrigrams(left);
  const rightSet = toTrigrams(right);
  if (!leftSet.size || !rightSet.size) return 0;
  let intersection = 0;
  for (const value of leftSet) {
    if (rightSet.has(value)) intersection += 1;
  }
  return (2 * intersection) / (leftSet.size + rightSet.size);
}

function normalizeText(value: unknown, fallback = "") {
  const text = String(value || "")
    .replace(/\*\*/g, "")
    .trim();
  return text || fallback;
}

function slugCriterion(value: unknown, index: number) {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.-]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug || `criterion_${index + 1}`;
}

function normalizeCriteria(
  value: unknown,
  capability: TrainingCapabilityDefinition
) {
  const raw = Array.isArray(value) ? value : [];
  const criteria: TrainingEvaluationCriterion[] = raw
    .map((item, index) => {
      const record = (item || {}) as Record<string, unknown>;
      const label = normalizeText(record.label);
      const description = normalizeText(record.description);
      if (!label || !description) return null;
      return {
        id: slugCriterion(record.id, index),
        label,
        description,
        weight: Number(record.weight) || 0,
      };
    })
    .filter((item): item is TrainingEvaluationCriterion => Boolean(item));

  for (const focus of capability.evaluationFocus) {
    if (criteria.length >= 3) break;
    const index = criteria.length;
    criteria.push({
      id: `focus_${index + 1}`,
      label: focus,
      description: `评估回答是否${focus}。`,
      weight: 0,
    });
  }

  const selected = criteria.slice(0, 5);
  const specified = selected.reduce((sum, item) => sum + Math.max(item.weight, 0), 0);
  if (!specified) {
    const base = Math.floor(100 / selected.length);
    selected.forEach((item, index) => {
      item.weight = index === selected.length - 1 ? 100 - base * index : base;
    });
  } else {
    let allocated = 0;
    selected.forEach((item, index) => {
      item.weight =
        index === selected.length - 1
          ? 100 - allocated
          : Math.round((Math.max(item.weight, 0) / specified) * 100);
      allocated += item.weight;
    });
  }
  return selected;
}

export function normalizeGeneratedTrainingQuestion(
  parsed: unknown,
  target: SelectedTrainingTarget
): GeneratedTrainingQuestion {
  const data = (parsed || {}) as Record<string, unknown>;
  return {
    title: normalizeText(data.title, "产品判断题"),
    scenario: normalizeText(data.scenario),
    task: normalizeText(data.task),
    defaultHint: normalizeText(data.default_hint ?? data.defaultHint),
    secondaryHint: normalizeText(data.secondary_hint ?? data.secondaryHint),
    evaluationCriteria: normalizeCriteria(
      data.evaluation_criteria ?? data.evaluationCriteria,
      target.capability
    ),
    questionMeta: target.meta,
  };
}

export function getTrainingQuestionText(question: GeneratedTrainingQuestion) {
  return [question.title, question.scenario, question.task]
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

export function buildQuestionGenerationPrompt(input: {
  target: SelectedTrainingTarget;
  recentQuestions?: string[];
  recentGaps?: string[];
  retryIssues?: string[];
}) {
  const { target } = input;
  const recentQuestions = (input.recentQuestions || []).slice(0, 5);
  const relatedGaps = (input.recentGaps || []).slice(0, 3);
  const retryIssues = (input.retryIssues || []).slice(0, 4);

  return `你是 B 端高级产品思维训练的出题主编。请根据下面的内部题目规格，生成一道需要用户自己识别问题结构的开放诊断题。

内部训练目标（不要逐字复制到题面）：
- 训练维度：${target.meta.dimension}
- 子能力：${target.capability.label}
- 高级行为：${target.capability.advancedBehavior}
- 执行层常见陷阱：${target.capability.executionTrap}
- 题型：${target.meta.archetypeId}
- 题型任务：${getArchetypeTaskBrief(target.meta.archetypeId)}
- 参考答案形式：${target.meta.answerFormat}
- 业务场景：${target.contextLabel}
- 产品阶段：${target.productStageLabel}
- 核心矛盾：${target.tensionLabel}
- 证据状态：${target.evidenceState}
- 评价重点：${target.capability.evaluationFocus.join("；")}

出题原则：
1. 用具体 B 端场景制造一个真实矛盾，至少存在两个可辩护的解释或选择。
2. 让 task 符合“题型任务”，只提出核心认知任务，不列完整答题提纲；scenario 只放题设事实。
3. 默认提示只点一个容易忽略的观察角度；进一步提示只增加一个比较角度或关键未知量。
4. 题面不出现书名、作者或方法论名称（如 JTBD、机会成本、单位经济等），也不虚构品牌内部数据或用营收、年产值等宏大数字堆难度。
5. title + scenario + task 合计不超过 420 个中文字符。

需要避免的近期题目：
${recentQuestions.length ? recentQuestions.map((item, index) => `${index + 1}. ${item}`).join("\n") : "无"}

与本题目标有关的近期盲区（只可自然融入，不得暴露内部评分）：
${relatedGaps.length ? relatedGaps.map((item) => `- ${item}`).join("\n") : "无"}

${retryIssues.length ? `上一次生成未通过，本次必须修正：\n${retryIssues.map((item) => `- ${item}`).join("\n")}` : ""}

只返回 JSON，不要使用 Markdown 代码块，不要添加解释。JSON 结构：
{
  "title": "简短中性标题",
  "scenario": "具体场景和已知信息",
  "task": "需要用户做出的判断",
  "default_hint": "默认显示的一句观察提示",
  "secondary_hint": "用户主动展开后看到的进一步提示",
  "evaluation_criteria": [
    { "id": "english_snake_case", "label": "评价项", "description": "本题中可观察的具体高级产品判断", "weight": 0-100 }
  ]
}
请提供 3-5 个与本题特定认知动作对应的 evaluation_criteria，权重合计 100。`;
}

const METHOD_OR_SOURCE_PATTERN =
  /JTBD|Jobs[- ]to[- ]be[- ]Done|机会成本|第一性原理|单位经济|LTV|CAC|商业模式画布|因果推断|系统思维|《[^\u300b]+》|俞军|王诗沐|Marty Cagan/i;
const EXPLICIT_STEPS_PATTERN =
  /按[^\n。；]{0,30}(?:步|顺序)回答|第一步|第二步|请从以下[\d一二三四五]/i;

export function validateGeneratedTrainingQuestion(
  question: GeneratedTrainingQuestion,
  recentQuestionTexts: string[]
): QuestionValidationIssue[] {
  const issues: QuestionValidationIssue[] = [];
  const publicText = [
    question.title,
    question.scenario,
    question.task,
    question.defaultHint,
    question.secondaryHint,
  ].join("\n");

  const required: Array<[string, string]> = [
    ["场景", question.scenario],
    ["任务", question.task],
    ["默认提示", question.defaultHint],
    ["进一步提示", question.secondaryHint],
  ];
  for (const [label, value] of required) {
    if (!value.trim()) {
      issues.push({
        code: "missing_field",
        severity: "hard",
        message: `缺少${label}`,
      });
    }
  }
  const sourceLeak = publicText.match(METHOD_OR_SOURCE_PATTERN)?.[0];
  if (sourceLeak) {
    issues.push({
      code: "source_leak",
      severity: "hard",
      message: `题面或提示泄露了方法论或资料来源（${sourceLeak}）`,
    });
  }
  if (EXPLICIT_STEPS_PATTERN.test(publicText)) {
    issues.push({
      code: "answer_leak",
      severity: "hard",
      message: "题面直接给出了答题步骤",
    });
  }
  if (getTrainingQuestionText(question).length > 420) {
    issues.push({
      code: "too_long",
      severity: "soft",
      message: "题面超过 420 字",
    });
  }
  const current = getTrainingQuestionText(question);
  const similarity = Math.max(
    0,
    ...recentQuestionTexts.map((item) =>
      calculateChineseTrigramSimilarity(current, item)
    )
  );
  if (similarity >= 0.32) {
    issues.push({
      code: "too_similar",
      severity: "soft",
      message: `与近期题目的文本相似度过高（${similarity.toFixed(2)}）`,
      similarity,
    });
  }
  return issues;
}

export function collectExcludedQuestionSignatures(
  questions: Record<string, unknown>
) {
  const signatures: string[] = [];
  for (const value of Object.values(questions || {})) {
    const state = (value || {}) as {
      data?: { questionMeta?: { signature?: unknown } };
    };
    const signature = String(state.data?.questionMeta?.signature || "").trim();
    if (signature && !signatures.includes(signature)) signatures.push(signature);
  }
  return signatures;
}
