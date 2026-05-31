# Comet Design Handoff

- Change: bootcamp-module
- Phase: design
- Mode: compact
- Context hash: 8eb0da9450857dea0a6ad4511cbb26da45c48aaad7b48768c89a5833fe347b80

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/bootcamp-module/proposal.md

- Source: openspec/changes/bootcamp-module/proposal.md
- Lines: 1-32
- SHA256: 2ec72554799ad5b2bfb3636b8ff433bd77153e8877c9ffc07e5896732c8984ee

```md
# Proposal: 特训冲刺模块

## Why

当前产品已具备能力诊断（量表+访谈+案例）和日常训练（题库+案例库），但缺少**高强度、集中式、目标导向**的面试冲刺环节。B 端产品经理在面试前需要针对性的密集训练，特别是基于个人履历的定制化面试模拟。特训冲刺填补这一空白，形成"诊断→日常训练→冲刺"的完整成长闭环。

## What Changes

- **新增简历解析页（Day 0）**：用户上传简历 PDF/Word，AI 自动解析关键信息（工作经历、项目亮点、技能栈），生成能力画像和面试弱点预测
- **新增 AI 模拟面试页（Day 1-3）**：基于简历解析结果，AI 每日生成 5 道针对性面试题（难度递增），支持文字作答，AI 实时评分反馈
- **新增面试诊断报告页**：每轮面试后生成详细诊断报告（表现分析、薄弱项标注、改进建议），3 天结束后生成综合成长报告
- **新增数据库表**：`bootcamp_sessions`（特训会话）、`bootcamp_interviews`（面试记录）、`bootcamp_reports`（诊断报告）
- **新增 API 路由**：`/api/bootcamp/resume`（简历解析）、`/api/bootcamp/interview`（面试题生成与评分）、`/api/bootcamp/report`（报告生成）
- **新增导航入口**：侧边栏"特训冲刺"菜单项，点击进入 Day 0 简历上传页

## Capabilities

### New Capabilities
- `bootcamp-resume-parse`：简历上传与 AI 解析，提取结构化信息并生成能力画像
- `bootcamp-interview-sim`：基于简历的每日 AI 模拟面试，支持多轮对话与评分
- `bootcamp-report-generate`：面试后诊断报告与 3 天综合成长报告生成

### Modified Capabilities
- （无现有 spec 需要修改，特训冲刺为独立模块）

## Impact

- **前端**：新增 3 个页面（`/bootcamp/resume`、`/bootcamp/interview`、`/bootcamp/report`）
- **后端**：新增 3 个 API 路由，新增 3 张数据库表
- **AI Prompt**：新增简历解析 Prompt、面试题生成 Prompt、面试评分 Prompt、报告生成 Prompt
- **数据库 Schema**：新增 `bootcamp_sessions`、`bootcamp_interviews`、`bootcamp_reports` 表及 RLS 策略
- **依赖**：无需新增外部依赖，复用现有 AI SDK、Supabase、shadcn/ui
```

## openspec/changes/bootcamp-module/design.md

- Source: openspec/changes/bootcamp-module/design.md
- Lines: 1-100
- SHA256: 4f4961675f9347cb306638fd9a6a12bc66f2fe3c1c959a801ee7e62a1772052e

[TRUNCATED]

