---
comet_change: case-library-web-search
role: technical-design
canonical_spec: openspec
archived-with: 2026-05-29-case-library-web-search
status: final
---

# Design Doc — Case Library Web Search Integration

## 概述

在案例库 AI 生成产品分析前，通过 Tavily Search API 获取真实信息作为上下文，确保分析内容的准确性和时效性。

## 方案详情

### 1. Tavily 搜索工具 (`src/lib/tavily.ts`)

封装 Tavily Search API：

```typescript
interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface SearchResponse {
  results: SearchResult[];
  answer?: string;
}
```

- API: `https://api.tavily.com/search`
- 参数: `api_key`, `query`, `search_depth="basic"`, `max_results=5`, `include_answer=true`
- 失败时返回空数组，不阻塞主流程
- 环境变量: `TAVILY_API_KEY`

### 2. Prompt 改造 (`/api/cases/route.ts`)

修改 `generateArticle` 函数：

1. 在调用 `generateText` 前，先调用 Tavily 搜索
2. 搜索结果格式化为 markdown 引用块作为 AI 上下文
3. 修改 system prompt，指示 AI 基于真实信息分析

```
修改后的 system prompt 新增：
"以下搜索结果为该产品的真实信息，请基于这些信息进行分析，不要编造：
${searchContext}"
```

### 3. 环境变量配置

`TAVILY_API_KEY` 写入 `.env.local`

## 数据流

```
用户请求 → generateArticle(product, perspective)
  → Tavily.search(`{product} {perspective_label}`)
  → 搜索结果格式化 → 注入 AI system prompt
  → generateText(model, system + messages)
  → 返回 AI 生成内容
```

## 错误处理

- Tavily API 调用失败 → 返回空结果 → AI 继续原来的生成逻辑（无搜索退化为纯知识库）
- 搜索返回空结果 → AI 基于知识库生成（标注"部分信息可能不是最新"）

## 测试策略

- `npm run build` / `npx tsc --noEmit`
- 手动测试：生成新产品案例，确认搜索结果出现在 AI 响应中

## 风险

- Tavily API 可能有调用频率限制（免费层 1000 次/月）
- 搜索增加请求延迟（~1-2s）
