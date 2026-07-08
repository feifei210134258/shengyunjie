export interface TrainingEvaluation {
  overall_score: number;
  scores: {
    understanding: number;
    framework: number;
    solution: number;
    decision_logic: number;
  };
  feedback: string;
  strengths: string[];
  gaps: string[];
  suggestions: string[];
  thinking_framework: string[];
  example_answer: string;
  next_practice: string;
  interview_expression?: {
    opening_judgment: string;
    evidence_hooks: string[];
    follow_up_risks: string[];
    answer_version: string;
  };
  thinking_upgrade?: {
    judgment_quality: string;
    tradeoff_quality: string;
    attribution_depth: string;
    landing_rigor: string;
  };
}

export interface TrainingPersonalization {
  focusDimension: string | null;
  weakDimensions: string[];
  recentLowDimensions: string[];
  recentGaps: string[];
  recentQuestions: string[];
  todayQuestions: string[];
  averageScore: number | null;
  recommendationReason: string;
}

export function parseJsonFromAiText<T = unknown>(text: string): T | null {
  const trimmed = String(text || "").trim();
  if (!trimmed) return null;

  const candidates = [
    trimmed,
    ...Array.from(trimmed.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)).map(
      (match) => match[1]?.trim()
    ),
  ].filter(Boolean) as string[];

  const objectStart = trimmed.indexOf("{");
  const objectEnd = trimmed.lastIndexOf("}");
  if (objectStart >= 0 && objectEnd > objectStart) {
    candidates.push(trimmed.slice(objectStart, objectEnd + 1));
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as T;
    } catch {}
  }

  return null;
}

function normalizeScore(value: unknown, fallback = 5) {
  const score = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(score)) return fallback;
  return Math.min(Math.max(Math.round(score * 10) / 10, 0), 10);
}

function normalizeList(value: unknown, fallback: string[]) {
  if (Array.isArray(value)) {
    const items = value
      .map((item) =>
        String(item || "")
          .trim()
          .replace(/^\d+[.、]\s*/, "")
      )
      .filter(Boolean);
    if (items.length) return items;
  }
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return fallback;
}

function normalizeText(value: unknown, fallback: string) {
  const text = String(value || "").trim();
  return text || fallback;
}

function normalizeInterviewExpression(value: unknown) {
  if (!value || typeof value !== "object") return undefined;
  const data = value as Record<string, unknown>;
  return {
    opening_judgment: normalizeText(
      data.opening_judgment,
      "先用一句话给出判断，再说明业务问题、关键证据和取舍边界。"
    ),
    evidence_hooks: normalizeList(data.evidence_hooks, [
      "补充能被面试官追问的用户、业务或数据证据。",
    ]),
    follow_up_risks: normalizeList(data.follow_up_risks, [
      "准备解释指标归因、反证和落地风险。",
    ]),
    answer_version: normalizeText(
      data.answer_version,
      "面试表达版本：先给判断，再补证据、取舍和复盘结论。"
    ),
  };
}

function normalizeThinkingUpgrade(value: unknown) {
  if (!value || typeof value !== "object") return undefined;
  const data = value as Record<string, unknown>;
  return {
    judgment_quality: normalizeText(
      data.judgment_quality,
      "判断需要更清楚地落到业务矛盾和成功标准。"
    ),
    tradeoff_quality: normalizeText(
      data.tradeoff_quality,
      "取舍需要说明优先做什么、暂时放弃什么，以及为什么。"
    ),
    attribution_depth: normalizeText(
      data.attribution_depth,
      "归因需要补充证据来源、反证指标和噪音排除。"
    ),
    landing_rigor: normalizeText(
      data.landing_rigor,
      "落地需要说明节奏、风险护栏和复盘动作。"
    ),
  };
}

