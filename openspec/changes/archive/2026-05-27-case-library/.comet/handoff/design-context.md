# Comet Design Handoff

- Change: case-library
- Phase: design
- Mode: compact
- Context hash: 34c79f149160f78210d7f156a801e27edddd1335368f0dad19cd8813a92ce578

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/case-library/proposal.md

- Source: openspec/changes/case-library/proposal.md
- Lines: 1-28
- SHA256: 7cb888ec4576771c816cc9ea06cbdd795bd818573179a738431004194015bed8

```md
## Why

当前训练模块仅有"短题快答"模式（300字场景 → 作答 → AI评分），缺乏深度阅读学习场景。B 端产品经理的成长不仅需要"练"，还需要"学"——通过拆解经典产品理解产品思维框架（定位、增长、定价、竞争等）。案例库填补这一空白，提供 AI 生成的产品拆解文章，让用户通过阅读内化高阶产品思维。

## What Changes

- 新增 `/training/cases` 案例库页面，包含产品卡片网格 + 分析视角标签筛选
- 新增 `/api/cases` API 路由，按产品 + 视角生成/返回拆解文章
- 新增 `case_articles` 数据库表，缓存已生成的拆解文章避免重复生成
- 训练首页新增"案例库"入口卡片
- 预置经典 B 端产品列表（飞书、Notion、Salesforce、钉钉等）+ 支持自定义产品输入
- 分析视角基于产品思维框架（定位/增长/定价/竞争/架构/留存/生态），不与训练 5 维度绑定

## Capabilities

### New Capabilities
- `case-library-browse`: 案例库浏览 — 产品卡片墙、分析视角标签筛选、混合入口（产品中心+视角中心）
- `case-article-generate`: 案例文章生成 — AI 按产品+视角生成简洁拆解，缓存复用，支持预置产品和自定义输入

### Modified Capabilities
<!-- No existing capability requirements are changing -->

## Impact

- 新增页面: `src/app/(app)/training/cases/`
- 新增 API: `src/app/api/cases/route.ts`
- 数据库: 新增 `case_articles` 表（product_name, perspective, content, created_at）
- 修改: `src/app/(app)/training/page.tsx`（添加案例库入口卡片）
- 修改: `feature_list.json`（training-002 状态更新）```

## openspec/changes/case-library/design.md

- Source: openspec/changes/case-library/design.md
- Lines: 1-92
- SHA256: d3471fbe26bb48c129f3e5f41284022645ea8d2d403bfeaff67ea4f3c8882b07

[TRUNCATED]

