import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { getChatModel } from "@/lib/ai";
import { AIEvaluation } from "@/types/bootcamp";
import { sanitizeFeedbackForCurrentQuestion } from "@/lib/bootcamp/grounding";

type TargetEvidenceFocus = {
  projectName: string;
  company: string;
  role: string;
  targetEvidence: string;
  finalInterviewAnswer?: string;
  targetFit?: {
    score: number | null;
    priorityLabel: string;
    reason: string;
  } | null;
} | null;

function parseJsonFromAiText<T>(text: string): T | null {
  const trimmed = text.trim();
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

function compactText(value: unknown, maxLength = 600) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
}

function readProjectStoryFromSnapshot(snapshot: any) {
  const projectStory = snapshot?.dimension_scores?.__trigger?.projectStory;
  if (!projectStory || typeof projectStory !== "object") return null;
  const projectName = compactText(projectStory.projectName, 120);
  const targetEvidence = compactText(projectStory.targetEvidence, 600);
  const finalInterviewAnswer = compactText(projectStory.finalInterviewAnswer, 900);
  if (!projectName || (!targetEvidence && !finalInterviewAnswer)) return null;

  return {
    projectName,
    company: compactText(projectStory.company, 120),
    role: compactText(projectStory.role, 160),
    targetEvidence,
    finalInterviewAnswer,
    targetFit:
      projectStory.targetFit && typeof projectStory.targetFit === "object"
        ? {
            score: Number.isFinite(Number(projectStory.targetFit.score))
              ? Number(projectStory.targetFit.score)
              : null,
            priorityLabel: compactText(projectStory.targetFit.priorityLabel, 40),
            reason: compactText(projectStory.targetFit.reason, 240),
          }
        : null,
  };
}

