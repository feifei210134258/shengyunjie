import { createServerClient } from "@/lib/supabase-server";
import {
  getDiagnosisGrade,
  getDiagnosisReportSummary,
  normalizeDiagnosisScore,
} from "@/lib/diagnosis/report-summary";
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

    const { data: dims } = await supabase
      .from("dimension_scores")
      .select("dimension, score")
      .eq("report_id", reportId);

    const summary = getDiagnosisReportSummary({ dimension_scores: dims || [] });
    const scoredDimensions = (dims || [])
      .map((d) => ({
        dimension: d.dimension,
        score: normalizeDiagnosisScore(d.score),
      }))
      .filter((d): d is { dimension: string; score: number } => d.score != null);
    const sortedDimensions = [...scoredDimensions].sort((a, b) => a.score - b.score);
    const weaknesses = sortedDimensions.slice(0, 2).map((d) => d.dimension);
    const strengths = sortedDimensions.slice(-2).reverse().map((d) => d.dimension);

    // 更新并完成诊断报告
    const { error } = await supabase
      .from("diagnosis_reports")
      .update({
        stage3_case_data: caseData,
        status: "completed",
        overall_score: summary.overall_score,
        overall_grade:
          summary.overall_score == null
            ? null
            : summary.overall_grade || getDiagnosisGrade(summary.overall_score),
        strengths,
        weaknesses,
        completed_at: new Date().toISOString(),
      })
      .eq("id", reportId)
      .eq("user_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // 创建成长快照
    const dimScores: Record<string, number> = {};
    scoredDimensions.forEach((d) => { dimScores[d.dimension] = d.score; });

    await supabase.from("growth_snapshots").insert({
      user_id: user.id,
      dimension_scores: dimScores,
      overall_score: summary.overall_score || 0,
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "服务器错误" }, { status: 500 });
  }
}