```md
## Context

当前训练模块 (training-001) 提供了短场景快答训练，但缺少深度学习阅读场景。案例库新增 AI 生成的 B 端产品拆解文章，以阅读学习为主，帮助用户通过经典产品案例内化高阶产品思维。

技术栈: Next.js App Router + Supabase + DeepSeek V4 Flash (AI SDK streaming)。案例库作为 `/training/cases` 子页，复用现有侧边栏导航和 AuthProvider。

## Goals / Non-Goals

**Goals:**
- 案例库浏览页：产品卡片网格 + 分析视角标签筛选，混合入口
- AI 生成产品拆解文章：按产品+视角组合生成，简洁不冗长
- 缓存复用：同产品+同视角的文章只生成一次，后续请求直接返回缓存
- 预置产品列表 + 自定义产品输入
- 训练首页添加案例库入口卡片

**Non-Goals:**
- 不做互动推演型案例（决策 → 揭示结果）
- 不做用户收藏、点赞、评论等社交功能
- 不做全文搜索（仅标签筛选）
- 不与训练 5 维度绑定

## Decisions

| 决策 | 选择 | 原因 |
|------|------|------|
| 缓存策略 | 数据库缓存（`case_articles` 表） | 同产品+同视角文章内容稳定，无需每次调用 AI。用户请求时先查 DB，命中则直接返回，miss 则 AI 生成后写入 |
| 生成时机 | 按需生成（lazy） | 预生成所有组合太重，用户点开才生成，首次等待后缓存 |
| 文章长度 | ~500 字 | 用户明确要求简洁不冗长，AI prompt 约束输出长度 |
| 分析视角 | 产品思维框架（7-8 个固定视角） | 不与训练维度耦合，独立的产品分析视角体系 |
| 自定义产品 | 输入产品名 → 先查缓存 → miss 则 AI 生成 | 开放但不浪费 API 调用 |
| 页面布局 | 单页应用，标签筛选 + 卡片网格 + 文章抽屉 | 避免页面跳转，保持浏览流畅 |
| 数据表 | `case_articles` 单表（product_name + perspective → content），联合 unique key | 简单直接，查询模式单一 |

## 分析视角（产品思维框架）

| 视角 | slug | 示例问题 |
|------|------|---------|
| 产品定位与差异化 | positioning | 这个产品如何找到自己的市场位置？ |
| 增长飞轮 | growth | 用户增长的飞轮是如何转起来的？ |
| 商业模式 | business-model | 如何赚钱？定价是怎么设计的？ |
| 定价策略 | pricing | 定价背后的逻辑是什么？ |
| 功能架构演进 | architecture | 产品功能是如何一步步长出来的？ |
| 竞争博弈 | competition | 面对竞品是怎么打的？ |
| 用户留存与激活 | retention | 用户为什么要留下来？ |
| 生态平台策略 | ecosystem | 如何从工具走向平台？ |

## 页面结构

```
/training/cases
┌──────────────────────────────────────────────┐
│  页面标题: 案例库                              │
│  副标题: 拆解经典 B 端产品，理解产品思维框架      │
├──────────────────────────────────────────────┤
│  视角标签栏 (横向滚动)                         │
│  [全部] [定位] [增长] [商业模式] [定价] ...    │
├──────────────────────────────────────────────┤
│  产品卡片网格 (响应式 2-3 列)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │  飞书图标  │ │ Notion   │ │Salesforce│     │
│  │  Feishu   │ │  协作平台  │ │  CRM     │     │
│  │  4 篇拆解  │ │  3 篇拆解  │ │  2 篇拆解 │     │
│  └──────────┘ └──────────┘ └──────────┘     │
│  ...                                         │
│  ┌──────────────────────────────────────┐    │
│  │  [+ 自定义产品]                        │    │
│  └──────────────────────────────────────┘    │
├──────────────────────────────────────────────┤
│  文章抽屉 (Drawer/Sheet)                      │
│  点击产品卡片 → 展示该产品下关联视角的文章列表   │
│  点击具体文章 → 全屏阅读                        │
└──────────────────────────────────────────────┘
```

## API 设计

### `GET /api/cases?product=<name>&perspective=<slug>`

返回指定产品+视角的拆解文章（含缓存逻辑）

```

Full source: openspec/changes/case-library/design.md

## openspec/changes/case-library/tasks.md

- Source: openspec/changes/case-library/tasks.md
- Lines: 1-28
- SHA256: d53368bd080045ed1d78366c180b22ec56acbcb37c2d86f483c3e8ca1954fc23

