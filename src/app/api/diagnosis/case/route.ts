import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const { reportId, caseData } = await req.json();

    if (!reportId) {
      return NextResponse.json({ error: "缺少 reportId" }, { status: 400 });
    }

    // 更新并完成诊断报告
    const { error } = await supabase
      .from("diagnosis_reports")
      .update({
        stage3_case_data: caseData,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", reportId)
      .eq("user_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // 创建成长快照
    const { data: dims } = await supabase
      .from("dimension_scores")
      .select("dimension, score")
      .eq("report_id", reportId);

    const dimScores: Record<string, number> = {};
    dims?.forEach((d) => { dimScores[d.dimension] = d.score; });

    const overallScore = dims?.length
      ? Math.round(dims.reduce((s, d) => s + d.score, 0) / dims.length)
      : 0;

    await supabase.from("growth_snapshots").insert({
      user_id: user.id,
      dimension_scores: dimScores,
      overall_score: overallScore,
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "服务器错误" }, { status: 500 });
  }
}
