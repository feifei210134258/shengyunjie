import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const { answers } = await req.json();

    // 计算各维度得分
    const dimensions = [
      { id: "strategic_thinking", keyPrefix: "st", label: "战略思维" },
      { id: "system_design", keyPrefix: "sd", label: "系统设计能力" },
      { id: "data_decision", keyPrefix: "dd", label: "数据决策能力" },
      { id: "user_insight", keyPrefix: "ui", label: "用户洞察与需求管理" },
      { id: "commercial_thinking", keyPrefix: "ct", label: "商业思维" },
    ];

    const dimensionScores = dimensions.map((dim) => {
      const scores = Object.entries(answers)
        .filter(([key]) => key.startsWith(dim.keyPrefix))
        .map(([, v]) => v as number);
      const avg = scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 20)
        : 50;
      const grade = avg >= 85 ? "A" : avg >= 75 ? "B+" : avg >= 65 ? "B-" : "C";
      return { dimension: dim.id, score: avg, grade, label: dim.label };
    });

    const overallScore = Math.round(
      dimensionScores.reduce((s, d) => s + d.score, 0) / dimensionScores.length
    );

    // 创建诊断报告
    const { data: report, error: reportErr } = await supabase
      .from("diagnosis_reports")
      .insert({
        user_id: user.id,
        status: "in_progress",
        stage1_data: { answers, dimensionScores, overallScore },
      })
      .select()
      .single();

    if (reportErr) {
      return NextResponse.json({ error: reportErr.message }, { status: 500 });
    }

    // 写入维度得分
    const { error: dimErr } = await supabase.from("dimension_scores").insert(
      dimensionScores.map((d) => ({ report_id: report.id, ...d }))
    );

    if (dimErr) {
      return NextResponse.json({ error: dimErr.message }, { status: 500 });
    }

    return NextResponse.json({ reportId: report.id, score: overallScore, dimensions: dimensionScores });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "服务器错误" }, { status: 500 });
  }
}
