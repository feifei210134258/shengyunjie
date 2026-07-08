import { createServerClient } from "@/lib/supabase-server";
import { getBeijingDate } from "@/lib/date";
import {
  calcStreakFromBeijingDates,
  getUniqueBeijingDates,
} from "@/lib/training/completion";
import { NextResponse } from "next/server";

async function calcStreak(supabase: any, userId: string): Promise<number> {
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const { data } = await supabase
    .from("training_records")
    .select("created_at")
    .eq("user_id", userId)
    .gte("created_at", sixtyDaysAgo.toISOString())
    .order("created_at", { ascending: false });

  const dates = getUniqueBeijingDates(data || []);
  return calcStreakFromBeijingDates(dates, getBeijingDate());
}

function buildReviewQueue(records: any[] = []) {
  return records
    .map((record) => {
      const revision = record.ai_feedback?.__revision;
      const hasRevision =
        revision && typeof revision.revisedAnswer === "string" && revision.revisedAnswer.trim();

      return {
        id: record.id,
        dimension: record.dimension,
        question_scenario: record.question_scenario,
        score: record.score,
        created_at: record.created_at,
        needsRevision: !hasRevision,
        revisionSavedAt:
          revision && typeof revision.savedAt === "string" ? revision.savedAt : null,
      };
    })
    .sort((a, b) => Number(b.needsRevision) - Number(a.needsRevision))
    .slice(0, 4);
}

function extractProofPoint(feedback: any, revision: any) {
  if (revision && typeof revision.revisedAnswer === "string") {
    const revisedAnswer = revision.revisedAnswer.trim();
    if (revisedAnswer) {
      return revisedAnswer;
    }
  }

  const candidates = [
    feedback?.next_practice,
    feedback?.improvement,
    feedback?.weakness,
    feedback?.strength,
    feedback?.analysis,
  ];
  const proofPoint = candidates.find(
    (item) => typeof item === "string" && item.trim()
  );

  return proofPoint?.trim() || "完成二次修正后，这条记录会变成可复述的能力证据。";
}

function buildEvidenceAssets(records: any[] = []) {
  return records.slice(0, 5).map((record) => {
    const feedback =
      record.ai_feedback && typeof record.ai_feedback === "object"
        ? record.ai_feedback
        : {};
    const revision = feedback.__revision;
    const hasRevision =
      revision &&
      typeof revision.revisedAnswer === "string" &&
      revision.revisedAnswer.trim();
    const questionTitle = String(record.question_scenario || "")
      .replace(/\s+/g, " ")
      .trim();

    return {
      id: record.id,
      dimension: record.dimension,
      title: questionTitle || "训练回答",
      score: record.score,
      proofPoint: extractProofPoint(feedback, revision).slice(0, 140),
      readiness: hasRevision ? "面试可用" : "待修正后可用",
      href: hasRevision
        ? `/training/history/${record.id}`
        : `/training/history/${record.id}?revise=1`,
      sourceLabel: feedback.source === "case_simulation" ? "案例推演" : "训练回答",
      updatedAt:
        revision && typeof revision.savedAt === "string"
          ? revision.savedAt
          : record.created_at,
    };
  });
}

export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    // 总完成题数
    const { count: totalCount } = await supabase
      .from("training_records")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    // 今日答题数（按北京时间）
    const todayStr = getBeijingDate();
    const todayStartUTC = new Date(`${todayStr}T00:00:00+08:00`);
    const { count: todayCount } = await supabase
      .from("training_records")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", todayStartUTC.toISOString());

    // 各维度完成数
    const { data: dimData } = await supabase
      .from("training_records")
      .select("dimension")
      .eq("user_id", user.id);

    const dimStats: Record<string, number> = {};
    dimData?.forEach((r) => {
      dimStats[r.dimension] = (dimStats[r.dimension] || 0) + 1;
    });

    // 最近训练
    const { data: recent } = await supabase
      .from("training_records")
      .select("id, dimension, question_scenario, score, ai_feedback, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8);

    // 各维度平均分
    const { data: avgData } = await supabase
      .from("training_records")
      .select("dimension, score")
      .eq("user_id", user.id)
      .not("score", "is", null);

    const dimAverages: Record<string, number> = {};
    const dimScoreCounts: Record<string, number> = {};

    avgData?.forEach((r: any) => {
      if (r.score) {
        const score10 = r.score / 10;
        dimScoreCounts[r.dimension] = (dimScoreCounts[r.dimension] || 0) + 1;
        dimAverages[r.dimension] = (dimAverages[r.dimension] || 0) + score10;
      }
    });

    Object.keys(dimAverages).forEach((d) => {
      dimAverages[d] = Math.round((dimAverages[d] / dimScoreCounts[d]) * 10) / 10;
    });

    const streak = await calcStreak(supabase, user.id);
    const reviewQueue = buildReviewQueue(recent || []);
    const evidenceAssets = buildEvidenceAssets(recent || []);

    return NextResponse.json({
      totalCount: totalCount || 0,
      todayCount: todayCount || 0,
      dimStats,
      dimAverages,
      streak,
      recent,
      reviewQueue,
      evidenceAssets,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "服务器错误" }, { status: 500 });
  }
}
