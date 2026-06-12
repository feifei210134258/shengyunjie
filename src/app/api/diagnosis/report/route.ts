import { createServerClient } from "@/lib/supabase-server";
import { getDiagnosisReportViewModel } from "@/lib/diagnosis/report-detail";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const reportId = req.nextUrl.searchParams.get("reportId");

    let query = supabase
      .from("diagnosis_reports")
      .select("*, dimension_scores(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (reportId) {
      query = supabase
        .from("diagnosis_reports")
        .select("*, dimension_scores(*)")
        .eq("id", reportId)
        .eq("user_id", user.id);
    }

    const { data, error } = await query.single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(getDiagnosisReportViewModel(data));
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "服务器错误" }, { status: 500 });
  }
}
