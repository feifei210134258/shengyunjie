import { createServerClient } from "@/lib/supabase-server";
import { getDimensionLabel } from "@/lib/constants";
import { TRAINING_SESSION_ROUTE } from "@/lib/routes";
import {
  getDiagnosisGrade,
  getDiagnosisReportSummary,
  normalizeDiagnosisScore,
} from "@/lib/diagnosis/report-summary";
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

function getAverageScore(records: any[]) {
  const scores = records
    .map((record) => Number(record.score))
    .filter((score) => Number.isFinite(score) && score > 0);
  if (!scores.length) return null;
  return Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length / 10) * 10) / 10;
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
    const recentAverage = getAverageScore(recentRecords);
    const latestRecord = recentRecords[0] || null;
    const hasCaseSimulation = recentRecords.some(
      (record: any) => record.ai_feedback?.source === "case_simulation"
    );
    const weakestDimension =
      profile?.weaknesses?.[0] ||
      Object.entries(dimAverages)
        .sort((a, b) => Number(a[1]) - Number(b[1]))[0]?.[0] ||
      "战略思维";
    const weakestDimensionLabel = getDimensionLabel(weakestDimension);
    const primaryAction = !latestReport
      ? {
          title: "先完成一次能力诊断",
          description: "系统需要一份完整画像，才能把训练题、案例和特训建议聚焦到真实短板。",
          href: "/diagnosis/scale",
          cta: "开始诊断",
          kind: "diagnosis",
        }
      : (todayCount || 0) === 0
        ? {
            title: `今日先练 ${weakestDimensionLabel}`,
            description: "完成一题高质量作答，再用 AI 反馈校准今天的判断链路。",
            href: TRAINING_SESSION_ROUTE,
            cta: "开始训练",
            kind: "training",
          }
        : recentAverage != null && recentAverage < 7
          ? {
              title: "复盘最近一次低分回答",
              description: "先把盲区、改写示范和下一题建议吃透，再继续刷题。",
              href: latestRecord ? `/training/history/${latestRecord.id}` : "/training",
              cta: "查看复盘",
              kind: "review",
            }
          : !hasCaseSimulation
            ? {
                title: "做一次案例决策推演",
                description: "从读案例进入取舍训练，把战略判断写入训练档案。",
                href: "/training/cases",
                cta: "去案例库",
                kind: "case",
              }
            : {
                title: "继续推进下一题训练",
                description: "当前节奏不错，保持每日一次高质量训练即可。",
                href: TRAINING_SESSION_ROUTE,
                cta: "继续训练",
                kind: "training",
              };

    const latestReportHref = latestReport
      ? `/diagnosis/report?reportId=${encodeURIComponent(latestReport.id)}`
      : "/diagnosis/scale";

    const secondaryActions = [
        {
          title: "案例库推演",
          description: hasCaseSimulation ? "已有推演记录，可继续换产品做取舍。" : "补一次真实产品决策题。",
          href: "/training/cases",
          cta: "打开",
          kind: "case",
        },
        {
          title: "复盘归档",
          description: latestRecord ? `最近记录：${getDimensionLabel(latestRecord.dimension)}` : "训练后会自动沉淀复盘记录。",
          href: latestRecord ? `/training/history/${latestRecord.id}` : "/training",
          cta: "查看",
          kind: "review",
        },
        {
          title: "能力报告",
          description: latestReportSummary.overall_score != null ? `最近诊断 ${latestReportSummary.overall_score} 分` : "暂无完整诊断报告。",
          href: latestReportHref,
          cta: latestReport ? "查看" : "诊断",
          kind: "diagnosis",
        },
      ].filter((action) => action.kind !== primaryAction.kind);

    const nextActions = {
      primary: primaryAction,
      secondary: secondaryActions,
      signals: {
        weakestDimension: weakestDimensionLabel,
        recentAverage,
        hasCaseSimulation,
      },
    };

    return NextResponse.json({
      profile,
      trainingStats,
      growthTrend,
      latestReport: reportResponse,
      nextActions,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "服务器错误" },
      { status: 500 }
    );
  }
}