```md
# Design: 特训冲刺模块

## Context

当前产品已完成：
- **诊断模块**：量表初筛 → AI 深度访谈 → 案例实战 → 综合报告
- **日常训练**：AI 动态出题 → 答题评分 → 历史记录 → 能力雷达
- **案例库**：经典 B 端产品拆解，多视角分析

**缺失环节**：面试前的**高强度集中训练**。日常训练是碎片化、低强度的，而面试准备需要：
1. 基于个人履历的定制化问题
2. 连续多天的密集模拟
3. 每轮详细反馈与改进追踪

## Goals / Non-Goals

**Goals:**
- 用户上传简历后，AI 能在 30 秒内解析出结构化信息并生成面试弱点预测
- 每日生成 5 道针对性面试题（难度递增），支持文字作答
- 每轮面试后生成包含评分、薄弱项、改进建议的诊断报告
- 3 天特训结束后生成综合成长报告，对比 Day 1 与 Day 3 的能力变化

**Non-Goals:**
- 不支持语音作答（ MVP 阶段只用文字）
- 不支持实时视频面试（异步文字交互）
- 不接入第三方招聘平台（独立训练工具）
- 不构建复杂的进度追踪系统（简化设计，专注核心训练体验）

## Decisions

### 1. 简历解析：前端直传 vs 服务端解析
**选择**：服务端解析（Next.js API Route 接收文件 → 提取文本 → AI 解析）
**理由**：
- 简历文件可能含敏感信息，服务端处理更安全
- 需要调用 AI 模型进行结构化解析，前端无法直接完成
- 可复用现有 AI SDK 配置

**替代方案**：前端上传至 Supabase Storage → Edge Function 解析。拒绝原因：Edge Function 有 50MB 限制和冷启动延迟，且增加架构复杂度。

### 2. 面试题生成：基于简历动态生成 vs 预置题库
**选择**：基于简历动态生成（每轮根据简历内容 + 当前 Day + 上一轮表现生成新题）
**理由**：
- 预置题库无法体现个人履历特点，针对性差
- 动态生成可以结合用户弱点预测，聚焦薄弱环节
- 3 天难度递增需要动态调整

**替代方案**：预置 100 题随机抽取。拒绝原因：无法体现履历差异，用户感知为"模板化"。

### 3. 评分标准：AI 评分 vs 规则评分
**选择**：AI 评分（模型根据回答质量、结构化程度、专业度打分 1-10）
**理由**：
- 产品经理面试没有标准答案，需要模型判断逻辑严密性和思维深度
- 规则评分（关键词匹配）过于机械，无法评估思维质量

**风险**：模型评分可能存在偏差。→ **缓解**：提供评分维度拆解（结构化、逻辑性、专业度、创新性），让用户理解评分依据。

### 4. 数据模型：独立表 vs 复用 training_records
**选择**：独立表（`bootcamp_sessions`、`bootcamp_interviews`、`bootcamp_reports`）
**理由**：
- 特训冲刺与日常训练的业务逻辑不同：特训是连续 3 天、有明确起止时间、有报告生成
- 独立表便于查询特训历史，不与日常训练混淆
- 面试题和答题内容与日常训练题库结构不同

### 5. 页面结构：单页多步骤 vs 多页路由
**选择**：多页路由（`/bootcamp/resume` → `/bootcamp/interview` → `/bootcamp/report`）
**理由**：
- 三个环节功能差异大，单页会导致组件过于复杂
- 多页便于刷新和分享特定环节
- 与现有诊断模块（多页）保持一致的设计模式

### 6. 进度追踪：独立组件 vs 简化集成
**选择**：不构建独立进度追踪系统，仅在页面内显示简单进度指示器
**理由**：
- 3 天特训周期短，复杂进度追踪价值有限
- 面试页面本身已有"第 X / 5 题"和"Day X / 3"的进度显示
- 减少不必要的组件复杂度，专注核心训练体验
- 侧边栏仅显示当前是否有进行中的特训（简单状态即可）

## Risks / Trade-offs

```

Full source: openspec/changes/bootcamp-module/design.md

## openspec/changes/bootcamp-module/tasks.md

- Source: openspec/changes/bootcamp-module/tasks.md
- Lines: 1-56
- SHA256: f9a8dd787768ed77f73daff7f10623a58cb595f15e0d0642a2343525de9f17d4

