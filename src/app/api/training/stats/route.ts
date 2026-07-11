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

    return NextResponse.json({
      totalCount: totalCount || 0,
      todayCount: todayCount || 0,
      dimStats,
      dimAverages,
      streak,
      recent,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "服务器错误" }, { status: 500 });
  }
}
