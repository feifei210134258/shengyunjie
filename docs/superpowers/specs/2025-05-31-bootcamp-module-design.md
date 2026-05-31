---
comet_change: bootcamp-module
role: technical-design
canonical_spec: openspec
---

# Design Doc: 特训冲刺模块

## 架构

- **多页路由**: `/bootcamp/resume` → `/bootcamp/interview` → `/bootcamp/report`
- **服务端解析**: Next.js API Route 接收简历 → 提取文本 → AI 解析
- **独立数据模型**: `bootcamp_sessions` / `bootcamp_interviews` / `bootcamp_reports`

## 技术方案

### 简历解析（Day 0）
- API: `POST /api/bootcamp/resume` 接收 PDF/DOCX，限制 10MB
- 文本提取：服务端使用 pdf-parse + mammoth
- AI 解析：调用现有 AI SDK，返回结构化 JSON（work_experience, projects, skills, education）
- 弱点预测：二次 AI 调用，生成能力雷达 + 薄弱项列表
- 失败兜底：解析失败时提供手动输入表单

### 模拟面试（Day 1-3）
- API: `POST /api/bootcamp/interview` 动态生成每日 5 题
- 难度递增：Day 1 基础 → Day 2 进阶 → Day 3 案例实战
- 作答：文字输入，最低 20 字符警告
- 评分：AI 四维评分（结构化/逻辑性/专业度/创新性），1-10 分
- 超时处理：30 秒超时，重试 3 次

### 诊断报告
- 单题报告： inline 显示，可展开详细分析
- 日报：Day 完成后生成，含维度趋势
- 综合报告：Day 3 完成后生成，对比 Day 1 vs Day 3，含学习计划和等级评定

## 数据流

```
用户上传简历
  → POST /api/bootcamp/resume
    → 提取文本 → AI 解析 → 存储 bootcamp_sessions
      → 弱点预测 → 显示雷达图 → "开始特训" CTA
        → 进入 Day 1
          → GET /api/bootcamp/interview (生成 5 题)
            → 用户作答 → POST /api/bootcamp/interview/answer
              → AI 评分 → 存储 bootcamp_interviews
                → 显示评分 + 详细反馈
                  → 5 题完成 → POST /api/bootcamp/report (daily)
                    → Day 3 完成 → POST /api/bootcamp/report (comprehensive)
```

## 关键组件

- `ResumeUploader` - 拖拽上传 + 校验
- `ResumePreview` - 结构化展示解析结果
- `WeaknessReport` - 雷达图 + 薄弱项标签
- `InterviewQuestion` - 题目卡片 + 作答区
- `AnswerEvaluation` - 分数展示 + 维度拆解
- `ReportCard` - 报告展示（含图表）

## 测试策略

- 3 天流程端到端测试
- 简历解析失败兜底测试
- AI 评分超时重试测试
- 会话持久化测试（刷新/重新登录）

## 风险与缓解

| 风险 | 缓解 |
|------|------|
| 扫描件 PDF 无法解析 | 预校验 + 手动输入兜底 |
| AI 生成题目质量不稳定 | Prompt 优化 + 用户反馈 |
| 评分偏差 | 维度透明化 + 反馈入口 |
| 数据量增长 | 30 天后归档 interview 详情 |