```md
# Tasks: 特训冲刺模块

## 1. Database Schema

- [ ] 1.1 Create `bootcamp_sessions` table (id, user_id, status, current_day, resume_text, parsed_profile, weakness_prediction, created_at, updated_at)
- [ ] 1.2 Create `bootcamp_interviews` table (id, session_id, day_number, question_index, question_text, user_answer, ai_evaluation, scores, status, created_at)
- [ ] 1.3 Create `bootcamp_reports` table (id, session_id, report_type, content, scores_snapshot, created_at)
- [ ] 1.4 Add RLS policies for all three tables (authenticated users can only access their own data)
- [ ] 1.5 Update `supabase/schema.sql` with new tables and policies

## 2. API Routes

- [ ] 2.1 Implement `POST /api/bootcamp/resume` — receive file upload, extract text, call AI parsing, store result
- [ ] 2.2 Implement `GET /api/bootcamp/resume` — retrieve parsed resume and weakness prediction
- [ ] 2.3 Implement `POST /api/bootcamp/interview` — generate daily questions (Day N logic with difficulty progression, N = 1-3)
- [ ] 2.4 Implement `GET /api/bootcamp/interview` — retrieve current day's questions and progress
- [ ] 2.5 Implement `POST /api/bootcamp/interview/answer` — submit answer, trigger AI evaluation
- [ ] 2.6 Implement `GET /api/bootcamp/report` — retrieve daily or comprehensive report
- [ ] 2.7 Implement `POST /api/bootcamp/report` — generate report after day completion

## 3. AI Prompts

- [ ] 3.1 Create resume parsing prompt (`src/prompts/bootcamp-resume-parse.md`)
- [ ] 3.2 Create weakness prediction prompt (`src/prompts/bootcamp-weakness-predict.md`)
- [ ] 3.3 Create interview question generation prompt (`src/prompts/bootcamp-question-gen.md`)
- [ ] 3.4 Create answer evaluation prompt (`src/prompts/bootcamp-answer-eval.md`)
- [ ] 3.5 Create daily report generation prompt (`src/prompts/bootcamp-daily-report.md`)
- [ ] 3.6 Create comprehensive report generation prompt (`src/prompts/bootcamp-comprehensive-report.md`)

## 4. Frontend Pages

- [ ] 4.1 Create `/bootcamp/resume` page — file upload UI, parse result display, weakness report, "开始特训" CTA
- [ ] 4.2 Create `/bootcamp/interview` page — question display, text input, submit button, progress indicator (第 X / 5 题, Day X / 3), prev/next navigation
- [ ] 4.3 Create `/bootcamp/report` page — daily report view, comprehensive report view, report history list

## 5. Components

- [ ] 5.1 Create `ResumeUploader` component — drag & drop file upload with validation
- [ ] 5.2 Create `ResumePreview` component — display parsed resume in structured format
- [ ] 5.3 Create `WeaknessReport` component — radar chart + weakness list + severity badges
- [ ] 5.4 Create `InterviewQuestion` component — question card with answer input
- [ ] 5.5 Create `AnswerEvaluation` component — score display + dimension breakdown + feedback text
- [ ] 5.6 Create `DailySummary` component — day completion celebration + key takeaways
- [ ] 5.7 Create `ReportCard` component — report display with charts and insights

## 6. Integration & Testing

- [ ] 6.1 Integrate resume upload → parse → weakness prediction flow end-to-end
- [ ] 6.2 Integrate daily question generation → answer → evaluation flow end-to-end
- [ ] 6.3 Integrate report generation after day completion
- [ ] 6.4 Test 3-day progression logic (Day 1 → Day 3)
- [ ] 6.5 Test session persistence (refresh, logout/login)
- [ ] 6.6 Test error handling (invalid file, parse failure, AI timeout)
- [ ] 6.7 Run `npx tsc --noEmit` and fix all type errors
- [ ] 6.8 Run `npx eslint src/ --max-warnings 0` and fix all lint errors
- [ ] 6.9 Run `./init.sh` to verify full environment health
```

## openspec/changes/bootcamp-module/specs/bootcamp-interview-sim/spec.md

- Source: openspec/changes/bootcamp-module/specs/bootcamp-interview-sim/spec.md
- Lines: 1-65
- SHA256: 67f8a10b5479c2bb9022f8f03127ad1519989a986ef73e313176bef6cc36ad92

