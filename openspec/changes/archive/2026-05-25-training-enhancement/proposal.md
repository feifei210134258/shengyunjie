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
