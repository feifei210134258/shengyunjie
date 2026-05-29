---
change: 0529-training-ui-bugs
design-doc: docs/superpowers/specs/2026-05-29-training-ui-bugs-fix-design.md
base-ref: 248ff8682c6bb2253e8749e791902679c61adcb5
archived-with: 2026-05-29-0529-training-ui-bugs
---

# Implementation Plan — Training UI Bug Fixes

## Tasks

### 1. 修复训练答题页题目前缀清理 regex
- 文件：`src/app/(app)/training/session/page.tsx`
- 改动：在 regex 清理步骤中加 `.replace(/\*\*/g, "")` 先清掉所有 `**`，再清 `题目：` 前缀

### 2. 修复案例详情页 switchPerspective 重复请求
- 文件：`src/app/(app)/training/cases/[product]/page.tsx`
- 改动：`switchPerspective` 中移除直接 `loadArticle(slug)` 调用

### 3. 修复案例 API product_name 大小写归一化
- 文件：`src/app/api/cases/route.ts`
- 改动：`const productName = searchParams.get("product")?.toLowerCase() || ""`

### 4. 修复训练页连击天数显示 + API streak 时区
- 文件：`src/app/(app)/training/page.tsx` + `src/app/api/training/stats/route.ts`
- 改动：训练页 hero 改用 `stats.streak`；移除 `calcStreak` 死代码；API `calcStreak` 用 `toLocaleDateString("zh-CN")` 替代 `toISOString()`

## Build & Test
- `npx tsc --noEmit`
- `npx next build`
