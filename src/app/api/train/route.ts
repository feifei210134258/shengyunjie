import { generateText } from "ai";
import { NextResponse } from "next/server";
import { getChatModel, getThinkingModel } from "@/lib/ai";
import { isTrainingDimension } from "@/lib/training/capability-catalog";
import {
  buildTrainingPersonalization,
  normalizeTrainingEvaluation,
  parseJsonFromAiText,
} from "@/lib/training/personalization";
import {
  buildQuestionGenerationPrompt,
  getTrainingQuestionText,
  normalizeGeneratedTrainingQuestion,
  selectTrainingTarget,
  validateGeneratedTrainingQuestion,
} from "@/lib/training/question-generation";
import type {
  GeneratedTrainingQuestion,
  QuestionValidationIssue,
  TrainingQuestionMeta,
} from "@/lib/training/question-generation";
import { createServerClient } from "@/lib/supabase-server";

async function getPersonalizationContext(dimension?: string) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return buildTrainingPersonalization({ requestedDimension: dimension });
    }

    const [reportResult, recordsResult, sessionResult] = await Promise.all([
      supabase
        .from("diagnosis_reports")
        .select("*, dimension_scores(*)")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("training_records")
        .select("dimension, question_scenario, score, ai_feedback, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("bootcamp_sessions")
        .select("weakness_prediction")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    const errors = [reportResult.error, recordsResult.error, sessionResult.error].filter(
      Boolean
    );
    if (errors.length) {
      console.error(
        "读取训练个性化上下文失败:",
        errors.map((error) => error?.message).join(" | ")
      );
    }

    return buildTrainingPersonalization({
      requestedDimension: dimension,
      latestReport: reportResult.data,
      recentRecords: recordsResult.data || [],
      latestBootcampSession: sessionResult.data,
    });
  } catch (error) {
    console.error("训练个性化上下文异常:", error);
    return buildTrainingPersonalization({ requestedDimension: dimension });
  }
}

function hasHardIssues(issues: QuestionValidationIssue[]) {
  return issues.some((issue) => issue.severity === "hard");
}

function questionCandidateScore(candidate: {
  question: GeneratedTrainingQuestion;
  issues: QuestionValidationIssue[];
}) {
  return candidate.issues.reduce(
    (score, issue) =>
      score +
      (issue.severity === "hard" ? 100 : 10) +
      (issue.similarity || 0) * 10,
    0
  );
}

async function generateQuestion(input: {
  apiKey: string;
  dimension: string;
  excludedSignatures: string[];
}) {
  const personalization = await getPersonalizationContext(input.dimension);
  const target = selectTrainingTarget({
    dimension: input.dimension,
    recentMeta: personalization.recentQuestionMeta,
    excludedSignatures: input.excludedSignatures,
  });
  const model = getChatModel(input.apiKey, "deepseek-v4-flash");
  const candidates: Array<{
    question: GeneratedTrainingQuestion;
    issues: QuestionValidationIssue[];
  }> = [];
  let retryIssues: string[] = [];

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { text } = await generateText({
      model,
      system: buildQuestionGenerationPrompt({
        target,
        recentQuestions: personalization.recentQuestions,
        recentGaps: personalization.recentGaps,
        retryIssues,
      }),
      messages: [
        {
          role: "user",
          content: "按题目规格生成一道开放诊断训练题，只返回 JSON。",
        },
      ],
    });
    const parsed = parseJsonFromAiText(text);
    if (!parsed) {
      retryIssues = ["JSON 无法解析，必须返回完整的单个 JSON 对象"];
      continue;
    }

    const question = normalizeGeneratedTrainingQuestion(parsed, target);
    const issues = validateGeneratedTrainingQuestion(
      question,
      personalization.recentQuestions
    );
    candidates.push({ question, issues });
    if (!issues.length) return question;
    retryIssues = issues.map((issue) => issue.message);
  }

  const usable = candidates.filter((candidate) => !hasHardIssues(candidate.issues));
  if (!usable.length) {
    throw new Error("连续两次出题未通过质量校验");
  }
  return usable.sort(
    (left, right) => questionCandidateScore(left) - questionCandidateScore(right)
  )[0].question;
}