```md
## 1. 数据库

- [ ] 1.1 创建 `case_articles` 表（id uuid PK, product_name text, perspective text, perspective_label text, content text, summary text, created_at timestamptz, UNIQUE(product_name, perspective)）
- [ ] 1.2 添加 RLS 策略（所有认证用户可读，服务端写入）

## 2. API 路由

- [ ] 2.1 创建 `src/app/api/cases/route.ts` — 实现 GET 路由，支持 `list-products`、`get-product`、`product+perspective` 三种查询模式
- [ ] 2.2 实现文章生成逻辑：查缓存 → miss 则调 AI 生成 → 写入 DB → 返回
- [ ] 2.3 实现预置产品列表常量（飞书/Notion/Salesforce/钉钉/企业微信/飞猪/Figma/Canva/Zoom/Slack 等）

## 3. 案例库页面

- [ ] 3.1 创建 `src/app/(app)/training/cases/page.tsx` — 案例库主页面，包含视角标签栏 + 产品卡片网格
- [ ] 3.2 实现视角标签筛选交互（点击标签筛选产品卡片）
- [ ] 3.3 实现产品文章列表视图（点击产品卡片展示文章列表/可选视角）
- [ ] 3.4 实现文章阅读视图（点击文章展示全文内容）
- [ ] 3.5 实现自定义产品输入功能（输入框 + 选择视角 → 触发生成）
- [ ] 3.6 实现加载状态和空状态处理

## 4. 训练首页入口

- [ ] 4.1 在训练首页 (`/training`) 添加"案例库"入口卡片，链接到 `/training/cases`

## 5. 验证

- [ ] 5.1 `npx tsc --noEmit` 通过
- [ ] 5.2 `npx next build` 通过
- [ ] 5.3 浏览器验证：案例库浏览、筛选、文章生成、阅读全流程可用```

## openspec/changes/case-library/specs/case-article-generate/spec.md

- Source: openspec/changes/case-library/specs/case-article-generate/spec.md
- Lines: 1-60
- SHA256: 23f5a480b642d52518b4687a81b10da57f6aec4bd8a8e643866e9b4790349040

```md
## ADDED Requirements

### Requirement: AI 生成产品拆解文章
系统 SHALL 调用 AI 按指定产品和分析视角生成简洁的产品拆解文章。

#### Scenario: 请求生成文章
- **WHEN** 用户选择产品"飞书"和分析视角"增长飞轮"并请求生成
- **THEN** 系统调用 AI 生成一篇约 500 字的拆解文章，内容聚焦于该产品的增长策略分析

#### Scenario: 文章长度控制
- **WHEN** AI 生成产品拆解文章
- **THEN** 输出内容 SHALL 控制在 500 字以内，简洁精炼

#### Scenario: AI 对不了解的产品诚实回应
- **WHEN** 用户请求分析 AI 不了解的产品
- **THEN** AI SHALL 回应"对此产品了解有限，以下仅基于公开信息做简要分析"，不编造内容

### Requirement: 文章内容缓存
系统 SHALL 将 AI 生成的文章持久化到数据库，后续相同请求直接返回缓存。

#### Scenario: 首次生成并缓存
- **WHEN** AI 首次生成某产品+视角的文章
- **THEN** 文章内容写入 `case_articles` 表，后续请求直接返回该内容

#### Scenario: 缓存命中
- **WHEN** 用户请求已有缓存的文章
- **THEN** 系统直接返回缓存内容，不调用 AI

#### Scenario: 生成中展示加载状态
- **WHEN** 文章正在生成（~5-10秒）
- **THEN** 前端展示骨架屏加载动画，提示"AI 正在分析..."

### Requirement: API 端点
系统 SHALL 提供 RESTful API 支持案例库的所有操作。

#### Scenario: 获取产品列表
- **WHEN** 前端请求 `GET /api/cases?action=list-products`
- **THEN** 返回预置产品列表及各产品已生成的文章数量

#### Scenario: 获取产品文章
- **WHEN** 前端请求 `GET /api/cases?action=get-product&product=feishu`
- **THEN** 返回该产品下所有已生成文章的视角和摘要

#### Scenario: 获取或生成文章
- **WHEN** 前端请求 `GET /api/cases?product=feishu&perspective=growth`
- **THEN** 系统检查缓存，命中则直接返回；未命中则 AI 生成后返回并写入缓存

#### Scenario: 未登录用户请求
- **WHEN** 未登录用户请求任何 API
- **THEN** 返回 401 未登录错误

### Requirement: 数据库表设计
系统 SHALL 在 Supabase 中创建 `case_articles` 表存储文章缓存。

#### Scenario: 表结构
- **WHEN** 执行 schema 变更
- **THEN** `case_articles` 表包含字段：`id` (uuid PK)、`product_name` (text)、`perspective` (text)、`perspective_label` (text)、`content` (text)、`summary` (text)、`created_at` (timestamptz)，UNIQUE(product_name, perspective)

#### Scenario: RLS 策略
- **WHEN** 用户访问文章数据
- **THEN** 所有认证用户可读取，仅服务端可写入（通过 API 路由）```

