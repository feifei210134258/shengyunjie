import { createServerClient } from "@/lib/supabase-server";
import { getBeijingDate } from "@/lib/date";
import { NextRequest, NextResponse } from "next/server";

function sanitizeMigrationTarget(value: any) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const trainingRecordId = String(value.trainingRecordId || "").trim();
  if (!trainingRecordId) return null;
  return {
    snapshotId: String(value.snapshotId || "").trim(),
    savedAt: value.savedAt ? String(value.savedAt).trim() : null,
    trainingRecordId,
    dimension: String(value.dimension || "").trim(),
    dimensionLabel: String(value.dimensionLabel || "产品思维").trim(),
    judgmentQuality: String(value.judgmentQuality || "").trim(),
    tradeoffQuality: String(value.tradeoffQuality || "").trim(),
    attributionDepth: String(value.attributionDepth || "").trim(),
    landingRigor: String(value.landingRigor || "").trim(),
    migrationCheck: String(value.migrationCheck || "").trim(),
    href: String(value.href || "").trim(),
  };
}

function sanitizeGoalBrief(value: any) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const targetRole = String(value.targetRole || "").trim();
  const targetScenario = String(value.targetScenario || "").trim();
  const targetDeadline = String(value.targetDeadline || "").trim();
  if (!targetRole && !targetScenario && !targetDeadline) return null;
  return {
    targetRole,
    targetScenario,
    targetDeadline,
  };
}

// 保存/更新当天某维度的题目
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const { dimension, question } = await req.json();
    const questionText =
      typeof question === "string"
        ? question.trim()
        : String(question?.text || question?.question || "").trim();

    if (!dimension || !questionText) {
      return NextResponse.json({ error: "缺少 dimension 或 question" }, { status: 400 });
    }

    const today = getBeijingDate();

    const { data: existing } = await supabase
      .from("training_sessions")
      .select("questions")
      .eq("user_id", user.id)
      .eq("session_date", today)
      .maybeSingle();

    const existingQuestion = existing?.questions?.[dimension];
    const previousQuestion =
      existingQuestion && typeof existingQuestion === "object"
        ? existingQuestion
        : {};

    const mergedQuestions = {
      ...(existing?.questions || {}),
      [dimension]:
        typeof question === "string"
          ? questionText
          : {
              text: questionText,
              reason: String(question?.reason ?? previousQuestion?.reason ?? "").trim(),
              hint: String(question?.hint ?? previousQuestion?.hint ?? "").trim(),
              missionId: String(
                question?.missionId ?? previousQuestion?.missionId ?? ""
              ).trim(),
              dimension: String(
                question?.dimension ?? previousQuestion?.dimension ?? ""
              ).trim(),
              targetId: String(
                question?.targetId ?? previousQuestion?.targetId ?? ""
              ).trim(),
              targetLabel: String(
                question?.targetLabel ?? previousQuestion?.targetLabel ?? ""
              ).trim(),
              profileFocus: String(
                question?.profileFocus ?? previousQuestion?.profileFocus ?? ""
              ).trim(),
              prescriptionId: String(
                question?.prescriptionId ?? previousQuestion?.prescriptionId ?? ""
              ).trim(),
              migrationTarget:
                sanitizeMigrationTarget(question?.migrationTarget) ??
                sanitizeMigrationTarget(previousQuestion?.migrationTarget),
              goalBrief:
                sanitizeGoalBrief(question?.goalBrief) ??
                sanitizeGoalBrief(previousQuestion?.goalBrief),
              draftAnswer:
                typeof question?.draftAnswer === "string"
                  ? question.draftAnswer
                  : String(previousQuestion?.draftAnswer || ""),
            },
    };

    const { error } = await supabase
      .from("training_sessions")
      .upsert(
        {
          user_id: user.id,
          session_date: today,
          questions: mergedQuestions,
        },
        { onConflict: "user_id,session_date" }
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "服务器错误" }, { status: 500 });
  }
}
