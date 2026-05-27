# Comet Design Handoff

- Change: training-enhancement
- Phase: design
- Mode: compact
- Context hash: ee77b68197119a5f3cf66991793f9edfd008ee06f8db08ab0f2547d1797727f1

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/training-enhancement/proposal.md

- Source: openspec/changes/training-enhancement/proposal.md
- Lines: 1-33
- SHA256: 5d0114df1ac2d2b182deb97b90499faa09ecfcdb43af2a1a350f832225b16646

```md
## Why

训练模块已完成单题模式重构，但核心体验仍有明显缺口：streak 是 mock 数据、训练 session 未闭环、历史答题无法回顾、AI 分析无量化评分、题目可能重复。这些缺口直接影响用户的持续使用动力和学习效果追踪。

## What Changes

- **修复 streak 计算算法**：跨月连续天数计算，基于 `training_sessions` 表真实数据
- **训练 session 闭环**：完成一轮（5题）后自动创建/更新当日 `training_sessions` 记录
- **历史答题详情页**：点击首页历史记录进入详情，展示题目、答案、AI 诊断与建议
- **AI 评分体系**：分析 prompt 增加 1-10 分评分维度，按维度追踪历史平均分
- **能力雷达图**：训练首页增加各维度能力雷达图或趋势折线图
- **题目去重机制**：基于向量相似度或文本匹配避免重复题目
- **题目难度分级**：生成时标注难度（初级/中级/高级）
- **题目质量反馈**：用户可对题目点赞/踩，反馈写入数据库用于优化

## Capabilities

### New Capabilities
- `training-streak-session`: 训练 streak 计算与每日 session 闭环
- `training-history-review`: 历史答题记录详情查看与筛选
- `training-ai-scoring`: AI 评分体系与能力维度可视化
- `training-question-quality`: 题目去重、难度分级与质量反馈

### Modified Capabilities
- （无现有 spec 需要修改）

## Impact

- **前端页面**：`src/app/(app)/training/page.tsx`（雷达图、真实 streak）
- **新页面**：`src/app/(app)/training/history/[id]/page.tsx`（历史详情）
- **API 端点**：`/api/training/stats`（增加评分数据）、`/api/train`（prompt 调整）、新增 `/api/training/history`、`/api/training/feedback`
- **数据库**：复用现有 `training_records`、`training_sessions` 表；可能新增 `question_feedback` 表
- **AI Prompt**：分析 prompt 增加评分和难度标注要求
```

## openspec/changes/training-enhancement/design.md

- Source: openspec/changes/training-enhancement/design.md
- Lines: 1-81
- SHA256: 7263d9c37fb99609fcf45ee8186cad22ea13b88413ee32c8308064ecbb25c69e

[TRUNCATED]

