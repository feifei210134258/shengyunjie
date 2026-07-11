import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { getChatModel } from "@/lib/ai";

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

function getGeneratedQuestions(parsed: any): any[] {
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed?.questions)) return parsed.questions;
  if (Array.isArray(parsed?.interview_questions)) return parsed.interview_questions;
  if (Array.isArray(parsed?.data?.questions)) return parsed.data.questions;
  return [];
}

function getResumeAnchors(parsedProfile: any) {
  const projects =
    parsedProfile?.projects
      ?.map((project: any) => project?.name)
      .filter(Boolean) || [];
  const companies =
    parsedProfile?.work_experience
      ?.map((work: any) => work?.company)
      .filter(Boolean) || [];

  return {
    firstProject: projects[0] || "你简历中最核心的项目",
    secondProject: projects[1] || projects[0] || "另一个关键项目",
    firstCompany: companies[0] || "最近一段经历",
  };
}

function isGroundedInterviewQuestion(question: any) {
  const text = String(
    question?.question_text || question?.text || question?.question || ""
  );
  if (text.length < 20) return false;

  const fakeStrategyPatterns = [
    /CEO|首席执行官/,
    /第二增长曲线|新增长曲线/,
    /12\s*个月|18\s*个月|三年战略|战略路线图/,
    /GTM|go[-\s]?to[-\s]?market/i,
    /市场机会.*定价.*ROI/,
  ];

  return !fakeStrategyPatterns.some((pattern) => pattern.test(text));
}

function getFallbackQuestions(dayNumber: number, parsedProfile: any) {
  const difficulty = Math.min(Math.max(dayNumber + 1, 1), 5);
  const { firstProject, secondProject, firstCompany } =
    getResumeAnchors(parsedProfile);

  return [
    {
      question_text:
        `请复盘「${firstProject}」：当时业务问题是什么，你怎么定义成功指标，做过哪些取舍，最终结果如何证明是产品动作带来的？`,
      question_type: "strategy",
      difficulty,
    },
    {
      question_text:
        `在「${secondProject}」里，如果要把能力沉淀成可复用模块，你会如何处理角色权限、数据边界、历史兼容和客户定制之间的冲突？`,
      question_type: "system_design",
      difficulty,
    },
    {
      question_text:
        `你在「${firstCompany}」相关项目里提到的指标提升，如何排除运营动作、客户结构变化或季节性因素的影响？如果数据不完整，你会怎么补证据链？`,
      question_type: "data_driven",
      difficulty,
    },
    {
      question_text:
        `请讲一次你在项目中推翻原方案的经历：触发信号是什么，你如何区分客户表层诉求、真实痛点和商业约束？`,
      question_type: "user_insight",
      difficulty,
    },
    {
      question_text:
        `如果销售、客户成功和研发对「${firstProject}」的优先级判断不一致，你会如何组织决策，哪些信息必须拿到桌面上，最后怎么让团队接受取舍？`,
      question_type: "business_thinking",
      difficulty,
    },
  ];
}

