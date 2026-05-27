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
- 修改: `feature_list.json`（training-002 状态更新）