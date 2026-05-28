# Tasks — Case Library Dedicated Page

- [x] 1. 创建 `/training/cases/[product]/page.tsx` 独立产品分析页
  - 路由参数：`params.product`（产品名）
  - Query 参数：`?perspective=overview`（默认全局分析）
  - 页面布局：返回按钮 + 产品标题 + 视角切换 tabs + 文章内容区
  - 状态管理：loading/error/article 三个状态
  - 视角切换：点击 tab → `router.replace` 更新 query → 重新加载文章
  - 复用 API：`/api/cases?action=get-product` + `/api/cases?product=X&perspective=Y`

- [x] 2. 精简 `/training/cases/page.tsx`，移除抽屉
  - 删除 drawer 相关 state（`drawerOpen`, `drawerProduct`, `productPerspectives`, `articleView`, `articleData`, `articleLoading`, `articleError`）
  - 删除 drawer handler 函数（`openProductDrawer`, `closeDrawer`, `loadArticle`, `backToProductList`）
  - 删除 drawer UI 代码（backdrop + drawer panel）
  - 删除 `customProduct` 相关的 drawer 交互（`handleCustomSubmit` 改为直接跳转）
  - 点击产品卡片改为 `router.push(/training/cases/${encodeURIComponent(product.name)})`
  - 保留：header、perspective filter tabs、product grid、loading skeleton、empty state
  - 移除 `ReactMarkdown` import（不再需要）
  - 移除 `ArticleData` 类型（移到新页面）

- [x] 3. 构建验证 + E2E 测试
  - 运行 `npx tsc --noEmit` 类型检查
  - 运行 `npx next build` 构建
  - Kimi WebBridge 端到端测试：
    - 点击产品卡片 → 确认跳转到独立页面
    - 默认显示"全局分析"，确认文章加载
    - 切换视角 tab → 确认文章更新
    - 点击返回 → 回到产品列表
    - 验证 Markdown 渲染正常