function buildEvaluationPrompt(input: {
  dimension: string;
  question: string;
  userAnswer: string;
  questionData?: GeneratedTrainingQuestion;
}) {
  const criteria = input.questionData?.evaluationCriteria || [];
  const answerFormat =
    input.questionData?.questionMeta.answerFormat || "结构化产品判断";

  return `你是一位要求严格但不刻薄的 B 端产品教练。你的目标是识别用户是否做出了本题特定的高级产品判断，而不是奖励任何题目都能套用的通用表达。

在评价用户答案前，先在内部独立求解题目，不要把用户答案润色后当成参考答案。

题目维度：${input.dimension}
参考答案形式：${answerFormat}
本题特定评价标准：
${criteria.length ? criteria.map((item) => `- ${item.id} | ${item.label} | 权重 ${item.weight}% | ${item.description}`).join("\n") : "- 问题定义、证据判断、取舍和行动边界"}

评价规则：
1. criterion_scores 必须逐项对应上面的特定标准，引用用户原文作为证据。
2. 如果用户只写了“明确目标、看数据、对比方案、小范围验证”等通用套话，但没有完成特定标准，综合分不得超过 5 分。
3. reference_answer 必须是独立完整的参考答案，符合指定形式，明确结论、假设、核心证据、取舍、行动与改变结论的条件。
4. alternative_path 说明另一种选择在什么题设条件下更优，避免将产品判断伪装成唯一正确答案。
5. 不显示书名、作者或方法论来源。

只返回 JSON，不要使用 Markdown 代码块。JSON 结构：
{
  "overall_score": 0-10,
  "understanding": 0-10,
  "framework": 0-10,
  "solution": 0-10,
  "decision_logic": 0-10,
  "criterion_scores": [{ "id": "与题目标准相同", "label": "评价项", "score": 0-10, "evidence": "用户原文证据", "gap": "具体差距" }],
  "feedback": "总体评价",
  "strengths": ["具体亮点"],
  "gaps": ["具体盲区"],
  "suggestions": ["可执行改进建议"],
  "thinking_framework": ["针对本题的思考支架，4-6 条"],
  "reference_answer": "独立完整的参考答案",
  "improved_answer": "对用户原回答的针对性改写",
  "alternative_path": "另一种可辩护路径及成立条件",
  "next_practice": "下一题前最该练的一件事"
}`;
}

function normalizeQuestionData(value: unknown) {
  if (!value || typeof value !== "object") return undefined;
  const data = value as GeneratedTrainingQuestion;
  if (!data.questionMeta?.signature || !data.scenario || !data.task) return undefined;
  return data;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const action = String(body.action || "");
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API Key 未配置" }, { status: 400 });
    }

    if (action === "generate") {
      const dimension = String(body.dimension || "");
      if (!isTrainingDimension(dimension)) {
        return NextResponse.json({ error: "不支持的训练维度" }, { status: 400 });
      }
      const excludedSignatures = Array.isArray(body.excludedSignatures)
        ? body.excludedSignatures
            .map((item) => String(item || "").trim())
            .filter(Boolean)
            .slice(0, 20)
        : [];
      const question = await generateQuestion({
        apiKey,
        dimension,
        excludedSignatures,
      });
      return NextResponse.json({ question });
    }

    if (action === "analyze") {
      const questionData = normalizeQuestionData(body.questionData);
      const dimension = String(
        questionData?.questionMeta.dimension || body.dimension || "未知"
      );
      const question = questionData
        ? getTrainingQuestionText(questionData)
        : String(body.question || "").trim();
      const userAnswer = String(body.userAnswer || "").trim();
      if (!question || !userAnswer) {
        return NextResponse.json({ error: "缺少题目或用户回答" }, { status: 400 });
      }

      const thinkingModel = getThinkingModel(apiKey, "deepseek-v4-flash");
      const { text } = await generateText({
        model: thinkingModel,
        system: buildEvaluationPrompt({
          dimension,
          question,
          userAnswer,
          questionData,
        }),
        messages: [
          {
            role: "user",
            content: `题目：${question}\n\n用户的回答：${userAnswer}\n\n请给出结构化教练反馈。`,
          },
        ],
      });
      const parsed = parseJsonFromAiText<Record<string, unknown>>(text);
      if (!parsed) {
        return NextResponse.json({ error: "AI 评卷结果无法解析" }, { status: 502 });
      }
      const evaluation = normalizeTrainingEvaluation({
        ...parsed,
        question_meta: questionData?.questionMeta as TrainingQuestionMeta | undefined,
        used_secondary_hint: Boolean(body.usedSecondaryHint),
      });
      return NextResponse.json({ evaluation });
    }

    return NextResponse.json({ error: "未知 action" }, { status: 400 });
  } catch (error) {
    console.error("训练 AI 请求失败:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "服务器错误" },
      { status: 500 }
    );
  }
}
