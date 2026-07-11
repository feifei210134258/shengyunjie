import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { getChatModel } from "@/lib/ai";
import { AIEvaluation } from "@/types/bootcamp";

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

function normalizeEvaluation(parsed: any): AIEvaluation {
  const structure = normalizeScore(parsed?.structure, 5);
  const logic = normalizeScore(parsed?.logic, 5);
  const professionalism = normalizeScore(parsed?.professionalism, 5);
  const innovation = normalizeScore(parsed?.innovation, 5);
  const overallFallback =
    Math.round(((structure + logic + professionalism + innovation) / 4) * 10) /
    10;

  return {
    overall_score: normalizeScore(
      parsed?.overall_score ?? parsed?.overall,
      overallFallback
    ),
    structure,
    logic,
    professionalism,
    innovation,
    feedback:
      String(parsed?.feedback || parsed?.overall_feedback || "").trim() ||
      "这份回答还没有形成足够完整的面试表达，需要补充背景、判断依据、取舍过程和结果证据。",
    strengths: normalizeList(parsed?.strengths, [
      "能围绕题目给出基本回答，说明你已经抓住了讨论方向。",
    ]),
    gaps: normalizeList(parsed?.gaps || parsed?.weaknesses, [
      "缺少可验证的业务背景、关键指标、决策取舍和复盘结论，面试官难以判断你的真实产品判断力。",
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
      String(parsed?.example_answer || "").trim() ||
      "示例：我会先说明当时的业务目标和约束，再解释我如何用调研和数据确认优先级，接着讲两个备选方案的取舍，最后用上线后的核心指标和复盘说明这个决策是否成立。",
    improved_answer:
      String(parsed?.improved_answer || parsed?.rewrite_example || "").trim() ||
      "改写示范：这个项目的核心问题不是“覆盖更多场景”，而是先识别哪类场景对目标用户最高频、最高价值。我当时会先用用户访谈和行为数据筛出 Top 场景，再用影响面、实现成本和验证周期做优先级排序，放弃低频但炫技的需求，把资源集中在能最快证明价值的场景上。",
    next_practice:
      String(parsed?.next_practice || "").trim() ||
      "下一题前，先把自己的回答压缩成 5 句话：目标、证据、方案、取舍、结果。",
  };
}

// POST: 提交答案并评分
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const { interview_id, answer: submittedAnswer } = await req.json();
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
  "next_practice": "下一题前最该练的一件事"
}
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
回答：${answer}`,
            },
          ],
        });

        const parsed = parseJsonFromAiText(text);
        if (!parsed) throw new Error("AI 返回不是 JSON");
        evaluation = normalizeEvaluation(parsed);
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

    return NextResponse.json({ evaluation });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "服务器错误" },
      { status: 500 }
    );
  }
}
