# Comet Design Handoff

- Change: 0529-training-ui-bugs
- Phase: design
- Mode: compact
- Context hash: 6f64cf050e04c29c7871b170ab8812eac6abc179ba78f44b80bb3a9a8fb167f9

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/0529-training-ui-bugs/proposal.md

- Source: openspec/changes/0529-training-ui-bugs/proposal.md
- Lines: 1-27
- SHA256: 416f21ae91bfa195ae2d4fba5a7a2f4867fcf275cc9ef4abb30f13303c6942ff

```md
# Training UI Bug Fixes

## 问题

代码审查发现 4 个 bug：

1. **训练答题页 - 题目前缀清理失败**：`cleanText` 正则 `^(\*\*?)?\s*题目\s*[：:]?\s*(\*\*?)\s*` 匹配 `**题目：**` 时会残留孤立 `*` 字符

2. **案例详情页 - 切换视角重复请求**：`switchPerspective()` 既直接调 `loadArticle()` 又通过 `router.replace` 触发 `useEffect` 再次调用，产生重复 API 请求

3. **案例 API - product_name 大小写未归一化**：INSERT 使用 URL 参数原始值，unique constraint 大小写敏感，不同大小写可产生重复文章

4. **训练页 - 连击计算时间区 bug**：`calcStreak` 和 API 的 streak 计算使用 `toISOString()`（UTC），但 session_date 是本地日期，跨夜时 streak 计算错误。同时训练页 hero 的 `monthCount` 数据源不准。

## 根因

- 正则粗心导致的边缘情况
- 组件内状态和路由更新未协调
- API 层缺乏输入归一化
- 日期运算未考虑时区差异

## 修复目标

- 清理 AI 输出前缀时正确匹配 `**题目：**`
- 切换视角只触发一次加载
- 存储产品名时统一转为 lowercase
- streak 计算使用本地日期而非 UTC
```

## openspec/changes/0529-training-ui-bugs/design.md

- Source: openspec/changes/0529-training-ui-bugs/design.md
- Lines: 1-21
- SHA256: 447cfc3760189e76c5d406b8e31e0a576dce645e31ec247a6106c5d2353919fb

```md
# 修复方案

## Bug 1: 题目前缀清理 regex
- 文件：`src/app/(app)/training/session/page.tsx`
- 修复：简化正则，统一匹配 `**题目：**`、`**题目：`、`题目：` 等变体
- 方案：使用更宽松的 `replace` 链，先清 `**` 再清 `题目：` 前缀

## Bug 2: 切换视角重复请求
- 文件：`src/app/(app)/training/cases/[product]/page.tsx`
- 修复：`switchPerspective` 中只保留 `router.replace`，移除直接调 `loadArticle`，让 `useEffect` 统一处理加载

## Bug 3: product_name 大小写归一化
- 文件：`src/app/api/cases/route.ts`
- 修复：从 URL 参数读取 `productName` 后立即 `toLowerCase()`，保证所有匹配和存储用统一大小写

## Bug 4: 训练页连击/天数数据不准确
- 文件：`src/app/(app)/training/page.tsx` + `/api/training/sessions/route.ts`
- 修复： 
  - 训练页 hero 改用 `stats.streak`（API 端的连续训练天数），而非 `monthCount`（仅 session 记录）
  - 移除 `calcStreak` 死代码
  - API 端 streak 计算修正时区处理
```

## openspec/changes/0529-training-ui-bugs/tasks.md

- Source: openspec/changes/0529-training-ui-bugs/tasks.md
- Lines: 1-6
- SHA256: c8b9e65e6de5f646e085c8317d5cf4fb0e7f8b39c978bfcace2cf7cd6018f5da

```md
# Tasks — Training UI Bug Fixes

- [ ] 1. 修复训练答题页题目前缀清理 regex，正确处理 `**题目：**` 边缘情况
- [ ] 2. 修复案例详情页 `switchPerspective` 重复 API 请求
- [ ] 3. 修复案例 API product_name 大小写归一化
- [ ] 4. 修复训练页连击天数显示（使用 API 端正确 streak 替代 monthCount，修复时区问题）
```

