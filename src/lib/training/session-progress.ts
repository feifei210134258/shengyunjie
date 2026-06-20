export const TRAINING_DIMENSIONS = [
  "战略思维",
  "系统设计能力",
  "数据决策能力",
  "用户洞察与需求管理",
  "商业思维",
] as const;

export type TrainingDimension = (typeof TRAINING_DIMENSIONS)[number];

export type CompletedDimensionRecord = {
  dimension: string | null;
};

export function getCompletedTrainingDimensions(
  records: CompletedDimensionRecord[],
  dimensions: readonly string[] = TRAINING_DIMENSIONS
) {
  const dimensionSet = new Set(dimensions);
  const completed = new Set<string>();

  for (const record of records) {
    const dimension = String(record.dimension || "").trim();
    if (dimensionSet.has(dimension)) {
      completed.add(dimension);
    }
  }

  return dimensions.filter((dimension) => completed.has(dimension));
}

export function getNextTrainingIndexFromCompleted(
  completedDimensions: readonly string[],
  dimensions: readonly string[] = TRAINING_DIMENSIONS
) {
  const completed = new Set(completedDimensions);
  const nextIndex = dimensions.findIndex((dimension) => !completed.has(dimension));
  return nextIndex >= 0 ? nextIndex : 0;
}