```md
## ADDED Requirements

### Requirement: AI generates daily interview questions
The system SHALL generate 5 interview questions per day for 3 consecutive days, with difficulty increasing each day and questions tailored to the user's resume and weakness prediction.

#### Scenario: Day 1 question generation
- **WHEN** user starts Day 1 of bootcamp
- **THEN** system generates 5 questions based on: resume projects, weakness prediction, basic difficulty level
- **AND** questions cover multiple dimensions (strategy, system design, data-driven, user insight, business thinking)
- **AND** system stores questions in bootcamp_interviews table with status "pending"

#### Scenario: Day N question generation (N > 1)
- **WHEN** user starts Day N of bootcamp
- **THEN** system generates 5 questions with increased difficulty compared to Day N-1
- **AND** system considers previous days' performance (low-scored dimensions get more focus)
- **AND** system includes case study questions on Day 2-3

### Requirement: User can answer interview questions
The system SHALL allow users to answer each interview question via text input and submit for AI evaluation.

#### Scenario: Successful answer submission
- **WHEN** user types answer in text area and clicks "提交回答"
- **THEN** system stores the answer in bootcamp_interviews table
- **AND** system sends answer to AI model for evaluation
- **AND** system displays loading state while AI evaluates

#### Scenario: Empty answer submission
- **WHEN** user clicks "提交回答" without typing anything
- **THEN** system displays error message "请输入你的回答"
- **AND** system does not submit empty answer

#### Scenario: Answer too short
- **WHEN** user submits answer with less than 20 characters
- **THEN** system displays warning "回答过于简短，建议详细阐述你的思路"
- **AND** system allows submission but may affect scoring

### Requirement: AI evaluates answer and provides score
The system SHALL evaluate each answer on a scale of 1-10 across four dimensions: structure, logic, professionalism, and innovation.

#### Scenario: Successful evaluation
- **WHEN** answer is submitted for evaluation
- **THEN** AI model returns: overall score (1-10), dimension scores (structure, logic, professionalism, innovation), detailed feedback text
- **AND** system stores evaluation result in bootcamp_interviews table
- **AND** system displays score breakdown and feedback to user

#### Scenario: Evaluation timeout
- **WHEN** AI evaluation takes longer than 30 seconds
- **THEN** system displays "评分正在计算中，请稍候..."
- **AND** system retries evaluation up to 3 times
- **AND** if all retries fail, system displays "评分服务暂时不可用，请稍后刷新页面查看"

### Requirement: Daily interview completion tracking
The system SHALL track which questions have been answered and completed each day.

#### Scenario: Question status tracking
- **WHEN** user views the interview page
- **THEN** system displays progress indicator (e.g., "第 3 / 5 题")
- **AND** system shows which questions are completed (answered + evaluated) vs pending
- **AND** user can navigate between questions using prev/next buttons

#### Scenario: Day completion
- **WHEN** user completes all 5 questions for the current day
- **THEN** system displays "今日特训完成" summary
- **AND** system shows overall day score and key takeaways
- **AND** system unlocks next day (or shows completion if Day 3)
```

## openspec/changes/bootcamp-module/specs/bootcamp-report-generate/spec.md

- Source: openspec/changes/bootcamp-module/specs/bootcamp-report-generate/spec.md
- Lines: 1-44
- SHA256: bcd6dcb398f05cad5d6df355c9c167ff70e244d1cf628a096f233510c3e5f1e6