```md
## Context

训练模块已完成单题模式基础重构（`training-single-mode` 已归档）。当前系统每天生成5维度题目（战略思维、系统设计、数据决策、用户洞察、商业思维），用户逐题作答后获得 AI 诊断+建议分析。

现有数据模型：
- `training_sessions`（user_id, session_date, questions[]）— 记录每日训练 session
- `training_records`（user_id, dimension, question_scenario, user_answer, ai_feedback, score, created_at）— 记录每题作答

当前缺口：
- `training_sessions` 在训练完成后未被写入（session 未闭环）
- 首页 streak 是 mock 数据，计算逻辑返回的是"本月天数"而非"连续天数"
- 历史记录只能列表查看，无法进入详情
- AI 分析无量化评分，无法追踪能力趋势
- 题目可能重复，无难度区分

## Goals / Non-Goals

**Goals:**
- streak 算法基于真实 session 数据计算跨月连续天数
- 完成一轮训练后自动写入 `training_sessions`
- 历史答题可点击回顾完整内容（题目+答案+AI分析）
- AI 分析输出包含 1-10 分维度评分
- 首页展示能力雷达图（各维度平均分）
- 题目生成时标注难度并做去重
- 用户可对题目进行质量反馈（点赞/踩）

**Non-Goals:**
- 不修改题目生成模型（仍用 DeepSeek v4 Flash）
- 不改变现有数据库表结构（`training_records`、`training_sessions` 字段不变）
- 不引入复杂推荐算法
- 不涉及社交/排行榜功能

## Decisions

### 1. streak 算法：基于 training_sessions 表而非 training_records
- **Rationale**: `training_sessions` 代表"完成一轮训练"的日级标记，更符合 streak 语义。`training_records` 可能包含未完成 session 的单题记录。
- **Implementation**: 查询用户最近30天有 session 的日期，从昨天往前数连续天数。今天有 session 则 +1。

### 2. session 闭环时机：完成第5题后自动创建
- **Rationale**: 一轮 = 5 维度各1题。第5题提交答案并收到 AI 分析后，视为本轮完成。
- **Implementation**: 在 `session/page.tsx` 的 `handleNext` 中检测到 `isLast && hasAnalysis` 时，调用 `/api/training/sessions` POST 创建/更新当日 session。

### 3. AI 评分：复用现有分析 prompt，增加评分指令
- **Rationale**: 避免额外 LLM 调用（成本和延迟）。在现有分析流中要求模型输出评分。
- **Format**: 要求模型在分析开头输出 `【评分：X/10】`，前端正则提取。
- **Trade-off**: 评分由同一模型生成，可能与分析质量耦合。但单独调用评分模型成本过高。

### 4. 能力雷达图：前端用 recharts 渲染
- **Rationale**: 项目已有 React 生态，recharts 是轻量级选择，无需引入重型图表库。
- **Data**: `/api/training/stats` 增加各维度平均分聚合查询。

### 5. 题目去重：基于文本相似度（非向量）
- **Rationale**: 向量去重需要 embedding 服务和向量数据库，引入过重。文本相似度（Levenshtein 或简单包含判断）足以应对早期阶段。
- **Implementation**: 查询用户最近 N 题的题目文本，生成新题后做相似度检查，若过高则重新生成一次（最多重试2次）。

### 6. 题目难度：由模型自标注
- **Rationale**: 无需人工标注语料。在生成 prompt 中增加"请标注本题难度（初级/中级/高级）"指令。
- **Format**: 题目文本开头或结尾包含难度标记，前端解析。

### 7. 质量反馈：独立 `question_feedback` 表
- **Rationale**: 不与 `training_records` 耦合（反馈可能来自浏览而非作答）。
- **Schema**: `(user_id, question_hash, feedback_type, created_at)`，其中 `question_hash` 为题目前50字 MD5。

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| AI 评分不够客观（同一答案不同时间评分波动） | 记录每次评分并展示趋势而非绝对值；后续可引入评分校准 |
| 文本去重误杀（相似但不重复的好题） | 阈值放宽（如 0.7 相似度才触发重试），且最多重试2次避免死循环 |
| 难度标注由模型决定，可能不准确 | 初期接受模型标注，后续收集用户反馈数据后可校准 |
| 历史详情页增加数据查询量 | 使用分页和单个记录查询，不走全量列表 |
| 雷达图数据不足时（新用户）显示空白 | 空数据状态显示"完成3题后解锁能力分析"引导 |

## Migration Plan

无需数据迁移。现有表结构不变，新增 `question_feedback` 表通过 migration 创建。

## Open Questions

- 题目去重阈值具体数值需要在实现中微调
```

Full source: openspec/changes/training-enhancement/design.md

## openspec/changes/training-enhancement/tasks.md

- Source: openspec/changes/training-enhancement/tasks.md
- Lines: 1-43
- SHA256: 9ef102dd322eca6c587cdd635356718f1e9ddf969a39074dde5087a2124fdcf0

