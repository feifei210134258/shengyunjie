import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

// 保存/更新当天某维度的题目
export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { dimension, question } = await req.json();
  if (!dimension || !question) {
    return NextResponse.json({ error: "缺少 dimension 或 question" }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);

  // 先查今天是否已有会话
  const { data: existing } = await supabase
    .from("training_sessions")
    .select("id, questions")
    .eq("user_id", user.id)
    .eq("session_date", today)
    .single();

  if (existing) {
    // 更新 — 合并 JSONB
    const updated = { ...(existing.questions as Record<string, string>), [dimension]: question };
    await supabase
      .from("training_sessions")
      .update({ questions: updated, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    // 新建
    await supabase
      .from("training_sessions")
      .insert({ user_id: user.id, session_date: today, questions: { [dimension]: question } });
  }

  return NextResponse.json({ ok: true });
}
