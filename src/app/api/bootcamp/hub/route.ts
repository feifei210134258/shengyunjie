import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { buildBootcampHub } from "@/lib/bootcamp/hub";

export async function GET() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { data: session, error: sessionError } = await supabase
      .from("bootcamp_sessions")
      .select("id, status, current_day, parsed_profile, weakness_prediction")
      .eq("user_id", user.id)
      .maybeSingle();

    if (sessionError) {
      return NextResponse.json({ error: sessionError.message }, { status: 500 });
    }

    let interviews: any[] = [];
    if (session?.id) {
      const { data, error } = await supabase
        .from("bootcamp_interviews")
        .select("id, status, user_answer, ai_evaluation")
        .eq("session_id", session.id)
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      interviews = data || [];
    }

    const { data: trainingRecords, error: trainingError } = await supabase
      .from("training_records")
      .select("id, score, question_scenario, ai_feedback")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8);

    if (trainingError) {
      return NextResponse.json(
        { error: trainingError.message },
        { status: 500 }
      );
    }

    const hub = buildBootcampHub({
      session,
      interviews,
      trainingRecords: trainingRecords || [],
    });
    const { sprintBrief, assetPipeline, nextActions } = hub;

    return NextResponse.json({
      sprintBrief,
      assetPipeline,
      nextActions,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "服务器错误" },
      { status: 500 }
    );
  }
}
