# Proposal — Fix Perspective Switch Not Updating Content

**问题**: 在案例库详情页切换视角时，文章内容不更新，始终显示全局分析内容。

**根因**: `switchPerspective` 通过 `router.replace` 更新 URL query，依赖 `useEffect` 监听 `searchParams` 变化来触发 `loadArticle`。但 Next.js App Router 中 `router.replace` 同路径不同 query 的导航不会触发 `useSearchParams()` 更新，导致 `activePerspective` 始终为 `"overview"`，`loadArticle` 从未被调用。

**修复**: 在 `switchPerspective` 中直接调用 `loadArticle(slug)`，不依赖 URL 变化链式触发。
