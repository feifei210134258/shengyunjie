import { InterviewQuestion, AIEvaluation } from "@/types/bootcamp";

export function calculateDayProgress(questions: InterviewQuestion[]): {
  completed: number;
  total: number;
  allEvaluated: boolean;
} {
  const completed = questions.filter((q) => q.status === "evaluated").length;
  return {
    completed,
    total: questions.length,
    allEvaluated: completed === questions.length,
  };
}

export function calculateAverageScores(
  questions: InterviewQuestion[]
): Record<string, number> {
  const evaluated = questions.filter((q) => q.ai_evaluation);
  if (evaluated.length === 0) return {};

  const dimensions = ["structure", "logic", "professionalism", "innovation"];
  const result: Record<string, number> = {};

  for (const dim of dimensions) {
    const scores = evaluated
      .map((q) => q.ai_evaluation?.[dim as keyof AIEvaluation] as number)
      .filter((s): s is number => s !== undefined);
    result[dim] = scores.length
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) /
        10
      : 0;
  }

  return result;
}

export function getDifficultyLabel(day: number): string {
  switch (day) {
    case 1:
      return "基础";
    case 2:
      return "进阶";
    case 3:
      return "实战";
    default:
      return "基础";
  }
}
