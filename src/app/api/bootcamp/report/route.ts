import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { getChatModel } from "@/lib/ai";

// POST: 生成报告
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const { report_type, day_number } = await req.json();
    if (!report_type || !["daily", "comprehensive"].includes(report_type)) {
      return NextResponse.json(
        { error: "无效的报告类型" },
        { status: 400 }
      );
    }

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

    // 获取面试记录
    const { data: interviews } = await supabase
      .from("bootcamp_interviews")
      .select("*")
      .eq("session_id", session.id)
      .order("day_number, question_index");

    if (!interviews?.length)
      return NextResponse.json(
        { error: "无面试记录" },
        { status: 400 }
      );

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey)
      return NextResponse.json({ error: "AI 服务未配置" }, { status: 500 });

    const model = getChatModel(apiKey);

    let prompt = "";
    if (report_type === "daily" && day_number) {
      const dayInterviews = interviews.filter(
        (i) => i.day_number === day_number
      );
      const avgScore =
        dayInterviews.reduce(
          (sum, i) => sum + (i.ai_evaluation?.overall_score || 0),
          0
        ) / dayInterviews.length;

      prompt = `今日答题记录：${JSON.stringify(dayInterviews)}
今日平均分：${avgScore.toFixed(1)}`;
    } else {
      // comprehensive
      const dailyScores = [1, 2, 3].map((day) => {
        const dayInterviews = interviews.filter((i) => i.day_number === day);
        return {
          day,
          avg:
            dayInterviews.reduce(
              (sum, i) => sum + (i.ai_evaluation?.overall_score || 0),
              0
            ) / (dayInterviews.length || 1),
        };
      });
      prompt = `3 天答题记录：${JSON.stringify(interviews)}
每日平均分：${JSON.stringify(dailyScores)}`;
    }

    const { text } = await generateText({
      model,
      system: `你是一位 B 端产品导师，请生成${report_type === "daily" ? "日报" : "综合报告"}并返回 JSON。`,
      messages: [{ role: "user", content: prompt }],
    });

    let reportContent;
    try {
      reportContent = JSON.parse(text);
    } catch {
      reportContent = { summary: "报告生成失败", key_takeaways: [] };
    }

    // 计算分数快照
    const scoresSnapshot: Record<string, number> = {};
    if (report_type === "comprehensive") {
      const dimensions = ["structure", "logic", "professionalism", "innovation"];
      dimensions.forEach((dim) => {
        const scores = interviews
          .map((i) => i.ai_evaluation?.[dim])
          .filter((s): s is number => s !== undefined);
        scoresSnapshot[dim] = scores.length
          ? Math.round(
              (scores.reduce((a, b) => a + b, 0) / scores.length) * 10
            ) / 10
          : 0;
      });
    }

    const { data: report, error } = await supabase
      .from("bootcamp_reports")
      .insert({
        session_id: session.id,
        report_type,
        day_number,
        content: reportContent,
        scores_snapshot: scoresSnapshot,
      })
      .select()
      .single();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    // 如果是综合报告，标记会话完成
    if (report_type === "comprehensive") {
      await supabase
        .from("bootcamp_sessions")
        .update({ status: "completed" })
        .eq("id", session.id);
    }

    return NextResponse.json({ report });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "服务器错误" },
      { status: 500 }
    );
  }
}

// GET: 获取报告
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get("type");
    const sessionId = searchParams.get("session_id");

    let query = supabase
      .from("bootcamp_reports")
      .select("*, session:bootcamp_sessions(id, user_id)")
      .eq("session.user_id", user.id);

    if (reportType) query = query.eq("report_type", reportType);
    if (sessionId) query = query.eq("session_id", sessionId);

    const { data: reports, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ reports });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "服务器错误" },
      { status: 500 }
    );
  }
}