## openspec/changes/case-library/specs/case-library-browse/spec.md

- Source: openspec/changes/case-library/specs/case-library-browse/spec.md
- Lines: 1-66
- SHA256: 7bc5b677d9006b7409e57f6eab4ded40f10519fdd4900b07559c72d2be7e16af

```md
## ADDED Requirements

### Requirement: 案例库产品浏览
系统 SHALL 在 `/training/cases` 页面以产品卡片网格形式展示可浏览的案例产品列表。

#### Scenario: 用户访问案例库首页
- **WHEN** 用户导航到 `/training/cases`
- **THEN** 页面展示产品卡片网格，每个卡片包含产品名称、简短描述和已生成文章数量

#### Scenario: 预置产品列表加载
- **WHEN** 案例库页面加载
- **THEN** 系统从 API 获取预置产品列表，包含飞书、Notion、Salesforce、钉钉等经典 B 端产品

### Requirement: 分析视角标签筛选
系统 SHALL 支持用户通过分析视角标签筛选产品卡片。

#### Scenario: 用户选择特定视角标签
- **WHEN** 用户点击"增长"视角标签
- **THEN** 产品卡片网格筛选为仅展示该视角下已有文章的产品

#### Scenario: 用户选择"全部"标签
- **WHEN** 用户点击"全部"标签
- **THEN** 展示所有产品卡片，不进行视角筛选

#### Scenario: 无匹配结果
- **WHEN** 当前筛选条件下无产品
- **THEN** 页面显示"该视角下暂无案例，尝试自定义生成"引导文案

### Requirement: 产品文章列表展示
系统 SHALL 允许用户查看某个产品下所有已生成的拆解文章列表。

#### Scenario: 用户点击产品卡片
- **WHEN** 用户点击产品卡片
- **THEN** 系统展示该产品下按分析视角分组的文章列表，每个文章项显示视角名称

#### Scenario: 产品无已生成文章
- **WHEN** 用户点击尚无文章的产品
- **THEN** 系统展示可选视角列表，提示"选择分析视角，AI 将为你生成拆解"

### Requirement: 文章阅读界面
系统 SHALL 提供沉浸式文章阅读体验。

#### Scenario: 用户打开文章
- **WHEN** 用户点击某篇文章
- **THEN** 系统展示文章全文，包含产品名称、分析视角、正文内容

#### Scenario: 文章阅读完成后返回
- **WHEN** 用户阅读完成
- **THEN** 可通过返回按钮回到案例库首页

### Requirement: 自定义产品输入
系统 SHALL 允许用户输入不在预置列表中的产品名称来生成案例。

#### Scenario: 用户输入自定义产品名
- **WHEN** 用户在自定义输入框中输入产品名称
- **THEN** 系统引导用户选择分析视角，随后 AI 生成该产品的拆解文章

#### Scenario: 自定义产品已存在文章
- **WHEN** 用户输入的产品名与已有产品匹配（大小写不敏感）
- **THEN** 系统直接展示已有产品及其文章列表

### Requirement: 训练首页案例库入口
系统 SHALL 在训练首页 (`/training`) 添加案例库入口卡片。

#### Scenario: 用户从训练首页进入案例库
- **WHEN** 用户在训练首页点击"案例库"入口卡片
- **THEN** 页面跳转到 `/training/cases````

