---
change: case-library
design-doc: docs/superpowers/specs/2026-05-27-case-library-design.md
base-ref: 3adcce7362b3bedc85638772873f8b84d2073681
archived-with: 2026-05-27-case-library
---

# 案例库 — 实施计划

## 概述

创建 `/training/cases` 案例库页面 + `/api/cases` API，实现 B 端产品拆解文章的 AI 生成、缓存和浏览。

## 任务 1: 数据库

- [ ] 1.1 创建 `case_articles` 表（product_name + perspective UNIQUE, RLS 策略）

## 任务 2: API 路由

**文件**: `src/app/api/cases/route.ts` (新)

实现内容：
- 预置产品列表常量（飞书/Notion/Salesforce/钉钉/企业微信/Figma/Canva/Zoom/Slack）
- 三种查询模式：list-products、get-product、product+perspective
- 文章生成：查缓存 → miss 则调 AI → 写入 DB → 返回
- AI prompt 约束 ~500 字，无思考模式

## 任务 3: 案例库页面

**文件**: `src/app/(app)/training/cases/page.tsx` (新)

实现内容：
- 视角标签栏 — 8 个固定视角 + "全部"，横向滚动
- 产品卡片网格 — 响应式 2-3 列，展示产品名+描述+文章数
- 产品文章列表 — 点击产品展示该产品的视角→文章映射
- 文章阅读侧边抽屉 — 点击文章展示全文
- 自定义产品输入 — 输入框 + 视角选择 → 触发生成
- 加载/空状态处理

## 任务 4: 训练首页入口

**文件**: `src/app/(app)/training/page.tsx` (改)

在训练首页添加"案例库"入口卡片

## 验证

1. `npx tsc --noEmit` 通过
2. `npx next build` 通过
3. 浏览器验证：案例库浏览、筛选、文章生成、阅读全流程
