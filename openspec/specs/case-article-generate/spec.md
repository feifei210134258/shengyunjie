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
- **THEN** 所有认证用户可读取，仅服务端可写入（通过 API 路由）