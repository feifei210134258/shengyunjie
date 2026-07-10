import { createServerClient } from "@/lib/supabase-server";
import { getBeijingDate } from "@/lib/date";
import {
  getBeijingMonthUtcRange,
  getUniqueBeijingMonthDays,
} from "@/lib/training/completion";
import {
  getCompletedTrainingDimensions,
  getNextTrainingIndexFromCompleted,
  getRotatedTrainingDimensions,
} from "@/lib/training/session-progress";
import { buildThinkingAssets } from "@/lib/profile/growth-profile";
import { NextRequest, NextResponse } from "next/server";

// 查询训练会话
// ?date=2024-03-10   → 返回当天会话（含 5 道题）
// ?month=2024-03     → 返回当月有训练的日期列表
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const month = searchParams.get("month");

    // 按日查询
    if (date) {
      const startUtc = new Date(`${date}T00:00:00+08:00`);
      const endUtc = new Date(startUtc);
      endUtc.setDate(endUtc.getDate() + 1);

      const [
        { data: session },
        { data: records },
        { data: growthSnapshots },
      ] = await Promise.all([
        supabase
          .from("training_sessions")
          .select("*")
          .eq("user_id", user.id)
          .eq("session_date", date)
          .maybeSingle(),
        supabase
          .from("training_records")
          .select("dimension, created_at")
          .eq("user_id", user.id)
          .gte("created_at", startUtc.toISOString())
          .lt("created_at", endUtc.toISOString())
          .order("created_at", { ascending: true }),
        supabase
          .from("growth_snapshots")
          .select("id, snapshot_date, created_at, dimension_scores")
          .eq("user_id", user.id)
          .order("snapshot_date", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(12),
      ]);

      const completedDimensions = getCompletedTrainingDimensions(records || []);
      const trainingOrder = getRotatedTrainingDimensions(startUtc);
      const nextIndex = getNextTrainingIndexFromCompleted(
        completedDimensions,
        trainingOrder
      );
      const latestGoalFocus =
        (growthSnapshots || []).find(
          (snapshot: any) => snapshot.dimension_scores?.__goalFocus
        )?.dimension_scores?.__goalFocus || null;
      const latestGoalBrief =
        (growthSnapshots || []).find(
          (snapshot: any) => snapshot.dimension_scores?.__goalBrief
        )?.dimension_scores?.__goalBrief || null;
      const latestThinkingUpgrade =
        buildThinkingAssets(
          (growthSnapshots || []).filter(
            (snapshot: any) =>
              snapshot.dimension_scores?.__trigger?.trigger ===
              "thinking_upgrade_saved"
          )
        )[0] || null;
      return NextResponse.json({
        session,
        completedDimensions,
        nextIndex,
        latestGoalFocus,
        latestGoalBrief,
        latestThinkingUpgrade,
      });
    }

    // 按月查询 — 返回当月已提交训练答案的日期数组
    if (month) {
      const { startIso, endIso } = getBeijingMonthUtcRange(month);

      const { data } = await supabase
        .from("training_records")
        .select("created_at")
        .eq("user_id", user.id)
        .gte("created_at", startIso)
        .lt("created_at", endIso)
        .order("created_at", { ascending: true });

      const days = getUniqueBeijingMonthDays(data || [], month);
      return NextResponse.json({ days, count: days.length });
    }

    // 无参数 — 返回最近 30 天的会话摘要
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data } = await supabase
      .from("training_sessions")
      .select("session_date, questions")
      .eq("user_id", user.id)
      .gte("session_date", getBeijingDate(thirtyDaysAgo))
      .order("session_date", { ascending: false })
      .limit(30);

    return NextResponse.json({ sessions: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "服务器错误" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const { questions } = await req.json();
    if (!Array.isArray(questions)) {
      return NextResponse.json({ error: "questions 必须是数组" }, { status: 400 });
    }

    const today = getBeijingDate();

    // 查询今日是否已有记录
    const { data: existing } = await supabase
      .from("training_sessions")
      .select("questions")
      .eq("user_id", user.id)
      .eq("session_date", today)
      .single();

    const merged = { ...(existing?.questions || {}) };
    const existingKeys = Object.keys(merged);
    questions.forEach((q: string, i: number) => {
      merged[`round_${existingKeys.length + i}`] = q;
    });

    const { error } = await supabase
      .from("training_sessions")
      .upsert(
        {
          user_id: user.id,
          session_date: today,
          questions: merged,
        },
        { onConflict: "user_id,session_date" }
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "服务器错误" }, { status: 500 });
  }
}
