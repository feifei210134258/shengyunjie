import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { dimension, difficulty, question_scenario, user_answer, ai_feedback, score } = await req.json();

  const { data, error } = await supabase
    .from("training_records")
    .insert({
      user_id: user.id,
      dimension,
      difficulty: difficulty || 3,
      question_scenario,
      user_answer,
      ai_feedback,
      score: score ? Math.round(score * 10) : null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id: data.id });
}
