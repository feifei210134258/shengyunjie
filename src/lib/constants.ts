/** Shared design constants - single source of truth for colors and labels. */

/** Grade badge colors */
export const GRADE_STYLES: Record<string, { bg: string; text: string }> = {
  A: { bg: "bg-success-soft", text: "text-success" },
  B: { bg: "bg-info-soft", text: "text-info" },
  C: { bg: "bg-warning-soft", text: "text-warning" },
  D: { bg: "bg-danger-soft", text: "text-danger" },
};

/** Dimension colors for charts */
export const DIMENSION_COLORS: Record<string, string> = {
  "战略思维": "#4338CA",
  "系统设计能力": "#0D9488",
  "数据决策能力": "#2563EB",
  "用户洞察与需求管理": "#7C3AED",
  "商业思维": "#0891B2",
  strategic_thinking: "#4338CA",
  system_design: "#0D9488",
  data_decision: "#2563EB",
  user_insight: "#7C3AED",
  commercial_thinking: "#0891B2",
};

/** Chart common colors */
export const CHART_COLORS = {
  grid: "#E2E8F0",
  axis: "#777586",
  tooltip: "#FFFFFF",
  tooltipBorder: "#E2E8F0",
  primary: "#4338CA",
  primaryFill: "rgba(67, 56, 202, 0.12)",
  secondary: "#0D9488",
  secondaryFill: "rgba(13, 148, 136, 0.12)",
};

/** Ability dimension labels */
export const DIMENSIONS = [
  "战略思维",
  "系统设计能力",
  "数据决策能力",
  "用户洞察与需求管理",
  "商业思维",
] as const;

/** Short labels for dimensions */
export const DIM_LABELS: Record<string, string> = {
  "战略思维": "战略思维",
  "系统设计能力": "系统设计",
  "数据决策能力": "数据决策",
  "用户洞察与需求管理": "用户洞察",
  "商业思维": "商业思维",
};

export const DIM_FULL_LABELS: Record<string, string> = {
  ...DIM_LABELS,
  strategic_thinking: "战略思维",
  system_design: "系统设计能力",
  data_decision: "数据决策能力",
  user_insight: "用户洞察与需求管理",
  commercial_thinking: "商业思维",
};

export const DIM_SHORT_LABELS: Record<string, string> = {
  ...DIM_LABELS,
  strategic_thinking: "战略思维",
  system_design: "系统设计",
  data_decision: "数据决策",
  user_insight: "用户洞察",
  commercial_thinking: "商业思维",
};

export function getDimensionLabel(dimension: string | null | undefined) {
  if (!dimension) return "";
  return DIM_FULL_LABELS[dimension] || dimension;
}

export function getDimensionShortLabel(dimension: string | null | undefined) {
  if (!dimension) return "";
  return DIM_SHORT_LABELS[dimension] || dimension;
}
