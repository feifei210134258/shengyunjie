import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

// 查询训练会话
// ?date=2024-03-10   → 返回当天会话（含 5 道题）
// ?month=2024-03     → 返回当月有训练的日期列表
export async function GET(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const month = searchParams.get("month");

  // 按日查询
  if (date) {
    const { data } = await supabase
      .from("training_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("session_date", date)
      .single();
    return NextResponse.json({ session: data });
  }

  // 按月查询 — 返回当月有训练的日期数组
  if (month) {
    const start = `${month}-01`;
    // 计算月末
    const [y, m] = month.split("-").map(Number);
    const end = `${y}-${String(m).padStart(2, "0")}-${new Date(y, m, 0).getDate()}`;

    const { data } = await supabase
      .from("training_sessions")
      .select("session_date")
      .eq("user_id", user.id)
      .gte("session_date", start)
      .lte("session_date", end)
      .order("session_date", { ascending: true });

    const days = data?.map((r) => new Date(r.session_date).getDate()) || [];
    return NextResponse.json({ days, count: days.length });
  }

  // 无参数 — 返回最近 30 天的会话摘要
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data } = await supabase
    .from("training_sessions")
    .select("session_date, questions")
    .eq("user_id", user.id)
    .gte("session_date", thirtyDaysAgo.toISOString().slice(0, 10))
    .order("session_date", { ascending: false })
    .limit(30);

  return NextResponse.json({ sessions: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { questions } = await req.json();
  if (!Array.isArray(questions)) {
    return NextResponse.json({ error: "questions 必须是数组" }, { status: 400 });
  }

  const today = new Date().toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" }).replace(/\//g, "-");

  // 查询今日是否已有记录
  const { data: existing } = await supabase
    .from("training_sessions")
    .select("questions")
    .eq("user_id", user.id)
    .eq("session_date", today)
    .single();

  const merged = { ...(existing?.questions || {}) };
  const existingKeys = Object.keys(merged);
  questions.forEach((q: string, i: number) => {
    merged[`round_${existingKeys.length + i}`] = q;
  });

  const { error } = await supabase
    .from("training_sessions")
    .upsert(
      {
        user_id: user.id,
        session_date: today,
        questions: merged,
      },
      { onConflict: "user_id,session_date" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