export function normalizeTrainingEvaluation(parsed: unknown): TrainingEvaluation {
  const data = (parsed || {}) as Record<string, any>;
  const rawScores = (data.scores || {}) as Record<string, unknown>;
  const understanding = normalizeScore(
    data.understanding ?? rawScores.understanding,
    5
  );
  const framework = normalizeScore(data.framework ?? rawScores.framework, 5);
  const solution = normalizeScore(data.solution ?? rawScores.solution, 5);
  const decisionLogic = normalizeScore(
    data.decision_logic ?? data.decisionLogic ?? rawScores.decision_logic,
    5
  );
  const overallFallback =
    Math.round(((understanding + framework + solution + decisionLogic) / 4) * 10) /
    10;

  return {
    overall_score: normalizeScore(
      data.overall_score ?? data.overall,
      overallFallback
    ),
    scores: {
      understanding,
      framework,
      solution,
      decision_logic: decisionLogic,
    },
    feedback: normalizeText(
      data.feedback ?? data.overall_feedback,
      "这份回答已经覆盖了题目方向，但还需要补充更清晰的业务目标、判断依据、取舍过程和结果证据。"
    ),
    strengths: normalizeList(data.strengths ?? data.strength, [
      "能围绕题目给出基本思考，说明你已经抓住了讨论入口。",
    ]),
    gaps: normalizeList(data.gaps ?? data.weaknesses ?? data.weakness, [
      "缺少足够具体的证据链、取舍标准和复盘结论，面试官难以判断你的真实产品判断力。",
    ]),
    suggestions: normalizeList(data.suggestions ?? data.improvement, [
      "按“问题定义 - 证据判断 - 方案取舍 - 落地验证 - 复盘升级”的顺序重答一遍。",
    ]),
    thinking_framework: normalizeList(data.thinking_framework, [
      "用一句话说明业务问题和成功指标",
      "列出你掌握的用户、业务和数据证据",
      "对比至少两个方案，并说明取舍标准",
      "说明上线验证方式、风险和复盘动作",
    ]),
    example_answer: normalizeText(
      data.example_answer,
      "示例：我会先把问题定义为某类客户在关键流程中的转化或效率损失，再用访谈、工单和行为数据确认影响面。方案上先对比轻量提示、流程改造和机制沉淀三种路径，选择能最快验证价值且不破坏现有流程的一种，最后用核心指标和客户反馈复盘是否继续投入。"
    ),
    next_practice: normalizeText(
      data.next_practice ?? data.next_exercise,
      "下一题前，先把答案压缩成 5 句话：目标、证据、方案、取舍、结果。"
    ),
    interview_expression: normalizeInterviewExpression(data.interview_expression),
    thinking_upgrade: normalizeThinkingUpgrade(data.thinking_upgrade),
  };
}

