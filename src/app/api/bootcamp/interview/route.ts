import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { getChatModel } from "@/lib/ai";

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
      system: `你是一位 B 端产品 VP，正在设计定制化面试题。请返回 JSON 格式。`,
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

    let questions;
    try {
      const parsed = JSON.parse(text);
      questions = parsed.questions;
    } catch {
      return NextResponse.json(
        { error: "题目生成失败" },
        { status: 500 }
      );
    }

    // 存储题目
    const inserts = questions.map((q: any, idx: number) => ({
      session_id: session.id,
      day_number: day_number,
      question_index: idx + 1,
      question_text: q.question_text,
      question_type: q.question_type,
      difficulty: q.difficulty || day_number,
      status: "pending",
    }));

    const { error } = await supabase
      .from("bootcamp_interviews")
      .insert(inserts);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

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