```md
## 1. Streak 计算与 Session 闭环

- [ ] 1.1 修复 `/api/training/stats` 的 streak 算法：基于 `training_sessions` 表计算跨月连续天数
- [ ] 1.2 在 `/api/training/sessions` 增加 POST 接口：完成一轮后创建/更新当日 session
- [ ] 1.3 修改 `src/app/(app)/training/session/page.tsx`：第5题完成后调用 session 闭环 API
- [ ] 1.4 修改 `src/app/(app)/training/page.tsx`：首页 streak 显示真实数据

## 2. AI 评分体系

- [ ] 2.1 修改 `/api/train` 分析 prompt：增加评分指令（要求输出 `【评分：X/10】`）
- [ ] 2.2 修改 `session/page.tsx`：提交答案后从 AI 分析中提取评分并展示
- [ ] 2.3 修改 `/api/training/record`：保存评分到 `training_records.score` 字段

## 3. 历史答题回顾

- [ ] 3.1 新增 `/api/training/history/[id]/route.ts`：查询单条答题记录详情
- [ ] 3.2 新增 `src/app/(app)/training/history/[id]/page.tsx`：历史答题详情页（题目+答案+AI分析）
- [ ] 3.3 修改 `src/app/(app)/training/page.tsx`：历史记录列表添加点击跳转
- [ ] 3.4 新增 `/api/training/history/route.ts`：支持按维度筛选历史记录

## 4. 能力雷达图

- [ ] 4.1 修改 `/api/training/stats`：增加各维度平均分聚合查询
- [ ] 4.2 安装 recharts 依赖
- [ ] 4.3 修改 `src/app/(app)/training/page.tsx`：增加能力雷达图组件（数据充足时展示，不足时显示引导）

## 5. 题目质量优化

- [ ] 5.1 修改 `/api/train` 生成 prompt：增加难度标注指令（`【难度：初级/中级/高级】`）
- [ ] 5.2 修改 `session/page.tsx`：解析并展示难度标签
- [ ] 5.3 实现题目去重逻辑：查询用户最近10题，文本相似度检查（阈值0.7），最多重试2次
- [ ] 5.4 创建 `question_feedback` 表（Supabase migration）
- [ ] 5.5 新增 `/api/training/feedback/route.ts`：接收并存储题目质量反馈
- [ ] 5.6 修改 `session/page.tsx`：题目卡片增加点赞/踩按钮

## 6. 构建与验证

- [ ] 6.1 `npm run build` 通过
- [ ] 6.2 启动服务器，浏览器验证 streak 显示真实数据
- [ ] 6.3 验证完成一轮后 session 正确写入
- [ ] 6.4 验证历史详情页可正常访问
- [ ] 6.5 验证雷达图在有/无数据时的展示
- [ ] 6.6 验证题目难度标签和反馈按钮正常
```

## openspec/changes/training-enhancement/specs/training-ai-scoring/spec.md

- Source: openspec/changes/training-enhancement/specs/training-ai-scoring/spec.md
- Lines: 1-23
- SHA256: c624f984cf903b6232bab816d51380b0003f1e7bf97c81b553fc279466e53da4

```md
## ADDED Requirements

### Requirement: AI 分析包含维度评分
系统 SHALL 在 AI 分析输出中包含对用户答案的 1-10 分评分，评分按能力维度独立计算。

#### Scenario: 用户提交答案后获得评分
- **WHEN** 用户提交答案并收到 AI 分析
- **THEN** 分析内容中包含该维度的评分（如 "【评分：8/10】"）

#### Scenario: 评分被持久化
- **WHEN** AI 分析完成
- **THEN** 评分被提取并随 `training_records` 记录保存

### Requirement: 能力雷达图展示
系统 SHALL 在训练首页展示用户各维度的能力雷达图，基于历史评分数据。

#### Scenario: 有足够数据时展示雷达图
- **WHEN** 用户在各维度均有至少1次评分记录
- **THEN** 首页显示各维度平均分的雷达图

#### Scenario: 数据不足时展示引导
- **WHEN** 用户某维度无评分记录
- **THEN** 雷达图该区域显示为0，并提示"完成更多训练以解锁完整分析"
```

## openspec/changes/training-enhancement/specs/training-history-review/spec.md

- Source: openspec/changes/training-enhancement/specs/training-history-review/spec.md
- Lines: 1-15
- SHA256: efc8a8e7f9dab3bb12110a12fa2d9ca88ec4e0b5840885b5a147c5012419f64a

