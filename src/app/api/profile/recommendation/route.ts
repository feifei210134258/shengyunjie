import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { buildGrowthProfile } from "@/lib/profile/growth-profile";
import { buildRecommendationPlan } from "@/lib/profile/recommendation";

async function loadProfileEvidence(supabase: any, userId: string) {
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
    .select("id, snapshot_date, created_at, overall_score, dimension_scores")
    .eq("user_id", userId)
    .order("snapshot_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(12);

  if (snapshotError) throw snapshotError;

  const growthProfile = buildGrowthProfile({
    latestReport,
    trainingRecords: trainingRecords || [],
    bootcampInterviews,
    growthSnapshots: growthSnapshots || [],
  });
  const thinkingAssets = growthProfile.thinkingAssets;
  const latestThinkingUpgrade = thinkingAssets[0] || null;
  const latestRecommendation =
    (growthSnapshots || []).find(
      (snapshot: any) => snapshot.dimension_scores?.__recommendation
    )?.dimension_scores?.__recommendation || null;
  const latestGoalFocus =
    (growthSnapshots || []).find(
      (snapshot: any) => snapshot.dimension_scores?.__goalFocus
    )?.dimension_scores?.__goalFocus || null;
  const latestGoalBrief =
    (growthSnapshots || []).find(
      (snapshot: any) => snapshot.dimension_scores?.__goalBrief
    )?.dimension_scores?.__goalBrief || null;
  const recommendationPlan = buildRecommendationPlan(growthProfile, latestGoalBrief);

  return {
    growthProfile,
    recommendationPlan,
    latestRecommendation,
    latestGoalFocus,
    latestGoalBrief,
    thinkingAssets,
    latestThinkingUpgrade,
  };
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

    const result = await loadProfileEvidence(supabase, user.id);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "服务器错误" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { recommendationId } = await req.json();
    if (!recommendationId) {
      return NextResponse.json({ error: "缺少推荐 ID" }, { status: 400 });
    }

    const { growthProfile, recommendationPlan } = await loadProfileEvidence(
      supabase,
      user.id
    );
    const recommendation = recommendationPlan.recommendations.find(
      (item) => item.id === recommendationId
    );

    if (!recommendation) {
      return NextResponse.json({ error: "推荐不存在" }, { status: 404 });
    }

    const dimensionScores = Object.fromEntries(
      growthProfile.dimensions.map((dimension) => [
        dimension.id,
        dimension.score,
      ])
    );
    const selectedRecommendation = {
      id: recommendation.id,
      title: recommendation.title,
      type: recommendation.type,
      href: recommendation.href,
      targetDimension: recommendation.targetDimension,
      selectedAt: new Date().toISOString(),
    };

    const { data: snapshot, error: insertError } = await supabase
      .from("growth_snapshots")
      .insert({
        user_id: user.id,
        dimension_scores: {
          ...dimensionScores,
          __recommendation: selectedRecommendation,
        },
        overall_score: growthProfile.summary.overallScore,
        training_count: growthProfile.summary.evidenceCount,
      })
      .select("id, snapshot_date, dimension_scores, overall_score, training_count")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      snapshot,
      selectedRecommendation,
      recommendationPlan,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "服务器错误" },
      { status: 500 }
    );
  }
}
