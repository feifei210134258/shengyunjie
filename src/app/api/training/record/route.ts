import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "服务器错误" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const { recordId, revisedAnswer } = await req.json();
    const revisionText = String(revisedAnswer || "").trim();

    if (!recordId || !revisionText) {
      return NextResponse.json(
        { error: "缺少训练记录或修正答案" },
        { status: 400 }
      );
    }

    const { data: existingRecord, error: readError } = await supabase
      .from("training_records")
      .select("id, ai_feedback")
      .eq("id", recordId)
      .eq("user_id", user.id)
      .single();

    if (readError || !existingRecord) {
      return NextResponse.json({ error: "记录不存在" }, { status: 404 });
    }

    const feedback =
      existingRecord.ai_feedback && typeof existingRecord.ai_feedback === "object"
        ? existingRecord.ai_feedback
        : { analysis: existingRecord.ai_feedback };

    const nextFeedback = {
      ...feedback,
      __revision: {
        revisedAnswer: revisionText,
        savedAt: new Date().toISOString(),
      },
    };

    const { data, error } = await supabase
      .from("training_records")
      .update({ ai_feedback: nextFeedback })
      .eq("id", recordId)
      .eq("user_id", user.id)
      .select("id, ai_feedback")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ record: data, revision: nextFeedback.__revision });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "服务器错误" }, { status: 500 });
  }
}
