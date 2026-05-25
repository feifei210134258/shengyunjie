import { createServerClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

async function calcStreak(supabase: any, userId: string): Promise<number> {
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const { data } = await supabase
    .from("training_sessions")
    .select("session_date")
    .eq("user_id", userId)
    .gte("session_date", sixtyDaysAgo.toISOString().slice(0, 10))
    .order("session_date", { ascending: false });

  const dates = data?.map((d: any) => d.session_date) || [];
  if (!dates.length) return 0;

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  let streak = 0;
  let checkDate = dates.includes(today) ? today : yesterday;

  if (!dates.includes(checkDate)) return 0;

  while (dates.includes(checkDate)) {
    streak++;
    const d = new Date(checkDate);
    d.setDate(d.getDate() - 1);
    checkDate = d.toISOString().slice(0, 10);
  }

  return streak;
}

export async function GET() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  // 总完成题数
  const { count: totalCount } = await supabase
    .from("training_records")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  // 今日答题数
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count: todayCount } = await supabase
    .from("training_records")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", today.toISOString());

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
    .select("id, dimension, question_scenario, score, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

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
}
