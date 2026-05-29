# Comet Design Handoff

- Change: case-library-web-search
- Phase: design
- Mode: compact
- Context hash: f7f0381d461b9ef7ce7444f4fb4eb67b621151332d67562d0b1323ab12f0ba3f

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/case-library-web-search/proposal.md

- Source: openspec/changes/case-library-web-search/proposal.md
- Lines: 1-21
- SHA256: 57d69fd98ae36bd96b481762f3ce0410b150aaa8984d255a06ca17ae072b892e

```md
# Case Library — Web Search Integration

## 问题

案例库的产品分析由 AI 模型基于知识库生成。模型的知识库有截止日期（2025年初），对于较新的产品或产品近期的变化（功能更新、定价调整、市场动态等），模型无法获取真实信息，导致生成的分析内容过时、不准确或编造数据。

## 目标

为案例库的 AI 分析环节接入 Tavily Web Search API，让模型在生成产品分析前先搜索获取真实、最新的信息，然后基于搜索结果进行分析，确保分析内容的准确性和时效性。

## 范围

- 在 `src/lib/` 下新增 Tavily 搜索工具函数
- 修改 `/api/cases/route.ts` 的 `generateArticle` 函数，在调用 AI 前先搜索
- 将 Tavily API key 存入环境变量 `.env.local`
- 搜索内容作为 AI 上下文注入 prompt

## 非目标

- 不修改其他页面或 API 路由
- 不添加用户配置界面（Tavily key 硬编码到环境变量）
```

## openspec/changes/case-library-web-search/design.md

- Source: openspec/changes/case-library-web-search/design.md
- Lines: 1-24
- SHA256: 4e1993c7991289096483a05f1d83505b7a8b6375a33220be4c23905b09460fa1

```md
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
```

## openspec/changes/case-library-web-search/tasks.md

- Source: openspec/changes/case-library-web-search/tasks.md
- Lines: 1-6
- SHA256: 15c6630802064a5dbee209371ecf5a47970320482de2f5e44be885d9fdca9d5d

```md
# Tasks — Case Library Web Search

- [ ] 1. 创建 `src/lib/tavily.ts` 搜索工具函数
- [ ] 2. 修改 `src/app/api/cases/route.ts` 的 `generateArticle` 集成搜索
- [ ] 3. 将 Tavily API key 写入 `.env.local`
- [ ] 4. 构建验证（tsc + next build）
```

