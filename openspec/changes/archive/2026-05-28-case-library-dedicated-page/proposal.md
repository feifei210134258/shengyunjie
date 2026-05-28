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
- 不新增数据库表或 schema