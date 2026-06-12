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
  improved_answer: string;
  next_practice: string;
}

export interface TrainingPersonalization {
  focusDimension: string | null;
  weakDimensions: string[];
  recentLowDimensions: string[];
  recentGaps: string[];
  recentQuestions: string[];
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
    improved_answer: normalizeText(
      data.improved_answer ?? data.rewrite_example,
      "改写示范：我不会先急着列功能，而是先确认这个问题影响的是哪类客户、哪个流程节点和哪个业务指标。确认影响面后，我会把方案拆成快速验证和长期机制两层，先用低成本方案验证价值，再决定是否沉淀成平台能力。"
    ),
    next_practice: normalizeText(
      data.next_practice ?? data.next_exercise,
      "下一题前，先把答案压缩成 5 句话：目标、证据、方案、取舍、结果。"
    ),
  };
}

export function parseGeneratedQuestionText(text: string) {
  const raw = String(text || "").trim();
  let reason = "";
  let question = raw;

  const inlineReasonMatch = raw.match(
    /^【(?:为什么练这题|推荐理由)[:：]\s*([^】]+)】\s*/i
  );
  const blockReasonMatch = raw.match(
    /^【(?:为什么练这题|推荐理由)】\s*([\s\S]*?)(?:\n{2,}|(?:\r?\n)?题目正文\s*[：:])/i
  );
  const plainReasonMatch = raw.match(
    /^(?:为什么练这题|推荐理由)\s*[：:]\s*([\s\S]*?)(?:\n{2,}|(?:\r?\n)?题目正文\s*[：:])/i
  );

  if (inlineReasonMatch) {
    reason = inlineReasonMatch[1]?.trim() || "";
    question = raw.slice(inlineReasonMatch[0].length).trim();
  } else if (blockReasonMatch) {
    reason = blockReasonMatch[1]?.trim() || "";
    question = raw.slice(blockReasonMatch[0].length).trim();
  } else if (plainReasonMatch) {
    reason = plainReasonMatch[1]?.trim() || "";
    question = raw.slice(plainReasonMatch[0].length).trim();
  }

  question = question
    .replace(/^【难度：[^】]+】\s*/i, "")
    .replace(/\*\*/g, "")
    .replace(/^#{1,6}\s*/, "")
    .replace(/^题目正文\s*[：:]\s*/i, "")
    .replace(/^\s*题目\s*[：:]\s*/i, "")
    .replace(/^【题目】\s*/i, "")
    .trim();

  return { reason, question };
}

export function buildTrainingPersonalization(input: {
  requestedDimension?: string;
  latestReport?: any;
  recentRecords?: any[];
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
    averageScore,
    recommendationReason:
      reasonParts.join("；") || "先完成一题高阶 PM 场景题，用答案质量校准当前能力。",
  };
}
