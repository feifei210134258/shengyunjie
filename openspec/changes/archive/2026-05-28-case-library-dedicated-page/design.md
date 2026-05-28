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
5. **复用**：复用 `globals.css` 中的 `.markdown-content` 样式、`react-markdown` 组件