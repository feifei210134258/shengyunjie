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

/**
 * 计算文本相似度（0-1），基于最长公共子序列
 */
export function textSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const lcs = lcsLength(a, b);
  return lcs / Math.max(a.length, b.length);
}
