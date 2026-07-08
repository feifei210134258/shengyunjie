export type InterviewExpressionCard = {
  readiness: "面试可用" | "待二次修正";
  openingClaim: string;
  proofPoint: string;
  followupRisk: string;
  copyScript: string;
};

function normalizeText(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.replace(/\s+/g, " ").trim() || fallback;
}

function pickFirstText(...values: unknown[]) {
  return values.find((value) => typeof value === "string" && value.trim()) as
    | string
    | undefined;
}

export function buildInterviewExpressionCard(record: any): InterviewExpressionCard {
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
