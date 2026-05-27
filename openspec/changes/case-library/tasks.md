## 1. 数据库

- [x] 1.1 创建 `case_articles` 表（id uuid PK, product_name text, perspective text, perspective_label text, content text, summary text, created_at timestamptz, UNIQUE(product_name, perspective)）
- [x] 1.2 添加 RLS 策略（所有认证用户可读，服务端写入）

## 2. API 路由

- [x] 2.1 创建 `src/app/api/cases/route.ts` — 实现 GET 路由，支持 `list-products`、`get-product`、`product+perspective` 三种查询模式
- [x] 2.2 实现文章生成逻辑：查缓存 → miss 则调 AI 生成 → 写入 DB → 返回
- [x] 2.3 实现预置产品列表常量（飞书/Notion/Salesforce/钉钉/企业微信/飞猪/Figma/Canva/Zoom/Slack 等）

## 3. 案例库页面

- [x] 3.1 创建 `src/app/(app)/training/cases/page.tsx` — 案例库主页面，包含视角标签栏 + 产品卡片网格
- [x] 3.2 实现视角标签筛选交互（点击标签筛选产品卡片）
- [x] 3.3 实现产品文章列表视图（点击产品卡片展示文章列表/可选视角）
- [x] 3.4 实现文章阅读视图（点击文章展示全文内容）
- [x] 3.5 实现自定义产品输入功能（输入框 + 选择视角 → 触发生成）
- [x] 3.6 实现加载状态和空状态处理

## 4. 训练首页入口

- [x] 4.1 在训练首页 (`/training`) 添加"案例库"入口卡片，链接到 `/training/cases`

## 5. 验证

- [x] 5.1 `npx tsc --noEmit` 通过
- [x] 5.2 `npx next build` 通过
- [x] 5.3 浏览器验证：案例库浏览、筛选、文章生成、阅读全流程可用