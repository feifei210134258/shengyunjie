import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

function normalizeText(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.replace(/\s+/g, " ").trim() || fallback;
}

function pickFirstText(...values: unknown[]) {
  return values.find((value) => typeof value === "string" && value.trim()) as
    | string
    | undefined;
}

function buildInterviewExpressionCard(record: any) {
  const feedback =
    record.ai_feedback && typeof record.ai_feedback === "object"
      ? record.ai_feedback
      : {};
  const revision = feedback.__revision;
  const revisedAnswer =
    revision && typeof revision.revisedAnswer === "string"
      ? revision.revisedAnswer.trim()
      : "";
  const baseAnswer = revisedAnswer || normalizeText(record.user_answer);
  const openingClaim =
    baseAnswer
      .split(/[\n。！？!?]/)
      .map((item: string) => item.trim())
      .find(Boolean)
      ?.slice(0, 90) || "先给出清晰判断，再说明依据、取舍和验证方式。";
  const proofPoint = normalizeText(
    pickFirstText(
      revisedAnswer,
      feedback.strength,
      feedback.improvement,
      feedback.next_practice,
      feedback.analysis
    ),
    "补充结果指标、用户证据或业务影响后，这条材料会更适合面试复述。"
  ).slice(0, 160);
  const followupRisk = normalizeText(
    pickFirstText(
      feedback.weakness,
      Array.isArray(feedback.gaps) ? feedback.gaps[0] : "",
      Array.isArray(feedback.hidden_risks) ? feedback.hidden_risks[0] : "",
      feedback.next_practice
    ),
    revisedAnswer
      ? "面试官可能继续追问取舍依据、边界条件和验证指标。"
      : "当前还缺少二次修正，面试官容易追问判断依据是否充分。"
  ).slice(0, 140);

  return {
    readiness: revisedAnswer ? "面试可用" : "待二次修正",
    openingClaim,
    proofPoint,
    followupRisk,
    copyScript: `我的判断是：${openingClaim}。关键依据是：${proofPoint}。如果被继续追问，我会补充：${followupRisk}`,
  };
}

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
