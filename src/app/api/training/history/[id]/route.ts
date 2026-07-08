import { createServerClient } from "@/lib/supabase-server";
import { buildInterviewExpressionCard } from "@/lib/training/interview-expression-card";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await params;

  const { data, error } = await supabase
    .from("training_records")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "记录不存在" }, { status: 404 });
  }

  return NextResponse.json({
    record: {
      ...data,
      interviewExpressionCard: buildInterviewExpressionCard(data),
    },
  });
}
