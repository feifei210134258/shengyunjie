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
