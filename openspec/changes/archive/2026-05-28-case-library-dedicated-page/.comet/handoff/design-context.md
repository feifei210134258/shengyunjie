# Comet Design Handoff

- Change: case-library-dedicated-page
- Phase: design
- Mode: compact
- Context hash: e271e6e862586b650da30b6831e73d1cb21ccb7d7a639f6ff0e1f103e0185a10

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/case-library-dedicated-page/proposal.md

- Source: openspec/changes/case-library-dedicated-page/proposal.md
- Lines: 1-26
- SHA256: d97da03c5f4389b9543aa9d4797b07f1900bfef09bf3bc12d312c67daf924e12

```md
# Case Library — Dedicated Product Page

## 问题

当前案例库使用右侧抽屉（Drawer）展示产品分析和 AI 生成文章。这个交互存在两个问题：

1. **空间受限**：抽屉宽度仅 `max-w-lg`（~512px），1000字的全局分析文章阅读体验差
2. **层级混乱**：抽屉内有"视角列表→文章阅读"两层嵌套，叠加在产品网格之上，用户容易迷失

## 目标

将产品分析从抽屉改为独立页面 `/training/cases/[product]`，提供更好的阅读和导航体验。

## 范围

- 点击产品卡片跳转到 `/training/cases/[product]?perspective=overview`
- 页面内顶部提供视角切换 tabs（横向滚动），复用现有样式
- 默认显示"全局分析"，点击 tab 切换到其他视角
- 保留现有的 Markdown 渲染、加载态、错误态、缓存机制
- 简化 `/training/cases` 页面，移除抽屉相关代码

## 非目标

- 不改变 API 接口（`/api/cases` 保持不变）
- 不改变后端生成逻辑
- 不改变产品列表页的视角过滤功能
- 不新增数据库表或 schema```

## openspec/changes/case-library-dedicated-page/design.md

- Source: openspec/changes/case-library-dedicated-page/design.md
- Lines: 1-66
- SHA256: 93ce2ed78685522a23b060d1d278113f35627b5ed33686cdea455b6803736eaa

```md
# Design — Case Library Dedicated Page

## 架构

```
src/app/(app)/training/cases/
├── page.tsx                    # 产品列表（移除 drawer）
└── [product]/
    └── page.tsx                # 产品分析页（新增）
```

## 路由设计

- **列表页**：`/training/cases` — 产品 grid + 视角过滤（保持不变，仅移除 drawer 逻辑）
- **分析页**：`/training/cases/[product]` — 独立产品分析页
  - Query param `?perspective=overview`（默认）控制当前视角
  - 使用 `useSearchParams` + `useRouter` 切换视角（切换时替换 URL）

## 数据流

```
/training/cases/[product]?perspective=overview
  │
  ├── on mount: GET /api/cases?action=get-product&product=X
  │   → 获取该产品的所有视角状态（哪些有缓存、摘要）
  │
  ├── on mount + on perspective change:
  │   GET /api/cases?product=X&perspective=Y
  │   → 获取/生成该视角的文章
  │
  └── render: ReactMarkdown with .markdown-content styles
```

与 drawer 模式完全相同的 API 调用，无需后端改动。

## UI 布局

```
┌─────────────────────────────────────────────────────────┐
│  ← 返回案例库          Notion                           │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │ [全局分析] [产品定位] [增长飞轮] [商业模式] ...   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │                                                  │   │
│  │  ## Notion 产品拆解                              │   │
│  │                                                  │   │
│  │  Notion 定位为...                                │   │
│  │                                                  │   │
│  │  ### 一、产品定位                                │   │
│  │  ...                                             │   │
│  │                                                  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  生成时间: 2026/5/27                                    │
└─────────────────────────────────────────────────────────┘
```

## 关键技术决策

1. **页面组件**：Client Component（需要 `useSearchParams`、`useState`、`useEffect`）
2. **视角切换**：修改 `searchParams`（`router.replace`），触发 `useEffect` 重新加载文章
3. **产品名编码**：URL 中使用 `encodeURIComponent`，页面中用 `decodeURIComponent` 还原
4. **返回按钮**：使用 `router.back()` 或 `<Link href="/training/cases">`
5. **复用**：复用 `globals.css` 中的 `.markdown-content` 样式、`react-markdown` 组件```

## openspec/changes/case-library-dedicated-page/tasks.md

- Source: openspec/changes/case-library-dedicated-page/tasks.md
- Lines: 1-28
- SHA256: 4faa77c8ef998dbd5b814e7d218f7b0b784c05b8c16d640e3bb5153fd98993ee

```md
# Tasks — Case Library Dedicated Page

- [ ] 1. 创建 `/training/cases/[product]/page.tsx` 独立产品分析页
  - 路由参数：`params.product`（产品名）
  - Query 参数：`?perspective=overview`（默认全局分析）
  - 页面布局：返回按钮 + 产品标题 + 视角切换 tabs + 文章内容区
  - 状态管理：loading/error/article 三个状态
  - 视角切换：点击 tab → `router.replace` 更新 query → 重新加载文章
  - 复用 API：`/api/cases?action=get-product` + `/api/cases?product=X&perspective=Y`

- [ ] 2. 精简 `/training/cases/page.tsx`，移除抽屉
  - 删除 drawer 相关 state（`drawerOpen`, `drawerProduct`, `productPerspectives`, `articleView`, `articleData`, `articleLoading`, `articleError`）
  - 删除 drawer handler 函数（`openProductDrawer`, `closeDrawer`, `loadArticle`, `backToProductList`）
  - 删除 drawer UI 代码（backdrop + drawer panel）
  - 删除 `customProduct` 相关的 drawer 交互（`handleCustomSubmit` 改为直接跳转）
  - 点击产品卡片改为 `router.push(/training/cases/${encodeURIComponent(product.name)})`
  - 保留：header、perspective filter tabs、product grid、loading skeleton、empty state
  - 移除 `ReactMarkdown` import（不再需要）
  - 移除 `ArticleData` 类型（移到新页面）

- [ ] 3. 构建验证 + E2E 测试
  - 运行 `npx tsc --noEmit` 类型检查
  - 运行 `npx next build` 构建
  - Kimi WebBridge 端到端测试：
    - 点击产品卡片 → 确认跳转到独立页面
    - 默认显示"全局分析"，确认文章加载
    - 切换视角 tab → 确认文章更新
    - 点击返回 → 回到产品列表
    - 验证 Markdown 渲染正常```

