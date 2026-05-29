---
comet_change: 0529-training-ui-bugs
role: technical-design
canonical_spec: openspec
archived-with: 2026-05-29-0529-training-ui-bugs
status: final
---

# Design Doc — Training UI Bug Fixes

## Bug 1: 题目前缀清理 regex

**根因**：`split(/(\*\*.*?\*\*)/g)` 提取的 `**题目：**` 前缀用 `replace(/^(\*\*?)?\s*题目\s*[：:]?\s*(\*\*?)\s*/i, "")` 清理时，第二个 `(\*\*?)` 只匹配了 `**` 中的第一个 `*`，留下孤立 `*`。

**修复**：先用 `replace(/\*\*/g, "")` 去掉所有 `**`，再用 `replace(/^\s*题目\s*[：:]\s*/i, "")` 清前缀，分两步避免 regex 边缘情况。

## Bug 2: 切换视角重复请求

**根因**：`switchPerspective()` 既直接调 `loadArticle(slug)` 又通过 `router.replace` → `useEffect` 再次触发。

**修复**：只保留 `router.replace(to)`，移除直接 `loadArticle` 调用。`useEffect` 依赖 `searchParams` 变化自然会触发加载。

## Bug 3: product_name 大小写归一化

**根因**：URL 参数 `?product=Feishu` 直接传入 INSERT，但 unique constraint `(product_name, perspective)` 大小写敏感，不同大小写视为不同产品。

**修复**：在 `GET()` 入口处统一 `productName = productName.toLowerCase()`，确保 cache 查找、INSERT 都统一小写。

## Bug 4: 连击天数显示错误（一直显示12天）

**根因**：
- 训练页 hero 用 `monthCount`（月内 session 记录天数），而非实际连击天数
- 前端 `calcStreak()` 函数是死代码，始终返回 `monthCount`
- API 端 `calcStreak()` 用 `new Date().toISOString().slice(0,10)` 获取 UTC 日期，凌晨训练时 UTC 日期比本地小一天，streak 计算错误

**修复**：
- 训练页 hero 改用 `stats.streak`（API 端计算的连击天数）
- 移除前端死代码 `calcStreak()`
- API 端 streak 用 `new Date().toLocaleDateString("zh-CN")` 获取本地日期而非 UTC `toISOString()`

## 测试策略

- `npx tsc --noEmit` 类型检查
- `npx next build` 构建验证
- 无新增测试用例（纯 bug fix，无新能力）
