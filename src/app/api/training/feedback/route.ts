import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { question_text, feedback_type } = await req.json();

  if (!question_text || !["up", "down"].includes(feedback_type)) {
    return NextResponse.json({ error: "参数错误" }, { status: 400 });
  }

  const question_hash = createHash("md5")
    .update(question_text.slice(0, 50))
    .digest("hex");

  const { error } = await supabase.from("question_feedback").upsert(
    {
      user_id: user.id,
      question_hash,
      feedback_type,
    },
    { onConflict: "user_id,question_hash" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
