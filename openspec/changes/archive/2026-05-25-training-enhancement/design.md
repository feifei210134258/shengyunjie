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
- 雷达图展示"所有时间平均分"还是"最近7天/30天"——倾向于"所有时间"但权重最近更高
