import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { getChatModel } from "@/lib/ai";

// POST: 提交答案并评分
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const { interview_id, answer } = await req.json();
    if (!interview_id || !answer) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 });
    }

    if (answer.length < 20) {
      return NextResponse.json(
        { error: "回答过于简短，建议详细阐述你的思路" },
        { status: 400 }
      );
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

    let evaluation;
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        const { text } = await generateText({
          model,
          system: `你是一位严格的 B 端产品面试官，请评分并返回 JSON。`,
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

        evaluation = JSON.parse(text);
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