// POST: 生成每日面试题
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const { day_number } = await req.json();
    if (!day_number || day_number < 1 || day_number > 3) {
      return NextResponse.json({ error: "无效的 Day 参数" }, { status: 400 });
    }

    // 获取会话信息
    const { data: session } = await supabase
      .from("bootcamp_sessions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!session)
      return NextResponse.json(
        { error: "未找到特训会话" },
        { status: 404 }
      );

    // 获取前一日表现（用于 Day 2/3）
    let previousPerformance = "";
    if (day_number > 1) {
      const { data: prevQuestions } = await supabase
        .from("bootcamp_interviews")
        .select("*")
        .eq("session_id", session.id)
        .eq("day_number", day_number - 1);

      if (prevQuestions?.length) {
        const avgScore =
          prevQuestions.reduce(
            (sum, q) => sum + (q.ai_evaluation?.overall_score || 0),
            0
          ) / prevQuestions.length;
        previousPerformance = `前一日平均得分：${avgScore.toFixed(1)}，低分维度：${prevQuestions
          .filter((q) => (q.ai_evaluation?.overall_score || 0) < 6)
          .map((q) => q.question_type)
          .join(", ")}`;
      }
    }

    // 调用 AI 生成题目
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey)
      return NextResponse.json({ error: "AI 服务未配置" }, { status: 500 });

    const model = getChatModel(apiKey);

    const { text } = await generateText({
      model,
      system: `你是一位 B 端产品 VP，正在设计定制化高阶 PM 面试题。请只返回 JSON，不要使用 Markdown 代码块，不要添加解释。
题目必须像真实面试官追问候选人简历里的项目，而不是宏大战略作文题。
出题规则：
1. 每道题优先点名候选人简历中的具体项目、公司、模块、指标或角色。
2. 重点考察：项目复盘、决策取舍、指标归因、复杂协同、系统边界、失败复盘。
3. 问法要接地气，像面试官会追问的原话：当时怎么判断、怎么证明、怎么处理冲突、如果重来怎么改。
4. 不要出“CEO 要你找第二增长曲线”“制定 12/18 个月战略路线图”“泛泛评估市场机会/GTM/ROI”这类假大空题，除非简历明确有对应项目且题目仍然落在具体经历上。
5. 必须返回恰好 5 道题，难度随 day 递增。
JSON 结构必须为：
{
  "questions": [
    {
      "question_text": "题目内容",
      "question_type": "strategy|system_design|data_driven|user_insight|business_thinking",
      "difficulty": 1,
      "focus_dimension": "战略思维"
    }
  ]
}`,
      messages: [
        {
          role: "user",
          content: `候选人信息：${JSON.stringify(session.parsed_profile)}
弱点预测：${JSON.stringify(session.weakness_prediction)}
当前第 ${day_number} 天
${previousPerformance}`,
        },
      ],
    });

    const parsed = parseJsonFromAiText(text);
    const generatedQuestions = getGeneratedQuestions(parsed).filter(
      isGroundedInterviewQuestion
    );
    const questions = [
      ...generatedQuestions,
      ...getFallbackQuestions(day_number, session.parsed_profile),
    ].slice(0, 5);
    if (questions.length === 0) {
      return NextResponse.json(
        { error: "题目生成失败：AI 未返回 questions 数组" },
        { status: 500 }
      );
    }

    // 存储题目
    const inserts = questions.map((q: any, idx: number) => ({
      session_id: session.id,
      day_number: day_number,
      question_index: idx + 1,
      question_text:
        q.question_text ||
        q.text ||
        q.question ||
        "请结合你的项目经历，说明一次关键产品决策的背景、取舍和结果。",
      question_type: q.question_type || q.type || "strategy",
      difficulty: q.difficulty || day_number,
      status: "pending",
    }));

    const { error } = await supabase
      .from("bootcamp_interviews")
      .upsert(inserts, {
        onConflict: "session_id,day_number,question_index",
      });
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    const { error: cleanupError } = await supabase
      .from("bootcamp_interviews")
      .delete()
      .eq("session_id", session.id)
      .eq("day_number", day_number)
      .gt("question_index", 5);
    if (cleanupError)
      return NextResponse.json({ error: cleanupError.message }, { status: 500 });

    // 更新会话当前天数
    await supabase
      .from("bootcamp_sessions")
      .update({ current_day: day_number, status: "in_progress" })
      .eq("id", session.id);

    return NextResponse.json({ questions: inserts });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "服务器错误" },
      { status: 500 }
    );
  }
}

// GET: 获取当前天数的题目
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const day = parseInt(searchParams.get("day") || "1");

    const { data: session } = await supabase
      .from("bootcamp_sessions")
      .select("id, current_day")
      .eq("user_id", user.id)
      .single();

    if (!session)
      return NextResponse.json(
        { error: "未找到特训会话" },
        { status: 404 }
      );

    const { data: questions } = await supabase
      .from("bootcamp_interviews")
      .select("*")
      .eq("session_id", session.id)
      .eq("day_number", day)
      .order("question_index");

    return NextResponse.json({
      questions,
      current_day: session.current_day,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "服务器错误" },
      { status: 500 }
    );
  }
}
