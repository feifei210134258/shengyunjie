export const CASE_PERSPECTIVES = [
  { slug: "overview", label: "全局分析" },
  { slug: "positioning", label: "产品定位" },
  { slug: "growth", label: "增长飞轮" },
  { slug: "business-model", label: "商业模式" },
  { slug: "pricing", label: "定价策略" },
  { slug: "architecture", label: "功能架构" },
  { slug: "competition", label: "竞争博弈" },
  { slug: "retention", label: "留存激活" },
  { slug: "ecosystem", label: "生态平台" },
] as const;

export type CasePerspectiveSlug = (typeof CASE_PERSPECTIVES)[number]["slug"];

const PERSPECTIVE_LABELS = Object.fromEntries(
  CASE_PERSPECTIVES.map((perspective) => [
    perspective.slug,
    perspective.label,
  ])
) as Record<string, string>;

export function getPerspectiveLabel(slug: string | null | undefined) {
  return PERSPECTIVE_LABELS[slug || ""] || CASE_PERSPECTIVES[0].label;
}
