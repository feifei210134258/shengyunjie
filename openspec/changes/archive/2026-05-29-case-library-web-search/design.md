# 实现方案

## 技术方案

1. **Tavily 搜索工具函数** (`src/lib/tavily.ts`)
   - 封装 Tavily Search API 调用
   - 支持配置搜索深度（basic/deep）
   - 返回结构化搜索结果（标题、URL、摘要、内容）
   - 失败时优雅降级（返回空结果，不阻塞 AI 生成）

2. **modify `/api/cases/route.ts`** — `generateArticle` 函数
   - 在调用 AI 生成前，先执行 Tavily 搜索
   - 将搜索结果作为 system prompt 的上下文注入
   - 修改 prompt 指示 AI：基于搜索到的真实信息进行分析，不要编造

3. **环境变量**
   - Tavily API key 存入 `.env.local`

## 搜索策略

- 每次生成文章前搜索 1 次
- 搜索 query 构造：`"{product_name} 产品分析 2025 2026"` + 视角相关关键词
- 搜索深度：basic（5 条结果足够）
- 结果注入 prompt 作为参考信息
