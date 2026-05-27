---
comet_change: case-library
role: technical-design
canonical_spec: openspec
archived-with: 2026-05-27-case-library
status: final
---

# 案例库 — 技术设计

## 架构概览

```
用户选产品+视角 → GET /api/cases?product=X&perspective=Y
                       │
                  ┌────▼────┐
                  │ 查缓存   │
                  │ case_articles
                  └────┬────┘
                  hit  │  miss
                   │   │
                   │   ▼
                   │  AI 生成 (DeepSeek V4 Flash, 无思考模式, ~500字)
                   │   │
                   │   ▼
                   │  写入 case_articles
                   │   │
                   └───┼───┘
                       ▼
                  返回文章 JSON
```

## 关键设计决策

| 决策 | 选择 | 原因 |
|------|------|------|
| 缓存策略 | DB 缓存 (`case_articles` 表) | 同产品+同视角内容稳定，lazy 生成后持久化，避免重复 AI 调用 |
| 页面布局 | 单页应用：标签筛选 + 卡片网格 + 侧边抽屉 | 避免路由跳转，浏览流畅；抽屉更轻盈 |
| 文章长度 | ~500 字 | 用户要求简洁不冗长 |
| AI 模式 | 无思考模式 (reasoning 关闭) | 文章生成不需要深度推理，节省 token 和延迟 |
| 分析视角 | 8 个产品思维框架固定视角 | 不与训练 5 维度耦合 |
| 自定义产品 | 输入 → 选视角 → 生成+缓存 | 开放但不浪费 API 调用 |
| 组件拆分 | 4 个子组件内联 page.tsx | 规模小 (~400行)，无需独立文件夹 |

## 数据模型

```sql
CREATE TABLE case_articles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name    text NOT NULL,
  perspective     text NOT NULL,
  perspective_label text NOT NULL,
  content         text NOT NULL,
  summary         text,
  created_at      timestamptz DEFAULT now(),
  UNIQUE(product_name, perspective)
);
```

## 分析视角

| 视角 | slug | label |
|------|------|-------|
| 产品定位与差异化 | positioning | 产品定位 |
| 增长飞轮 | growth | 增长飞轮 |
| 商业模式 | business-model | 商业模式 |
| 定价策略 | pricing | 定价策略 |
| 功能架构演进 | architecture | 功能架构 |
| 竞争博弈 | competition | 竞争博弈 |
| 用户留存与激活 | retention | 留存激活 |
| 生态平台策略 | ecosystem | 生态平台 |

## API 设计

### `GET /api/cases`

三种查询模式：

| 参数 | 返回 |
|------|------|
| `?action=list-products` | 预置产品列表 + 各产品已生成文章数 |
| `?action=get-product&product=<name>` | 该产品的视角→文章映射 |
| `?product=<name>&perspective=<slug>` | 查缓存/生成并返回文章全文 |

## 前端页面布局

```
/training/cases
┌──────────────────────────────────────────────┐
│  页面标题: 案例库                              │
├──────────────────────────────────────────────┤
│  视角标签栏 (横向滚动)                         │
│  [全部] [定位] [增长] [商业模式] [定价] ...    │
├──────────────────────────────────────────────┤
│  产品卡片网格 (响应式 2-3 列)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │  飞书     │ │ Notion   │ │Salesforce│     │
│  └──────────┘ └──────────┘ └──────────┘     │
│  [+ 自定义产品]                                │
│                                              │
│  点击产品 → 右侧抽屉滑出文章列表               │
│  点击文章 → 抽屉内展示全文                    │
└──────────────────────────────────────────────┘
```

## 组件结构

- `src/app/(app)/training/cases/page.tsx` — 主页面 "use client"，状态管理
- 内联子组件（均在同一文件或 `src/components/cases/` 按需拆分）：
  - `PerspectiveTabs` — 视角标签栏
  - `ProductCardGrid` — 产品卡片网格
  - `ArticleDrawer` — 侧边抽屉（Sheet）
  - `CustomProductInput` — 自定义产品输入

## 空状态处理

- 视角筛选无匹配 → "该视角下暂无案例，尝试自定义生成"
- 产品无文章 → 展示可选视角列表，引导首次生成
- 文章生成中 → 骨架屏 + "AI 正在分析..."

## 测试策略

- API: 验证缓存命中/未命中、未登录 401、自定义产品生成
- 前端: 验证视角筛选、产品卡片渲染、抽屉打开/关闭、自定义输入流程
- 构建: `npx tsc --noEmit` + `npx next build`
