export type TrendPoint = {
  date: string;
  avgScore: number;
};

export function getLatestTrendScore(trendData: TrendPoint[]) {
  if (!trendData.length) return null;
  return trendData[trendData.length - 1]?.avgScore ?? null;
}
