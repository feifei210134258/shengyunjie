import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import {
  buildStoryBank,
  updateParsedProfileProject,
} from "@/lib/bootcamp/story-bank";

async function readLatestGoalBrief(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  userId: string
) {
  const { data: growthSnapshots, error: snapshotError } = await supabase
    .from("growth_snapshots")
    .select("id, snapshot_date, created_at, dimension_scores")
    .eq("user_id", userId)
    .order("snapshot_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(12);

  if (snapshotError) {
    throw new Error(snapshotError.message);
  }

  return (
    (growthSnapshots || []).find(
      (snapshot: any) => snapshot.dimension_scores?.__goalBrief
    )?.dimension_scores?.__goalBrief || null
  );
}

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
      .select(
        "id, status, current_day, parsed_profile, weakness_prediction"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (sessionError) {
      return NextResponse.json({ error: sessionError.message }, { status: 500 });
    }

    if (!session?.parsed_profile) {
      return NextResponse.json(
        {
          setupNeeded: true,
          storyBank: null,
          nextAction: {
            label: "上传简历",
            href: "/bootcamp/resume",
            reason: "先解析简历，系统才能把项目经历整理成面试证据。",
          },
        },
        { status: 200 }
      );
    }

    const { data: interviews, error: interviewError } = await supabase
      .from("bootcamp_interviews")
      .select(
        "id, day_number, question_index, question_text, question_type, difficulty, user_answer, ai_evaluation, status"
      )
      .eq("session_id", session.id)
      .order("day_number", { ascending: true })
      .order("question_index", { ascending: true });

    if (interviewError) {
      return NextResponse.json(
        { error: interviewError.message },
        { status: 500 }
      );
    }

    const { data: trainingRecords, error: trainingError } = await supabase
      .from("training_records")
      .select("id, dimension, question_scenario, user_answer, score, ai_feedback, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8);

    if (trainingError) {
      return NextResponse.json(
        { error: trainingError.message },
        { status: 500 }
      );
    }

    const latestGoalBrief = await readLatestGoalBrief(supabase, user.id);

    const storyBank = buildStoryBank({
      session,
      interviews: interviews || [],
      trainingRecords: trainingRecords || [],
      latestGoalBrief,
    });

    return NextResponse.json({
      setupNeeded: false,
      storyBank,
      latestGoalBrief,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "服务器错误" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const {
      projectName,
      role,
      description,
      outcomesText,
      targetEvidenceText,
      finalInterviewAnswerText,
    } = await req.json();
    if (!projectName) {
      return NextResponse.json({ error: "缺少项目名称" }, { status: 400 });
    }

    const { data: session, error: sessionError } = await supabase
      .from("bootcamp_sessions")
      .select(
        "id, status, current_day, parsed_profile, weakness_prediction"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (sessionError) {
      return NextResponse.json({ error: sessionError.message }, { status: 500 });
    }

    if (!session?.parsed_profile) {
      return NextResponse.json({ error: "未找到简历项目" }, { status: 404 });
    }

    const updatedProfile = updateParsedProfileProject(session.parsed_profile, {
      projectName,
      role,
      description,
      outcomesText,
      targetEvidenceText,
      finalInterviewAnswerText,
    });

    const { data: updatedSession, error: updateError } = await supabase
      .from("bootcamp_sessions")
      .update({
        parsed_profile: updatedProfile,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.id)
      .select(
        "id, status, current_day, parsed_profile, weakness_prediction"
      )
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const { data: interviews, error: interviewError } = await supabase
      .from("bootcamp_interviews")
      .select(
        "id, day_number, question_index, question_text, question_type, difficulty, user_answer, ai_evaluation, status"
      )
      .eq("session_id", session.id)
      .order("day_number", { ascending: true })
      .order("question_index", { ascending: true });

    if (interviewError) {
      return NextResponse.json(
        { error: interviewError.message },
        { status: 500 }
      );
    }

    const { data: trainingRecords, error: trainingError } = await supabase
      .from("training_records")
      .select("id, dimension, question_scenario, user_answer, score, ai_feedback, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8);

    if (trainingError) {
      return NextResponse.json(
        { error: trainingError.message },
        { status: 500 }
      );
    }

    const latestGoalBrief = await readLatestGoalBrief(supabase, user.id);

    const storyBank = buildStoryBank({
      session: updatedSession,
      interviews: interviews || [],
      trainingRecords: trainingRecords || [],
      latestGoalBrief,
    });

    return NextResponse.json({
      setupNeeded: false,
      storyBank,
      latestGoalBrief,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "服务器错误" },
      { status: 500 }
    );
  }
}