```md
## ADDED Requirements

### Requirement: 历史答题详情查看
系统 SHALL 允许用户点击首页历史记录列表中的条目，进入该答题的详情页，查看完整的题目、用户答案、AI 诊断与建议。

#### Scenario: 用户点击历史记录
- **WHEN** 用户在训练首页点击某条历史记录
- **THEN** 页面跳转到详情页，展示题目、答案、AI 分析完整内容

### Requirement: 历史记录按维度筛选
系统 SHALL 支持在训练首页按维度筛选历史记录。

#### Scenario: 用户筛选特定维度
- **WHEN** 用户选择"战略思维"维度筛选
- **THEN** 历史记录列表仅展示该维度的答题记录
```

## openspec/changes/training-enhancement/specs/training-question-quality/spec.md

- Source: openspec/changes/training-enhancement/specs/training-question-quality/spec.md
- Lines: 1-34
- SHA256: 57f1696e2cb38e0d6cd8fc5946f037c289c6d78473fe5fa89c549e80af31fe0b

```md
## ADDED Requirements

### Requirement: 题目生成时标注难度
系统 SHALL 在生成题目时要求 AI 标注题目难度（初级/中级/高级），并在前端展示。

#### Scenario: 生成题目包含难度标记
- **WHEN** 系统生成新题目
- **THEN** 题目文本中包含难度标注（如 "【难度：中级】"）

#### Scenario: 前端展示难度标签
- **WHEN** 用户查看题目
- **THEN** 题目卡片上显示对应的难度标签

### Requirement: 题目去重机制
系统 SHALL 在生成新题目时，检查与用户最近 N 道题的相似度，过高时自动重新生成。

#### Scenario: 生成重复题目时自动重试
- **WHEN** 系统生成的新题与用户最近10题中某题相似度超过阈值
- **THEN** 系统自动重新生成一次（最多重试2次）

#### Scenario: 不重复的题目直接返回
- **WHEN** 系统生成的新题与用户历史题目均不重复
- **THEN** 正常展示该题目

### Requirement: 题目质量反馈
系统 SHALL 允许用户对题目进行质量反馈（点赞或踩），并持久化存储。

#### Scenario: 用户点赞题目
- **WHEN** 用户点击题目卡片上的点赞按钮
- **THEN** 系统记录该用户的正向反馈

#### Scenario: 用户踩题目
- **WHEN** 用户点击题目卡片上的踩按钮
- **THEN** 系统记录该用户的负向反馈
```

## openspec/changes/training-enhancement/specs/training-streak-session/spec.md

- Source: openspec/changes/training-enhancement/specs/training-streak-session/spec.md
- Lines: 1-23
- SHA256: 80af7dd44f5d76b2611a5e7127be5ce812940cb8325d128127da8e59bb76eae0

```md
## ADDED Requirements

### Requirement: Streak 计算基于真实训练数据
系统 SHALL 根据用户 `training_sessions` 表中的历史记录计算连续训练天数（streak）。

#### Scenario: 用户连续训练3天后查看首页
- **WHEN** 用户已连续3天完成训练（`training_sessions` 表中有最近3天的记录）
- **THEN** 首页显示 "已连续训练 3 天"

#### Scenario: 用户中断训练后查看首页
- **WHEN** 用户连续训练5天后中断1天
- **THEN** 首页 streak 重置为 0

### Requirement: 训练 session 自动闭环
系统 SHALL 在用户完成一轮（5维度各1题）训练后，自动在 `training_sessions` 表中创建或更新当日记录。

#### Scenario: 用户完成第5题
- **WHEN** 用户完成第5题并收到 AI 分析
- **THEN** `training_sessions` 表中生成当日记录，包含5道题的题目文本

#### Scenario: 用户在同一天进行第二轮训练
- **WHEN** 用户当天已完成一轮，继续第二轮
- **THEN** 当日 `training_sessions` 记录追加第二轮的题目（不创建新日期记录）
```

