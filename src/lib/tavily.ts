/* ------------------------------------------------------------------ */
/*  Tavily Web Search API 工具函数                                      */
/* ------------------------------------------------------------------ */

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface TavilySearchResponse {
  results: TavilySearchResult[];
  answer?: string;
}

/**
 * 调用 Tavily Search API 获取网页搜索结果
 * 失败时返回空结果（优雅降级，不阻塞主流程）
 */
export async function searchWeb(
  query: string,
  options?: {
    maxResults?: number;
    searchDepth?: "basic" | "deep";
    includeAnswer?: boolean;
  }
): Promise<TavilySearchResponse> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.warn("[Tavily] TAVILY_API_KEY 未配置，跳过搜索");
    return { results: [] };
  }

  const { maxResults = 5, searchDepth = "basic", includeAnswer = true } = options || {};

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: searchDepth,
        max_results: maxResults,
        include_answer: includeAnswer,
      }),
    });

    if (!res.ok) {
      console.warn(`[Tavily] API 返回 ${res.status}: ${res.statusText}`);
      return { results: [] };
    }

    const data = await res.json();
    return {
      results: (data.results || []).map((r: any) => ({
        title: r.title || "",
        url: r.url || "",
        content: r.content || "",
        score: r.score || 0,
      })),
      answer: data.answer,
    };
  } catch (err) {
    console.warn("[Tavily] 搜索请求失败:", err instanceof Error ? err.message : err);
    return { results: [] };
  }
}
