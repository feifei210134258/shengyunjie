import { createServerClient } from "@/lib/supabase-server";
import { getBeijingDate } from "@/lib/date";
import { NextRequest, NextResponse } from "next/server";

// 保存/更新当天某维度的题目
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const { dimension, question } = await req.json();
    if (!dimension || !question) {
      return NextResponse.json({ error: "缺少 dimension 或 question" }, { status: 400 });
    }

    const today = getBeijingDate();

    const { data: existing } = await supabase
      .from("training_sessions")
      .select("questions")
      .eq("user_id", user.id)
      .eq("session_date", today)
      .maybeSingle();

    const mergedQuestions = {
      ...(existing?.questions || {}),
      [dimension]: question,
    };

    const { error } = await supabase
      .from("training_sessions")
      .upsert(
        {
          user_id: user.id,
          session_date: today,
          questions: mergedQuestions,
        },
        { onConflict: "user_id,session_date" }
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "服务器错误" }, { status: 500 });
  }
}