async function loadTargetEvidenceFocus(supabase: any, userId: string) {
  const { data: snapshots, error } = await supabase
    .from("growth_snapshots")
    .select("id, snapshot_date, dimension_scores")
    .eq("user_id", userId)
    .order("snapshot_date", { ascending: false })
    .limit(12);

  if (error) throw error;

  for (const snapshot of snapshots || []) {
    const projectStory = readProjectStoryFromSnapshot(snapshot);
    if (projectStory?.targetEvidence) return projectStory;
  }

  return null;
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

function normalizeTargetEvidenceValidation(
  parsed: any,
  targetEvidenceFocus: NonNullable<TargetEvidenceFocus>
): NonNullable<AIEvaluation["target_evidence_validation"]> {
  const raw =
    parsed?.target_evidence_validation || parsed?.targetEvidenceValidation || {};
  const score = normalizeScore(raw?.score ?? raw?.validation_score, 5);
  const status = String(raw?.status || "").trim();
  const normalizedStatus: "defended" | "weak" | "unclear" =
    status === "defended" || status === "weak" || status === "unclear"
      ? status
      : score >= 8
        ? "defended"
        : score >= 5
          ? "weak"
          : "unclear";

  return {
    score,
    status: normalizedStatus,
    verdict:
      compactText(raw?.verdict, 360) ||
      "这次回答已经完成目标证据追问评估，但还需要继续补齐归因、取舍和角色价值的证明。",
    evidence_matched: normalizeList(raw?.evidence_matched, [
      "已围绕入账目标证据进行回答。",
    ]).slice(0, 4),
    unresolved_risks: normalizeList(raw?.unresolved_risks, [
      "仍需补充归因反证、个人角色价值或可复用机制。",
    ]).slice(0, 4),
    next_drill:
      compactText(raw?.next_drill, 220) ||
      "下一轮先用一句话讲清结果归因，再补一个反证或取舍细节。",
    project_name: targetEvidenceFocus.projectName,
    target_evidence:
      targetEvidenceFocus.targetEvidence ||
      targetEvidenceFocus.finalInterviewAnswer ||
      "",
  };
}

function normalizeFinalAnswerRehearsal(
  parsed: any,
  targetEvidenceFocus: NonNullable<TargetEvidenceFocus>
): NonNullable<AIEvaluation["final_answer_rehearsal"]> {
  const raw =
    parsed?.final_answer_rehearsal || parsed?.finalAnswerRehearsal || {};
  const fallbackValidation =
    parsed?.target_evidence_validation || parsed?.targetEvidenceValidation || {};
  const score = normalizeScore(
    raw?.score ?? raw?.stability_score ?? fallbackValidation?.score,
    5
  );
  const status = String(raw?.status || "").trim();
  const normalizedStatus: "stable" | "shaky" | "unclear" =
    status === "stable" || status === "shaky" || status === "unclear"
      ? status
      : score >= 8
        ? "stable"
        : score >= 5
          ? "shaky"
          : "unclear";

  return {
    score,
    status: normalizedStatus,
    verdict:
      compactText(raw?.verdict, 360) ||
      compactText(fallbackValidation?.verdict, 360) ||
      "这次已经完成终版表达复述评估，但还需要继续检查临场稳定度、证据顺序和追问承接。",
    stable_points: normalizeList(raw?.stable_points, [
      "已围绕终版面试表达完成复述。",
    ]).slice(0, 4),
    unstable_points: normalizeList(
      raw?.unstable_points || fallbackValidation?.unresolved_risks,
      ["仍需补强复述顺序、关键证据或追问承接。"]
    ).slice(0, 4),
    next_drill:
      compactText(raw?.next_drill, 220) ||
      compactText(fallbackValidation?.next_drill, 220) ||
      "下一轮先练 90 秒稳定复述，再接受归因、角色价值和取舍追问。",
    project_name: targetEvidenceFocus.projectName,
    final_interview_answer: targetEvidenceFocus.finalInterviewAnswer || "",
  };
}

function normalizeEvaluation(
  parsed: any,
  questionText: string,
  answer: string,
  targetEvidenceFocus?: NonNullable<TargetEvidenceFocus>
): AIEvaluation {
  const structure = normalizeScore(parsed?.structure, 5);
  const logic = normalizeScore(parsed?.logic, 5);
  const professionalism = normalizeScore(parsed?.professionalism, 5);
  const innovation = normalizeScore(parsed?.innovation, 5);
  const overallFallback =
    Math.round(((structure + logic + professionalism + innovation) / 4) * 10) /
    10;
  const exampleAnswer = sanitizeFeedbackForCurrentQuestion(
    String(parsed?.example_answer || ""),
    questionText,
    answer
  );
  const improvedAnswer = sanitizeFeedbackForCurrentQuestion(
    String(parsed?.improved_answer || parsed?.rewrite_example || ""),
    questionText,
    answer
  );

  const evaluation: AIEvaluation = {
    overall_score: normalizeScore(
      parsed?.overall_score ?? parsed?.overall,
      overallFallback
    ),
    structure,
    logic,
    professionalism,
    innovation,
    feedback:
      sanitizeFeedbackForCurrentQuestion(
        String(parsed?.feedback || parsed?.overall_feedback || ""),
        questionText,
        answer
      ) ||
      "这份回答还没有紧扣当前题目展开，需要围绕题目中的项目背景补充判断依据、取舍过程、结果证据和复盘结论。",
    strengths: normalizeList(parsed?.strengths, [
      "能围绕题目给出基本回答，说明你已经抓住了讨论方向。",
    ]),
    gaps: normalizeList(parsed?.gaps || parsed?.weaknesses, [
      "缺少与当前题目直接相关的业务背景、关键指标、决策取舍和复盘结论，面试官难以判断你的真实产品判断力。",
    ]),
    suggestions: normalizeList(parsed?.suggestions, [
      "按“背景目标 - 我的判断 - 关键取舍 - 数据结果 - 复盘改进”的顺序重答一遍。",
    ]),
    thinking_framework: normalizeList(parsed?.thinking_framework, [
      "先用一句话说明业务问题和成功指标",
      "讲清楚你掌握了哪些用户、业务和数据证据",
      "对比至少两个方案，并说明为什么选当前方案",
      "补充上线后的结果、反证和复盘",
    ]),
    example_answer:
      exampleAnswer ||
      "示例：我会先复述当前题目中的项目背景和目标，再说明我当时如何判断优先级、比较备选方案、处理关键风险，最后用结果指标和复盘结论证明这个判断是否成立。",
    improved_answer:
      improvedAnswer ||
      "改写示范：针对当前题目里的项目，我会先交代业务目标和约束，再说明自己如何用用户反馈、流程数据或交付风险判断优先级。随后对比两个方案的收益与代价，解释为什么选择当前方案，并补充上线后的结果、异常情况和复盘改进。",
    next_practice:
      String(parsed?.next_practice || "").trim() ||
      "下一题前，先把自己的回答压缩成 5 句话：目标、证据、方案、取舍、结果。",
  };

  if (targetEvidenceFocus) {
    evaluation.target_evidence_validation = normalizeTargetEvidenceValidation(
      parsed,
      targetEvidenceFocus
    );
    if (targetEvidenceFocus.finalInterviewAnswer) {
      evaluation.final_answer_rehearsal = normalizeFinalAnswerRehearsal(
        parsed,
        targetEvidenceFocus
      );
    }
  }

  return evaluation;
}

async function persistTargetEvidenceValidation({
  supabase,
  userId,
  interviewId,
  targetEvidenceFocus,
  evaluation,
}: {
  supabase: any;
  userId: string;
  interviewId: string;
  targetEvidenceFocus: NonNullable<TargetEvidenceFocus>;
  evaluation: AIEvaluation;
}) {
  const targetEvidenceValidation = evaluation.target_evidence_validation;
  if (!targetEvidenceValidation) return null;
  const finalAnswerRehearsal = evaluation.final_answer_rehearsal;

  const { data: snapshot, error } = await supabase
    .from("growth_snapshots")
    .insert({
      user_id: userId,
      dimension_scores: {
        __trigger: {
          trigger: "target_evidence_validated",
          interviewId,
          projectStory: {
            projectName: targetEvidenceFocus.projectName,
            company: targetEvidenceFocus.company,
            role: targetEvidenceFocus.role,
            targetEvidence: targetEvidenceFocus.targetEvidence,
            finalInterviewAnswer: targetEvidenceFocus.finalInterviewAnswer,
            targetFit: targetEvidenceFocus.targetFit || null,
          },
          targetEvidenceValidation,
          finalAnswerRehearsal,
        },
      },
      overall_score: Math.round(evaluation.overall_score * 10),
      training_count: 0,
    })
    .select("id, snapshot_date, dimension_scores, overall_score, training_count")
    .single();

  if (error) throw error;
  return snapshot;
}

// POST: 提交答案并评分
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const {
      interview_id,
      answer: submittedAnswer,
      interviewFocus,
    } = await req.json();
    if (!interview_id) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 });
    }

    // 获取题目信息
    const { data: interview } = await supabase
      .from("bootcamp_interviews")
      .select("*, session:session_id(user_id)")
      .eq("id", interview_id)
      .single();

    if (!interview) return NextResponse.json({ error: "未找到题目" }, { status: 404 });

    // 验证权限
    if (interview.session?.user_id !== user.id) {
      return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }

    const answer = String(submittedAnswer || interview.user_answer || "").trim();
    if (!answer) {
      return NextResponse.json(
        { error: "未找到可评分的回答" },
        { status: 400 }
      );
    }

    if (answer.length < 20) {
      return NextResponse.json(
        { error: "回答过于简短，建议详细阐述你的思路" },
        { status: 400 }
      );
    }

    // 更新答案
    await supabase
      .from("bootcamp_interviews")
      .update({ user_answer: answer, status: "answered" })
      .eq("id", interview_id);

    // 调用 AI 评分
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey)
      return NextResponse.json({ error: "AI 服务未配置" }, { status: 500 });

    const model = getChatModel(apiKey);
    const targetEvidenceFocus =
      interviewFocus === "target_evidence"
        ? await loadTargetEvidenceFocus(supabase, user.id)
        : null;
    const targetEvidencePrompt = targetEvidenceFocus
      ? `目标证据验证：
项目：${targetEvidenceFocus.projectName}
公司：${targetEvidenceFocus.company || "未标注"}
角色：${targetEvidenceFocus.role || "未标注"}
入账目标证据：${targetEvidenceFocus.targetEvidence}
终版面试表达：${targetEvidenceFocus.finalInterviewAnswer || "尚未入账"}
如果题目要求模拟复述，请判断候选人是否稳定复述了终版面试表达，并检查临场稳定度。
请判断候选人的回答是否扛住了这段目标证据和终版面试表达的高压追问，尤其检查结果归因、个人角色价值、关键取舍、协同过程和可复用机制。
必须额外返回 target_evidence_validation 字段：
{
  "score": 0-10,
  "status": "defended | weak | unclear",
  "verdict": "一句话判断这段证据是否抗追问",
  "evidence_matched": ["回答中已经证明住的点"],
  "unresolved_risks": ["面试官继续追问会击穿的风险"],
  "next_drill": "下一轮最该补的一件事"
}
如果存在终版面试表达，还必须额外返回 final_answer_rehearsal 字段，用于把复述稳定度入账：
{
  "score": 0-10,
  "status": "stable | shaky | unclear",
  "verdict": "一句话判断终版表达复述是否稳定",
  "stable_points": ["复述中已经稳定保住的点"],
  "unstable_points": ["复述时遗漏、顺序混乱或容易被追问击穿的点"],
  "next_drill": "下一轮再练复述最该补的一件事"
}`
      : "";

    let evaluation: AIEvaluation | null = null;
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        const { text } = await generateText({
          model,
          system: `你是一位严格但有教学能力的 B 端高级产品面试官。你的目标不是只打分，而是帮助候选人把回答改到真实面试可用。
请只返回 JSON，不要使用 Markdown 代码块，不要添加解释。
JSON 结构必须为：
{
  "overall_score": 0-10,
  "structure": 0-10,
  "logic": 0-10,
  "professionalism": 0-10,
  "innovation": 0-10,
  "feedback": "总体评价，必须具体指出这份回答为什么像或不像高级 PM",
  "strengths": ["亮点，引用用户回答里的具体内容"],
  "gaps": ["不足，指出缺失的证据、取舍、指标或复盘"],
  "suggestions": ["可执行改进建议"],
  "thinking_framework": ["这道题推荐的答题框架，4-6 条"],
  "example_answer": "给一段 120-220 字的示例回答，示范高阶 PM 应该怎么答",
  "improved_answer": "把用户原回答改写成更像面试现场的版本，120-220 字",
  "next_practice": "下一题前最该练的一件事",
  "target_evidence_validation": {
    "score": 0-10,
    "status": "defended | weak | unclear",
    "verdict": "仅当输入包含目标证据验证时返回：一句话判断这段证据是否抗追问",
    "evidence_matched": ["已经证明住的点"],
    "unresolved_risks": ["继续追问会击穿的风险"],
    "next_drill": "下一轮最该补的一件事"
  },
  "final_answer_rehearsal": {
    "score": 0-10,
    "status": "stable | shaky | unclear",
    "verdict": "仅当输入包含终版面试表达时返回：一句话判断复述稳定度",
    "stable_points": ["复述中已经稳定保住的点"],
    "unstable_points": ["复述时遗漏、顺序混乱或容易被追问击穿的点"],
    "next_drill": "下一轮再练复述最该补的一件事"
  }
}
硬性要求：
1. 所有反馈、框架、示例回答和改写示范只能围绕“当前题目”和“当前回答”，不得引用其他题目、其他项目或未在当前输入中出现的业务场景。
2. 如果用户回答偏离当前题目，要明确指出“偏离当前题目”，但仍然用当前题目的项目背景给出可改写方向。
3. 生成前先核对题目关键词，反馈里必须出现当前题目或用户回答中的核心对象、动作或指标。
4. 如果输入包含“目标证据验证”，必须返回 target_evidence_validation，并明确判断这段证据是否抗追问。
5. 如果输入包含“终版面试表达”，必须返回 final_answer_rehearsal，并明确给出复述稳定度、稳定点、不稳定点和再练复述动作。
评分标准：
1. 结构化：是否讲清背景、目标、过程、结果、复盘。
2. 逻辑性：是否有判断依据、取舍标准、因果链和反证意识。
3. 专业度：是否体现 B 端产品方法，包括多角色、流程、数据、权限、交付或商业约束。
4. 创新性：是否有超出执行层的抽象、复用、机制设计或复盘升级。
反馈必须接地气，避免空泛夸奖或空泛批评。`,
          messages: [
            {
              role: "user",
              content: `题目：${interview.question_text}
类型：${interview.question_type}
难度：${interview.difficulty}
${targetEvidencePrompt}
回答：${answer}`,
            },
          ],
        });

        const parsed = parseJsonFromAiText(text);
        if (!parsed) throw new Error("AI 返回不是 JSON");
        evaluation = normalizeEvaluation(
          parsed,
          interview.question_text,
          answer,
          targetEvidenceFocus || undefined
        );
        break;
      } catch {
        retries++;
        if (retries === maxRetries) {
          return NextResponse.json(
            { error: "评分服务暂时不可用，请稍后刷新页面查看" },
            { status: 503 }
          );
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    // 更新评分结果
    const { error } = await supabase
      .from("bootcamp_interviews")
      .update({
        ai_evaluation: evaluation,
        status: "evaluated",
      })
      .eq("id", interview_id);

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    const validationSnapshot =
      targetEvidenceFocus && evaluation
        ? await persistTargetEvidenceValidation({
            supabase,
            userId: user.id,
            interviewId: interview_id,
            targetEvidenceFocus,
            evaluation,
          })
        : null;

    return NextResponse.json({ evaluation, validationSnapshot });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "服务器错误" },
      { status: 500 }
    );
  }
}
