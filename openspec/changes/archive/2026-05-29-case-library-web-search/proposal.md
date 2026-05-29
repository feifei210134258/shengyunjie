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
