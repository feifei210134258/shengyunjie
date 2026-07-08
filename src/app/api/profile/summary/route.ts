import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { buildGrowthProfile } from "@/lib/profile/growth-profile";

async function readSnapshotTrigger(req?: Request) {
  if (!req) return null;
  try {
    const body = await req.json();
    const triggerType = String(body?.trigger || "");
    if (
      ![
        "training_feedback",
        "revision_saved",
        "expression_card_saved",
        "project_story_saved",
        "thinking_upgrade_saved",
        "goal_focus_selected",
      ].includes(triggerType)
    ) {
      return null;
    }
    const revisedAnswer = String(body.revisedAnswer || "").trim();
    const expressionCard =
      body.expressionCard && typeof body.expressionCard === "object"
        ? {
            readiness: String(body.expressionCard.readiness || "").slice(0, 40),
            openingClaim: String(body.expressionCard.openingClaim || "").slice(
              0,
              240
            ),
            proofPoint: String(body.expressionCard.proofPoint || "").slice(
              0,
              320
            ),
            followupRisk: String(body.expressionCard.followupRisk || "").slice(
              0,
              240
            ),
        }
      : null;
    const projectStory =
      body.projectStory && typeof body.projectStory === "object"
        ? {
            projectName: String(body.projectStory.projectName || "").slice(
              0,
              160
            ),
            company: String(body.projectStory.company || "").slice(0, 120),
            role: String(body.projectStory.role || "").slice(0, 240),
            readinessScore: Number.isFinite(
              Number(body.projectStory.readinessScore)
            )
              ? Number(body.projectStory.readinessScore)
              : null,
            proofGaps: Array.isArray(body.projectStory.proofGaps)
              ? body.projectStory.proofGaps
                  .map((gap: unknown) => String(gap || "").slice(0, 180))
                  .filter(Boolean)
                  .slice(0, 6)
              : [],
            interviewScript:
              body.projectStory.interviewScript &&
              typeof body.projectStory.interviewScript === "object"
                ? {
                    fullScript: String(
                      body.projectStory.interviewScript.fullScript || ""
                    ).slice(0, 1200),
                  }
                : null,
        }
      : null;
    const thinkingUpgrade =
      body.thinkingUpgrade && typeof body.thinkingUpgrade === "object"
        ? {
            judgment_quality: String(
              body.thinkingUpgrade.judgment_quality || ""
            ).slice(0, 360),
            tradeoff_quality: String(
              body.thinkingUpgrade.tradeoff_quality || ""
            ).slice(0, 360),
            attribution_depth: String(
              body.thinkingUpgrade.attribution_depth || ""
            ).slice(0, 360),
            landing_rigor: String(
              body.thinkingUpgrade.landing_rigor || ""
            ).slice(0, 360),
            migration_check: String(
              body.thinkingUpgrade.migration_check || ""
            ).slice(0, 360),
          }
        : null;
    const goalFocus =
      body.goalFocus === "interview_sprint" ||
      body.goalFocus === "thinking_training"
        ? body.goalFocus
        : "";
    return {
      trigger: triggerType,
      trainingRecordId: String(body.trainingRecordId || "").trim(),
      dimension: String(body.dimension || "").trim(),
      missionId: String(body.missionId || "").trim(),
      score: Number.isFinite(Number(body.score)) ? Number(body.score) : null,
      revisedAnswer:
        triggerType === "revision_saved" ? revisedAnswer.slice(0, 600) : "",
      expressionCard:
        triggerType === "expression_card_saved" ? expressionCard : null,
      projectStory: triggerType === "project_story_saved" ? projectStory : null,
      thinkingUpgrade:
        triggerType === "thinking_upgrade_saved" ? thinkingUpgrade : null,
      goalFocus: triggerType === "goal_focus_selected" ? goalFocus : "",
    };
  } catch {
    return null;
  }
}

async function loadGrowthProfile(supabase: any, userId: string) {
  const { data: latestReport, error: reportError } = await supabase
    .from("diagnosis_reports")
    .select("id, overall_score, overall_grade, completed_at, dimension_scores(*)")
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (reportError) throw reportError;

  const { data: trainingRecords, error: trainingError } = await supabase
    .from("training_records")
    .select("id, dimension, score, ai_feedback, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(80);

  if (trainingError) throw trainingError;

  const { data: bootcampSession, error: sessionError } = await supabase
    .from("bootcamp_sessions")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (sessionError) throw sessionError;

  let bootcampInterviews: any[] = [];
  if (bootcampSession?.id) {
    const { data: interviews, error: interviewError } = await supabase
      .from("bootcamp_interviews")
      .select("id, question_type, status, user_answer, ai_evaluation, created_at")
      .eq("session_id", bootcampSession.id)
      .order("created_at", { ascending: false });

    if (interviewError) throw interviewError;
    bootcampInterviews = interviews || [];
  }

  const { data: growthSnapshots, error: snapshotError } = await supabase
    .from("growth_snapshots")
    .select("id, snapshot_date, overall_score, dimension_scores")
    .eq("user_id", userId)
    .order("snapshot_date", { ascending: false })
    .limit(12);

  if (snapshotError) throw snapshotError;

  return buildGrowthProfile({
    latestReport,
    trainingRecords: trainingRecords || [],
    bootcampInterviews,
    growthSnapshots: growthSnapshots || [],
  });
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

    const growthProfile = await loadGrowthProfile(supabase, user.id);
    return NextResponse.json({ growthProfile });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "服务器错误" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const growthProfile = await loadGrowthProfile(supabase, user.id);
    const dimensionScores = Object.fromEntries(
      growthProfile.dimensions.map((dimension) => [
        dimension.id,
        dimension.score,
      ])
    );
    const trigger = await readSnapshotTrigger(req);
    const snapshotDimensionScores = trigger
      ? {
          ...dimensionScores,
          __trigger: trigger,
          ...(trigger.goalFocus ? { __goalFocus: trigger.goalFocus } : {}),
        }
      : dimensionScores;

    const { data: snapshot, error: insertError } = await supabase
      .from("growth_snapshots")
      .insert({
        user_id: user.id,
        dimension_scores: snapshotDimensionScores,
        overall_score: growthProfile.summary.overallScore,
        training_count: growthProfile.summary.evidenceCount,
      })
      .select("id, snapshot_date, dimension_scores, overall_score, training_count")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ snapshot, growthProfile });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "服务器错误" },
      { status: 500 }
    );
  }
}