```md
## ADDED Requirements

### Requirement: AI generates per-interview diagnostic report
The system SHALL generate a detailed diagnostic report after each interview answer is evaluated.

#### Scenario: Single answer report
- **WHEN** answer evaluation is complete
- **THEN** system generates report containing: score breakdown radar chart, key strengths (what was good), specific gaps (what was missing), actionable improvement suggestions, comparison to benchmark (average score for this question type)
- **AND** system displays report inline below the answer
- **AND** user can toggle "查看详细分析" to expand full report

#### Scenario: Daily summary report
- **WHEN** user completes all 5 questions for a day
- **THEN** system generates daily summary report containing: overall day score, dimension trend (compared to previous day), weakest question with detailed feedback, strongest question with best practices, recommended reading/resources for weak areas
- **AND** system stores daily report in bootcamp_reports table with type "daily"

### Requirement: AI generates 3-day comprehensive report
The system SHALL generate a comprehensive growth report after Day 3 is completed.

#### Scenario: Comprehensive report generation
- **WHEN** user completes Day 3 (all 3 days finished)
- **THEN** system generates comprehensive report containing: Day 1 vs Day 3 score comparison (overall + per dimension), growth trajectory chart, persistent weak areas that need long-term focus, strongest improvements, personalized study plan for post-bootcamp training, overall bootcamp grade (A/B/C/D)
- **AND** system stores comprehensive report in bootcamp_reports table with type "comprehensive"
- **AND** system displays completion celebration UI with report download option

#### Scenario: Report sharing
- **WHEN** user views the comprehensive report
- **THEN** system provides "分享报告" button
- **AND** system generates shareable link or image snapshot of report
- **AND** shared view is read-only and does not expose other user data

### Requirement: Report history and retrieval
The system SHALL allow users to view past reports from completed bootcamp sessions.

#### Scenario: View historical reports
- **WHEN** user navigates to "特训报告" page
- **THEN** system displays list of all completed bootcamp sessions with dates and final grades
- **AND** user can click any session to view its daily reports and comprehensive report
- **AND** system displays "尚未完成特训" message if user has no completed sessions

#### Scenario: Report persistence
- **WHEN** a bootcamp session is completed
- **THEN** system retains all daily reports and comprehensive report indefinitely
- **AND** reports are associated with user_id for privacy
```

## openspec/changes/bootcamp-module/specs/bootcamp-resume-parse/spec.md

- Source: openspec/changes/bootcamp-module/specs/bootcamp-resume-parse/spec.md
- Lines: 1-49
- SHA256: 306e2d5591683cb5b868fdf128c86283409ce6e3144990da0c2181e9af7e9de7

```md
## ADDED Requirements

### Requirement: User can upload resume file
The system SHALL allow authenticated users to upload a resume file (PDF or DOCX format, max 10MB).

#### Scenario: Successful upload
- **WHEN** user selects a valid PDF or DOCX file and clicks "上传简历"
- **THEN** system validates file type and size
- **AND** system extracts text content from the file
- **AND** system stores the extracted text for AI parsing

#### Scenario: Invalid file type
- **WHEN** user selects a file that is not PDF or DOCX
- **THEN** system displays error message "请上传 PDF 或 Word 格式的简历"
- **AND** system does not process the file

#### Scenario: File too large
- **WHEN** user selects a file larger than 10MB
- **THEN** system displays error message "文件大小不能超过 10MB"
- **AND** system does not process the file

### Requirement: AI parses resume into structured profile
The system SHALL parse the uploaded resume text into a structured profile including: work experience, project highlights, skill stack, and education background.

#### Scenario: Successful parsing
- **WHEN** resume text is successfully extracted
- **THEN** system sends text to AI model with structured parsing prompt
- **AND** system returns JSON with fields: work_experience[], projects[], skills[], education[]
- **AND** system stores parsed profile in bootcamp_sessions table

#### Scenario: Parsing failure
- **WHEN** resume text extraction fails (e.g., scanned PDF without OCR)
- **THEN** system displays error message "无法解析该简历，请尝试上传文字版 PDF 或手动输入关键信息"
- **AND** system provides manual input form as fallback

### Requirement: AI generates weakness prediction
The system SHALL analyze the parsed resume and generate an interview weakness prediction report.

#### Scenario: Weakness prediction generated
- **WHEN** resume parsing is complete
- **THEN** system sends parsed profile to AI model for weakness analysis
- **AND** system returns weakness report with: predicted weak dimensions, specific gap areas, recommended focus topics
- **AND** system displays weakness report to user
- **AND** system stores weakness prediction in bootcamp_sessions table

#### Scenario: Weakness prediction display
- **WHEN** user views the resume parse result page
- **THEN** system displays: capability radar chart, weakness list with severity (high/medium/low), recommended training focus
- **AND** system shows "开始特训" button to proceed to Day 1 interview
```