export function parseGeneratedQuestionText(text: string) {
  const raw = String(text || "").trim();
  let reason = "";
  let hint = "";
  let question = raw;

  const sectionPattern =
    /(?:^|\n)【(为什么练这题|推荐理由|答题提点)[:：]?([^】]*)】\s*([\s\S]*?)(?=\n【(?:为什么练这题|推荐理由|答题提点)[:：]?[^】]*】|\n{0,2}题目正文\s*[：:]|$)/gi;
  const sections = Array.from(raw.matchAll(sectionPattern));

  if (sections.length) {
    for (const match of sections) {
      const label = match[1];
      const inlineValue = match[2]?.trim() || "";
      const blockValue = match[3]?.trim() || "";
      const value = inlineValue || blockValue;
      if (/为什么练这题|推荐理由/.test(label) && value) reason = value;
      if (/答题提点/.test(label) && value) hint = value;
    }

    const lastSection = sections[sections.length - 1];
    const afterSections = raw.slice(
      (lastSection.index || 0) + lastSection[0].length
    );
    const explicitQuestionMatch =
      raw.match(/(?:^|\n)题目正文\s*[：:]\s*([\s\S]*)/i) ||
      raw.match(/(?:^|\n)题目\s*[：:]\s*([\s\S]*)/i);
    const lastInlineValue = lastSection[2]?.trim() || "";
    const lastBlockValue = lastSection[3]?.trim() || "";
    question =
      explicitQuestionMatch?.[1]?.trim() ||
      (lastInlineValue ? lastBlockValue : "") ||
      afterSections.trim();
  }

  const inlineReasonMatch = raw.match(
    /^【(?:为什么练这题|推荐理由)[:：]\s*([^】]+)】\s*/i
  );
  const blockReasonMatch = raw.match(
    /^【(?:为什么练这题|推荐理由)】\s*([\s\S]*?)(?:\n{2,}|(?:\r?\n)?题目正文\s*[：:])/i
  );
  const plainReasonMatch = raw.match(
    /^(?:为什么练这题|推荐理由)\s*[：:]\s*([\s\S]*?)(?:\n{2,}|(?:\r?\n)?题目正文\s*[：:])/i
  );

  if (!sections.length && inlineReasonMatch) {
    reason = inlineReasonMatch[1]?.trim() || "";
    question = raw.slice(inlineReasonMatch[0].length).trim();
  } else if (!sections.length && blockReasonMatch) {
    reason = blockReasonMatch[1]?.trim() || "";
    question = raw.slice(blockReasonMatch[0].length).trim();
  } else if (!sections.length && plainReasonMatch) {
    reason = plainReasonMatch[1]?.trim() || "";
    question = raw.slice(plainReasonMatch[0].length).trim();
  }

  const leadingInlineHintMatch = question.match(
    /^【答题提点[:：]\s*([^】]+)】\s*/i
  );
  if (leadingInlineHintMatch) {
    hint = hint || leadingInlineHintMatch[1]?.trim() || "";
    question = question.slice(leadingInlineHintMatch[0].length).trim();
  }

  question = question
    .replace(/^【难度：[^】]+】\s*/i, "")
    .replace(/\*\*/g, "")
    .replace(/^#{1,6}\s*/, "")
    .replace(/^题目正文\s*[：:]\s*/i, "")
    .replace(/^\s*题目\s*[：:]\s*/i, "")
    .replace(/^【题目】\s*/i, "")
    .trim();

  hint = hint.replace(/\s+/g, " ").trim();

  return { reason, hint, question };
}

export function buildTrainingPersonalization(input: {
  requestedDimension?: string;
  latestReport?: any;
  recentRecords?: any[];
  todayQuestions?: string[];
  latestBootcampSession?: any;
}): TrainingPersonalization {
  const weakFromReport =
    input.latestReport?.dimension_scores
      ?.slice()
      ?.sort((a: any, b: any) => Number(a.score || 0) - Number(b.score || 0))
      ?.slice(0, 2)
      ?.map((item: any) => item.label || item.dimension)
      ?.filter(Boolean) || [];

  const recentRecords = input.recentRecords || [];
  const recentLowDimensions = recentRecords
    .filter((record) => Number(record.score || 0) > 0 && Number(record.score) < 70)
    .map((record) => record.dimension)
    .filter(Boolean);
  const recentGaps = recentRecords
    .flatMap((record) => {
      const feedback = record.ai_feedback || {};
      return feedback.gaps || feedback.weaknesses || [];
    })
    .map((gap) => String(gap).trim())
    .filter(Boolean)
    .slice(0, 4);
  const recentQuestions = recentRecords
    .map((record) => String(record.question_scenario || "").trim())
    .filter(Boolean)
    .slice(0, 5);
  const todayQuestions = Array.from(
    new Set((input.todayQuestions || []).map((item) => String(item || "").trim()).filter(Boolean))
  ).slice(0, 5);
  const scored = recentRecords
    .map((record) => Number(record.score))
    .filter((score) => Number.isFinite(score) && score > 0);
  const averageScore = scored.length
    ? Math.round((scored.reduce((sum, score) => sum + score, 0) / scored.length / 10) * 10) /
      10
    : null;

  const bootcampWeak =
    input.latestBootcampSession?.weakness_prediction?.weak_dimensions
      ?.filter((item: any) => item.severity === "high")
      ?.map((item: any) => item.dimension)
      ?.filter(Boolean) || [];
  const weakDimensions = Array.from(
    new Set([...weakFromReport, ...recentLowDimensions, ...bootcampWeak])
  ).slice(0, 4);
  const focusDimension =
    input.requestedDimension || weakDimensions[0] || weakFromReport[0] || null;
  const reasonParts = [
    weakDimensions.length
      ? `当前短板集中在 ${weakDimensions.slice(0, 2).join("、")}`
      : "",
    averageScore ? `近几次训练均分 ${averageScore}/10` : "",
    recentGaps[0] ? `最近反馈提示：${recentGaps[0]}` : "",
  ].filter(Boolean);

  return {
    focusDimension,
    weakDimensions,
    recentLowDimensions: Array.from(new Set(recentLowDimensions)).slice(0, 3),
    recentGaps,
    recentQuestions,
    todayQuestions,
    averageScore,
    recommendationReason:
      reasonParts.join("；") || "先完成一题高阶 PM 场景题，用答案质量校准当前能力。",
  };
}
