import { createServerClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

async function calcStreak(supabase: any, userId: string): Promise<number> {
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const { data } = await supabase
    .from("training_sessions")
    .select("session_date")
    .eq("user_id", userId)
    .gte("session_date", sixtyDaysAgo.toISOString().slice(0, 10))
    .order("session_date", { ascending: false });

  const dates: string[] = data?.map((d: any) => d.session_date) || [];
  if (!dates.length) return 0;

  const today = new Date().toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" }).replace(/\//g, "-");
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" }).replace(/\//g, "-");

  let streak = 0;
  let checkDate = dates.includes(today) ? today : yesterday;

  if (!dates.includes(checkDate)) return 0;

  while (dates.includes(checkDate)) {
    streak++;
    const d = new Date(checkDate);
    d.setDate(d.getDate() - 1);
    checkDate = d.toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" }).replace(/\//g, "-");
  }

  return streak;
}

function getGrade(score: number): string {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 50) return "C";
  return "D";
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

    /* ------- Latest Diagnosis Report ------- */

    const { data: latestReport } = await supabase
      .from("diagnosis_reports")
      .select("*, dimension_scores(*)")
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    /* ------- Profile Calculation ------- */

    let profile: {
      dimensions: { name: string; score: number; grade: string }[];
      weaknesses: string[];
    } | null = null;

    if (latestReport?.dimension_scores?.length) {
      const dimensions = latestReport.dimension_scores.map((ds: any) => ({
        name: ds.dimension,
        score: ds.score,
        grade: ds.grade || getGrade(ds.score),
      }));

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
          overall_score: latestReport.overall_score,
          overall_grade: latestReport.overall_grade,
          strengths: latestReport.strengths || [],
          weaknesses: latestReport.weaknesses || [],
          dimension_scores: latestReport.dimension_scores || [],
        }
      : null;

    return NextResponse.json({
      profile,
      trainingStats,
      growthTrend,
      latestReport: reportResponse,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "服务器错误" },
      { status: 500 }
    );
  }
}