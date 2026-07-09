import { createServerClient } from "@/lib/supabase-server";
import { buildCommandCenter } from "@/lib/dashboard/training-command-center";
import {
  getDiagnosisGrade,
  getDiagnosisReportSummary,
  normalizeDiagnosisScore,
} from "@/lib/diagnosis/report-summary";
import { buildGrowthProfile } from "@/lib/profile/growth-profile";
import { buildRecommendationPlan } from "@/lib/profile/recommendation";
import { NextResponse } from "next/server";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function toBeijingDateString(date: Date): string {
  return date.toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" }).replace(/\//g, "-");
}

async function calcStreak(supabase: any, userId: string): Promise<number> {
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const { data } = await supabase
    .from("training_sessions")
    .select("session_date")
    .eq("user_id", userId)
    .gte("session_date", toBeijingDateString(sixtyDaysAgo))
    .order("session_date", { ascending: false });

  const dates: string[] = data?.map((d: any) => d.session_date) || [];
  if (!dates.length) return 0;

  const today = toBeijingDateString(new Date());
  const yesterday = toBeijingDateString(new Date(Date.now() - 86400000));

  let streak = 0;
  let checkDate = dates.includes(today) ? today : yesterday;

  if (!dates.includes(checkDate)) return 0;

  while (dates.includes(checkDate)) {
    streak++;
    const d = new Date(checkDate + "T12:00:00+08:00");
    d.setDate(d.getDate() - 1);
    checkDate = toBeijingDateString(d);
  }

  return streak;
}

function compactText(value: unknown) {
  return String(value || "").trim();
}

function buildTargetEvidenceRepairs(
  bootcampSession: any,
  storyAssets: Array<{
    projectName?: string;
    targetEvidence?: string;
    targetFit?: { score?: number | null; priorityLabel?: string | null; missingEvidence?: string[] };
    href?: string;
  }>
) {
  const ledgeredProjects = new Set(
    storyAssets
      .filter(
        (asset) =>
          asset.projectName &&
          asset.targetEvidence &&
          asset.targetFit &&
          !asset.targetFit.missingEvidence?.length
      )
      .map((asset) => asset.projectName)
  );
  const projects = Array.isArray(bootcampSession?.parsed_profile?.projects)
    ? bootcampSession.parsed_profile.projects
    : [];

  return projects
    .map((project: any) => {
      const projectName = compactText(project?.name);
      const targetEvidence = compactText(project?.targetEvidence);
      if (!projectName || !targetEvidence || ledgeredProjects.has(projectName)) {
        return null;
      }
      const savedAsset = storyAssets.find((asset) => asset.projectName === projectName);
      return {
        projectName,
        company: compactText(project?.company),
        role: compactText(project?.role),
        targetEvidence,
        priorityLabel: savedAsset?.targetFit?.priorityLabel || "优先讲",
        targetFitScore:
          typeof savedAsset?.targetFit?.score === "number"
            ? savedAsset.targetFit.score
            : null,
        href: savedAsset?.href || "/bootcamp/story-bank",
      };
    })
    .filter(Boolean);
}

/* ------------------------------------------------------------------ */
/*  Route handler                                                      */
/* ------------------------------------------------------------------ */

