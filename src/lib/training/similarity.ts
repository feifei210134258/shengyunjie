/**
 * 计算两个字符串的最长公共子序列长度
 */
function lcsLength(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp[m][n];
}

function normalizeForSimilarity(text: string) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\u4e00-\u9fa5]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string) {
  const normalized = normalizeForSimilarity(text);
  if (!normalized) return [];
  return normalized.split(" ").filter(Boolean);
}

/**
 * 计算文本相似度（0-1），基于最长公共子序列
 */
export function textSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const lcs = lcsLength(a, b);
  return lcs / Math.max(a.length, b.length);
}

/**
 * 计算词面相似度（0-1），基于分词集合的 Jaccard
 */
export function tokenSimilarity(a: string, b: string): number {
  const tokensA = new Set(tokenize(a));
  const tokensB = new Set(tokenize(b));
  if (!tokensA.size || !tokensB.size) return 0;

  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) intersection += 1;
  }

  const union = tokensA.size + tokensB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

/**
 * 计算训练题语义重复分数（0-1），兼顾字面和词组层面的重合
 */
export function questionSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const lcsScore = textSimilarity(a, b);
  const tokenScore = tokenSimilarity(a, b);
  return Math.max(lcsScore, tokenScore * 0.95);
}