export async function GET() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const userId = user.id;

    /* ------- Training Stats ------- */

    // Total count across all training records
    const { count: totalCount } = await supabase
      .from("training_records")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // Today's count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: todayCount } = await supabase
      .from("training_records")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", today.toISOString());

    // Dimension counts
    const { data: dimData } = await supabase
      .from("training_records")
      .select("dimension")
      .eq("user_id", userId);

    const dimStats: Record<string, number> = {};
    dimData?.forEach((r: any) => {
      dimStats[r.dimension] = (dimStats[r.dimension] || 0) + 1;
    });

    // Dimension averages (score / 10, rounded to 1 decimal)
    const { data: avgData } = await supabase
      .from("training_records")
      .select("dimension, score")
      .eq("user_id", userId)
      .not("score", "is", null);

    const dimAverages: Record<string, number> = {};
    const dimScoreCounts: Record<string, number> = {};

    avgData?.forEach((r: any) => {
      if (r.score != null) {
        const score10 = r.score / 10;
        dimScoreCounts[r.dimension] = (dimScoreCounts[r.dimension] || 0) + 1;
        dimAverages[r.dimension] = (dimAverages[r.dimension] || 0) + score10;
      }
    });

    Object.keys(dimAverages).forEach((d) => {
      dimAverages[d] =
        Math.round((dimAverages[d] / dimScoreCounts[d]) * 10) / 10;
    });

    // Streak based on training_sessions
    const streak = await calcStreak(supabase, userId);

    const trainingStats = {
      totalCount: totalCount || 0,
      todayCount: todayCount || 0,
      streak,
      dimStats,
      dimAverages,
    };

    const { data: recentActionRecords } = await supabase
      .from("training_records")
      .select("id, dimension, question_scenario, score, ai_feedback, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(8);

    const { data: profileTrainingRecords } = await supabase
      .from("training_records")
      .select("id, dimension, score, ai_feedback, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(80);

    const { data: bootcampSession } = await supabase
      .from("bootcamp_sessions")
      .select("id, status, current_day, parsed_profile, weakness_prediction")
      .eq("user_id", userId)
      .maybeSingle();

    /* ------- Latest Diagnosis Report ------- */

    const { data: latestReport } = await supabase
      .from("diagnosis_reports")
      .select("*, dimension_scores(*)")
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const latestReportSummary = getDiagnosisReportSummary(latestReport);

    let bootcampInterviews: any[] = [];
    if (bootcampSession?.id) {
      const { data: interviews } = await supabase
        .from("bootcamp_interviews")
        .select("id, question_type, status, user_answer, ai_evaluation, created_at")
        .eq("session_id", bootcampSession.id)
        .order("created_at", { ascending: false });
      bootcampInterviews = interviews || [];
    }

    const { data: growthSnapshots } = await supabase
      .from("growth_snapshots")
      .select("id, snapshot_date, overall_score, dimension_scores")
      .eq("user_id", userId)
      .order("snapshot_date", { ascending: false })
      .limit(12);

    const growthProfile = buildGrowthProfile({
      latestReport,
      trainingRecords: profileTrainingRecords || [],
      bootcampInterviews,
      growthSnapshots: growthSnapshots || [],
    });
    const targetEvidenceRepairs = buildTargetEvidenceRepairs(
      bootcampSession,
      growthProfile.storyAssets
    );
    const recommendationPlan = buildRecommendationPlan(growthProfile);
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

    /* ------- Profile Calculation ------- */

    let profile: {
      dimensions: { name: string; score: number; grade: string }[];
      weaknesses: string[];
    } | null = null;

    if (latestReport?.dimension_scores?.length) {
      const dimensions = latestReport.dimension_scores
        .map((ds: any) => {
          const score = normalizeDiagnosisScore(ds.score);
          if (score == null) return null;
          return {
            name: ds.dimension,
            score,
            grade: ds.grade || getDiagnosisGrade(score),
          };
        })
        .filter(Boolean) as { name: string; score: number; grade: string }[];

      // Weaknesses: the 2 lowest-scoring dimensions
      const sorted = [...dimensions].sort((a, b) => a.score - b.score);
      const weaknesses = sorted.slice(0, 2).map((d) => d.name);

      profile = { dimensions, weaknesses };
    }

    /* ------- Growth Trend (last 30 days) ------- */

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const { data: growthData } = await supabase
      .from("training_records")
      .select("dimension, score, created_at")
      .eq("user_id", userId)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .not("score", "is", null)
      .order("created_at", { ascending: true });

    const groupMap = new Map<string, { total: number; count: number }>();
    (growthData || []).forEach((r: any) => {
      const date = new Date(r.created_at).toISOString().slice(0, 10);
      const key = `${date}|${r.dimension}`;
      const existing = groupMap.get(key) || { total: 0, count: 0 };
      existing.total += r.score / 10;
      existing.count += 1;
      groupMap.set(key, existing);
    });

    const growthTrend = Array.from(groupMap.entries())
      .map(([key, val]) => {
        const [date, dimension] = key.split("|");
        return {
          date,
          dimension,
          avgScore: Math.round((val.total / val.count) * 10) / 10,
          count: val.count,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    /* ------- Response ------- */

    const reportResponse = latestReport
      ? {
          id: latestReport.id,
          completed_at: latestReport.completed_at,
          overall_score: latestReportSummary.overall_score,
          overall_grade: latestReportSummary.overall_grade,
          strengths: latestReport.strengths || [],
          weaknesses: latestReport.weaknesses || [],
          dimension_scores: latestReport.dimension_scores || [],
        }
      : null;

    const recentRecords = recentActionRecords || [];
    const hasCaseSimulation = recentRecords.some(
      (record: any) => record.ai_feedback?.source === "case_simulation"
    );
    const commandCenter = buildCommandCenter({
      todayCount: todayCount || 0,
      totalCount: totalCount || 0,
      recentRecords,
      dimAverages,
      profileWeaknesses: profile?.weaknesses || [],
      latestReport: latestReport ? { id: latestReport.id } : null,
      storyAssets: growthProfile.storyAssets,
      repairedTargetEvidence: targetEvidenceRepairs,
      latestGoalBrief,
      hasCaseSimulation,
      selectedGoalFocus: latestGoalFocus,
      bootcampSession: bootcampSession
        ? {
            status: bootcampSession.status,
            currentDay: bootcampSession.current_day,
            hasResume: Boolean(bootcampSession.parsed_profile),
            weaknessCount: Array.isArray(
              bootcampSession.weakness_prediction?.likely_gaps
            )
              ? bootcampSession.weakness_prediction.likely_gaps.length
              : 0,
          }
        : null,
    });

    return NextResponse.json({
      profile,
      growthProfile,
      recommendationPlan,
      latestRecommendation,
      latestGoalFocus,
      latestGoalBrief,
      trainingStats,
      growthTrend,
      latestReport: reportResponse,
      commandCenter,
      nextActions: {
        primary: commandCenter.primary,
        secondary: commandCenter.secondary,
        signals: commandCenter.signals,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "服务器错误" },
      { status: 500 }
    );
  }
}
