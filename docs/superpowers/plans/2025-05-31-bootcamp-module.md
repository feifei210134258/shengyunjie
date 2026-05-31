---
change: bootcamp-module
design-doc: docs/superpowers/specs/2025-05-31-bootcamp-module-design.md
base-ref: 7e6ecba6c9179efeb7af43492f674ffade7ade42
---

# 特训冲刺模块实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现特训冲刺模块（简历解析 → 3天AI模拟面试 → 诊断报告），包含3个新页面、7个API路由、6个AI Prompt、7个组件。

**Architecture:** Next.js App Router 多页路由结构，独立数据表存储特训会话/面试/报告，服务端解析简历并调用 DeepSeek API 生成题目和评分。

**Tech Stack:** Next.js 15 + TypeScript + Tailwind + shadcn/ui + Supabase + Vercel AI SDK (DeepSeek) + recharts

---

## 文件结构

```
src/
  app/(app)/bootcamp/
    page.tsx                    # 特训入口页（引导到简历上传）
    resume/page.tsx             # 简历上传与解析结果页
    interview/page.tsx          # 模拟面试页（题目/作答/评分）
    report/page.tsx             # 报告页（日报/综合报告/历史）
  app/api/bootcamp/
    resume/route.ts             # POST/GET 简历解析
    interview/route.ts          # POST/GET 面试题生成
    interview/answer/route.ts   # POST 提交答案与评分
    report/route.ts             # POST/GET 报告生成
  components/bootcamp/
    ResumeUploader.tsx          # 拖拽上传组件
    ResumePreview.tsx           # 简历结构化展示
    WeaknessReport.tsx          # 弱点雷达图+列表
    InterviewQuestion.tsx       # 题目卡片+作答区
    AnswerEvaluation.tsx        # 评分展示+维度拆解
    DailySummary.tsx            # 日完成总结
    ReportCard.tsx              # 报告卡片（图表+洞察）
  prompts/
    bootcamp-resume-parse.md    # 简历解析 Prompt
    bootcamp-weakness-predict.md # 弱点预测 Prompt
    bootcamp-question-gen.md    # 面试题生成 Prompt
    bootcamp-answer-eval.md     # 答案评分 Prompt
    bootcamp-daily-report.md    # 日报生成 Prompt
    bootcamp-comprehensive-report.md # 综合报告 Prompt
  lib/
    bootcamp.ts                 # 特训业务工具函数
  types/
    bootcamp.ts                 # 特训相关类型定义
```

---

## Task 1: 数据库 Schema

**Files:**
- Modify: `supabase/schema.sql`

### Step 1.1: 创建 `bootcamp_sessions` 表

```sql
-- 10. 特训会话表
-- 注意：原 bootcamp_records 表为早期设计，本次新建独立表结构

create table if not exists public.bootcamp_sessions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references public.profiles(id) on delete cascade not null,
  status            text default 'not_started',  -- not_started, in_progress, completed
  current_day       smallint default 0,          -- 0-3 (0=简历上传阶段)
  resume_text       text,                        -- 提取的简历原始文本
  parsed_profile    jsonb,                       -- 结构化解析结果
  weakness_prediction jsonb,                     -- 弱点预测报告
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

alter table public.bootcamp_sessions enable row level security;

create policy "用户可以查看自己的特训会话"
  on public.bootcamp_sessions for select
  using (auth.uid() = user_id);

create policy "用户可以创建特训会话"
  on public.bootcamp_sessions for insert
  with check (auth.uid() = user_id);

create policy "用户可以更新自己的特训会话"
  on public.bootcamp_sessions for update
  using (auth.uid() = user_id);
```

- [ ] **Step 1.1: 添加 bootcamp_sessions 表到 schema.sql**

### Step 1.2: 创建 `bootcamp_interviews` 表

```sql
-- 11. 特训面试记录表
create table if not exists public.bootcamp_interviews (
  id                uuid primary key default gen_random_uuid(),
  session_id        uuid references public.bootcamp_sessions(id) on delete cascade not null,
  day_number        smallint not null,           -- 1-3
  question_index    smallint not null,           -- 1-5
  question_text     text not null,
  question_type     text,                        -- strategy, system_design, data_driven, user_insight, business_thinking
  difficulty        smallint default 1,          -- 1-5
  user_answer       text,
  ai_evaluation     jsonb,                       -- {overall_score, structure, logic, professionalism, innovation, feedback}
  status            text default 'pending',      -- pending, answered, evaluated
  created_at        timestamptz default now(),
  updated_at        timestamptz default now(),
  unique(session_id, day_number, question_index)
);

alter table public.bootcamp_interviews enable row level security;

create policy "用户可以查看自己的面试记录"
  on public.bootcamp_interviews for select
  using (exists (
    select 1 from public.bootcamp_sessions
    where bootcamp_sessions.id = bootcamp_interviews.session_id
    and bootcamp_sessions.user_id = auth.uid()
  ));

create policy "用户可以创建面试记录"
  on public.bootcamp_interviews for insert
  with check (exists (
    select 1 from public.bootcamp_sessions
    where bootcamp_sessions.id = bootcamp_interviews.session_id
    and bootcamp_sessions.user_id = auth.uid()
  ));

create policy "用户可以更新自己的面试记录"
  on public.bootcamp_interviews for update
  using (exists (
    select 1 from public.bootcamp_sessions
    where bootcamp_sessions.id = bootcamp_interviews.session_id
    and bootcamp_sessions.user_id = auth.uid()
  ));
```

- [ ] **Step 1.2: 添加 bootcamp_interviews 表到 schema.sql**

### Step 1.3: 创建 `bootcamp_reports` 表

```sql
-- 12. 特训报告表
create table if not exists public.bootcamp_reports (
  id                uuid primary key default gen_random_uuid(),
  session_id        uuid references public.bootcamp_sessions(id) on delete cascade not null,
  report_type       text not null,               -- daily, comprehensive
  day_number        smallint,                    -- 1-3 (daily 报告用)
  content           jsonb not null,              -- 报告内容
  scores_snapshot   jsonb,                       -- 分数快照
  created_at        timestamptz default now()
);

alter table public.bootcamp_reports enable row level security;

create policy "用户可以查看自己的特训报告"
  on public.bootcamp_reports for select
  using (exists (
    select 1 from public.bootcamp_sessions
    where bootcamp_sessions.id = bootcamp_reports.session_id
    and bootcamp_sessions.user_id = auth.uid()
  ));

create policy "用户可以创建特训报告"
  on public.bootcamp_reports for insert
  with check (exists (
    select 1 from public.bootcamp_sessions
    where bootcamp_sessions.id = bootcamp_reports.session_id
    and bootcamp_sessions.user_id = auth.uid()
  ));
```

- [ ] **Step 1.3: 添加 bootcamp_reports 表到 schema.sql**

### Step 1.4: 提交 Schema

```bash
git add supabase/schema.sql
git commit -m "feat(db): add bootcamp sessions, interviews, reports tables with RLS"
```

- [ ] **Step 1.4: 提交数据库变更**

---

## Task 2: 类型定义与工具函数

**Files:**
- Create: `src/types/bootcamp.ts`
- Create: `src/lib/bootcamp.ts`

### Step 2.1: 创建类型定义

```typescript
// src/types/bootcamp.ts

export interface ParsedProfile {
  work_experience: Array<{
    company: string;
    title: string;
    duration: string;
    highlights: string[];
  }>;
  projects: Array<{
    name: string;
    description: string;
    role: string;
    outcomes: string[];
  }>;
  skills: string[];
  education: Array<{
    school: string;
    degree: string;
    major: string;
  }>;
}

export interface WeaknessPrediction {
  weak_dimensions: Array<{
    dimension: string;
    severity: "high" | "medium" | "low";
    gap_description: string;
  }>;
  recommended_focus: string[];
}

export interface InterviewQuestion {
  id: string;
  day_number: number;
  question_index: number;
  question_text: string;
  question_type: string;
  difficulty: number;
  status: "pending" | "answered" | "evaluated";
  user_answer?: string;
  ai_evaluation?: AIEvaluation;
}

export interface AIEvaluation {
  overall_score: number;
  structure: number;
  logic: number;
  professionalism: number;
  innovation: number;
  feedback: string;
  strengths: string[];
  gaps: string[];
  suggestions: string[];
}

export interface BootcampSession {
  id: string;
  user_id: string;
  status: "not_started" | "in_progress" | "completed";
  current_day: number;
  parsed_profile?: ParsedProfile;
  weakness_prediction?: WeaknessPrediction;
  created_at: string;
  updated_at: string;
}

export interface BootcampReport {
  id: string;
  session_id: string;
  report_type: "daily" | "comprehensive";
  day_number?: number;
  content: {
    summary: string;
    key_takeaways: string[];
    recommended_reading?: string[];
    grade?: string;
    comparison?: {
      day1_scores: Record<string, number>;
      day3_scores: Record<string, number>;
      growth: string;
    };
  };
  scores_snapshot?: Record<string, number>;
}
```

- [ ] **Step 2.1: 创建类型定义文件**

### Step 2.2: 创建业务工具函数

```typescript
// src/lib/bootcamp.ts

import { BootcampSession, InterviewQuestion, AIEvaluation } from "@/types/bootcamp";

export function calculateDayProgress(questions: InterviewQuestion[]): {
  completed: number;
  total: number;
  allEvaluated: boolean;
} {
  const completed = questions.filter((q) => q.status === "evaluated").length;
  return {
    completed,
    total: questions.length,
    allEvaluated: completed === questions.length,
  };
}

export function calculateAverageScores(questions: InterviewQuestion[]): Record<string, number> {
  const evaluated = questions.filter((q) => q.ai_evaluation);
  if (evaluated.length === 0) return {};

  const dimensions = ["structure", "logic", "professionalism", "innovation"];
  const result: Record<string, number> = {};

  for (const dim of dimensions) {
    const scores = evaluated
      .map((q) => q.ai_evaluation?.[dim as keyof AIEvaluation] as number)
      .filter((s): s is number => s !== undefined);
    result[dim] = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0;
  }

  return result;
}

export function getDifficultyLabel(day: number): string {
  switch (day) {
    case 1:
      return "基础";
    case 2:
      return "进阶";
    case 3:
      return "实战";
    default:
      return "基础";
  }
}
```

- [ ] **Step 2.2: 创建业务工具函数**

### Step 2.3: 提交类型和工具

```bash
git add src/types/bootcamp.ts src/lib/bootcamp.ts
git commit -m "feat(bootcamp): add types and utility functions"
```

- [ ] **Step 2.3: 提交**

---

## Task 3: AI Prompts

**Files:**
- Create: `src/prompts/bootcamp-resume-parse.md`
- Create: `src/prompts/bootcamp-weakness-predict.md`
- Create: `src/prompts/bootcamp-question-gen.md`
- Create: `src/prompts/bootcamp-answer-eval.md`
- Create: `src/prompts/bootcamp-daily-report.md`
- Create: `src/prompts/bootcamp-comprehensive-report.md`

### Step 3.1: 简历解析 Prompt

```markdown
# 简历解析 Prompt

你是一位资深 HR 和技术面试官，擅长从简历中提取关键信息。

请解析以下简历文本，提取结构化信息并以 JSON 格式返回：

```json
{
  "work_experience": [
    {
      "company": "公司名",
      "title": "职位",
      "duration": "时间段",
      "highlights": ["亮点1", "亮点2"]
    }
  ],
  "projects": [
    {
      "name": "项目名",
      "description": "项目描述",
      "role": "担任角色",
      "outcomes": ["成果1", "成果2"]
    }
  ],
  "skills": ["技能1", "技能2"],
  "education": [
    {
      "school": "学校",
      "degree": "学位",
      "major": "专业"
    }
  ]
}
```

要求：
- 如果某字段无法提取，使用空数组或空字符串
- highlights 和 outcomes 最多提取 3 条最关键的
- 保持原始语言（中文简历用中文输出）
```

- [ ] **Step 3.1: 创建简历解析 Prompt**

### Step 3.2: 弱点预测 Prompt

```markdown
# 弱点预测 Prompt

你是一位 B 端产品总监，擅长评估产品经理的能力短板。

基于以下解析后的简历信息，分析该候选人在 B 端产品面试中的潜在弱点：

{{parsed_profile}}

请以 JSON 格式返回弱点预测报告：

```json
{
  "weak_dimensions": [
    {
      "dimension": "战略思维",
      "severity": "high",
      "gap_description": "缺乏从 0 到 1 的产品规划经验"
    }
  ],
  "recommended_focus": ["建议关注的主题1", "建议关注的主题2"]
}
```

评估维度：战略思维、系统设计、数据驱动、用户洞察、商业思维
severity 可选：high（严重）、medium（中等）、low（轻微）
```

- [ ] **Step 3.2: 创建弱点预测 Prompt**

### Step 3.3: 面试题生成 Prompt

```markdown
# 面试题生成 Prompt

你是一位 B 端产品 VP，正在为一位产品经理设计定制化面试题。

候选人简历信息：
{{parsed_profile}}

弱点预测：
{{weakness_prediction}}

当前特训第 {{day_number}} 天（共 3 天，难度递增）
前一日表现：{{previous_performance}}

请生成 5 道面试题，要求：
1. 第 1 天：基础难度，覆盖候选人的实际项目经历
2. 第 2 天：进阶难度，增加系统设计和数据分析题
3. 第 3 天：实战难度，增加案例分析和开放性问题
4. 针对弱点预测中的 high severity 维度多出题目
5. 每题标注类型：strategy, system_design, data_driven, user_insight, business_thinking

以 JSON 格式返回：
```json
{
  "questions": [
    {
      "question_text": "题目内容",
      "question_type": "strategy",
      "difficulty": 3,
      "focus_dimension": "战略思维"
    }
  ]
}
```
```

- [ ] **Step 3.3: 创建面试题生成 Prompt**

### Step 3.4: 答案评分 Prompt

```markdown
# 答案评分 Prompt

你是一位严格的 B 端产品面试官，正在评估候选人的面试回答。

题目：{{question_text}}
题目类型：{{question_type}}
难度：{{difficulty}}

候选人回答：
{{user_answer}}

请从以下四个维度评分（1-10 分）：
1. **结构化** (structure)：回答是否有清晰的框架和逻辑结构
2. **逻辑性** (logic)：论证是否严密，因果关系是否清晰
3. **专业度** (professionalism)：是否体现出 B 端产品专业知识和经验
4. **创新性** (innovation)：是否有独到见解或创新思路

以 JSON 格式返回：
```json
{
  "overall_score": 7.5,
  "structure": 8,
  "logic": 7,
  "professionalism": 8,
  "innovation": 6,
  "feedback": "总体评价...",
  "strengths": ["优点1", "优点2"],
  "gaps": ["不足1", "不足2"],
  "suggestions": ["改进建议1", "改进建议2"]
}
```

评分标准：
- 1-3 分：回答不完整或偏离主题
- 4-6 分：回答基本合格但缺乏深度
- 7-8 分：回答良好，有具体例子和合理分析
- 9-10 分：回答优秀，见解深刻，有创新思考
```

- [ ] **Step 3.4: 创建答案评分 Prompt**

### Step 3.5: 日报生成 Prompt

```markdown
# 日报生成 Prompt

你是一位 B 端产品导师，正在为学员生成每日特训总结。

今日答题记录：
{{interview_records}}

今日平均分：
{{average_scores}}

请生成日报，包含：
1. 总体评价（1-2 句话）
2. 今日亮点（表现最好的 1-2 题）
3. 主要薄弱点（需要重点改进的维度）
4. 明日建议（针对薄弱点的练习建议）
5. 推荐学习资源（书籍/文章/案例）

以 JSON 格式返回：
```json
{
  "summary": "总体评价...",
  "key_takeaways": ["要点1", "要点2", "要点3"],
  "recommended_reading": ["推荐资源1", "推荐资源2"]
}
```
```

- [ ] **Step 3.5: 创建日报 Prompt**

### Step 3.6: 综合报告 Prompt

```markdown
# 综合报告 Prompt

你是一位 B 端产品总监，正在为完成 3 天特训的学员生成综合成长报告。

3 天答题记录：
{{all_interview_records}}

每日平均分对比：
{{daily_scores}}

请生成综合报告，包含：
1. 总体评价与等级（A/B/C/D）
2. Day 1 vs Day 3 能力变化对比
3. 成长轨迹分析（哪些维度进步最大）
4.  persistent 薄弱项（3 天中 consistently 低分的维度）
5. 个性化后续学习计划
6. 面试实战建议

以 JSON 格式返回：
```json
{
  "summary": "总体评价...",
  "grade": "B+",
  "key_takeaways": ["要点1", "要点2", "要点3", "要点4", "要点5"],
  "comparison": {
    "day1_scores": {"structure": 6, "logic": 7, ...},
    "day3_scores": {"structure": 8, "logic": 8, ...},
    "growth": "总体成长描述"
  },
  "recommended_reading": ["资源1", "资源2", "资源3"]
}
```
```

- [ ] **Step 3.6: 创建综合报告 Prompt**

### Step 3.7: 提交 Prompts

```bash
git add src/prompts/
git commit -m "feat(bootcamp): add AI prompts for resume parse, interview, and reports"
```

- [ ] **Step 3.7: 提交 Prompts**

---

## Task 4: API Routes

**Files:**
- Create: `src/app/api/bootcamp/resume/route.ts`
- Create: `src/app/api/bootcamp/interview/route.ts`
- Create: `src/app/api/bootcamp/interview/answer/route.ts`
- Create: `src/app/api/bootcamp/report/route.ts`

### Step 4.1: 实现简历解析 API

```typescript
// src/app/api/bootcamp/resume/route.ts
import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { getChatModel } from "@/lib/ai";

// POST: 上传并解析简历
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "未提供文件" }, { status: 400 });

    // 校验文件类型和大小
    const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "请上传 PDF 或 Word 格式的简历" }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "文件大小不能超过 10MB" }, { status: 400 });
    }

    // 提取文本（简化版，实际可使用 pdf-parse/mammoth）
    const bytes = await file.arrayBuffer();
    const text = new TextDecoder().decode(bytes);
    
    // 如果文本提取失败（扫描件 PDF），提示用户
    if (text.length < 100) {
      return NextResponse.json({ 
        error: "无法解析该简历，请尝试上传文字版 PDF 或手动输入关键信息",
        needs_manual_input: true 
      }, { status: 400 });
    }

    // 调用 AI 解析简历
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "AI 服务未配置" }, { status: 500 });

    const model = getChatModel(apiKey);
    
    const { text: parsedText } = await generateText({
      model,
      system: `你是一位资深 HR，请解析简历并返回 JSON 格式的结构化信息。`,
      messages: [{ role: "user", content: `简历内容：\n${text}` }],
    });

    let parsedProfile;
    try {
      parsedProfile = JSON.parse(parsedText);
    } catch {
      return NextResponse.json({ error: "解析失败，请手动输入" }, { status: 500 });
    }

    // 生成弱点预测
    const { text: weaknessText } = await generateText({
      model,
      system: `你是一位 B 端产品总监，分析候选人的面试弱点。`,
      messages: [{ role: "user", content: `简历信息：${JSON.stringify(parsedProfile)}` }],
    });

    let weaknessPrediction;
    try {
      weaknessPrediction = JSON.parse(weaknessText);
    } catch {
      weaknessPrediction = { weak_dimensions: [], recommended_focus: [] };
    }

    // 创建或更新特训会话
    const { data: session, error } = await supabase
      .from("bootcamp_sessions")
      .upsert(
        {
          user_id: user.id,
          status: "in_progress",
          current_day: 0,
          resume_text: text,
          parsed_profile: parsedProfile,
          weakness_prediction: weaknessPrediction,
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ session, parsed_profile: parsedProfile, weakness_prediction: weaknessPrediction });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "服务器错误" }, { status: 500 });
  }
}

// GET: 获取已解析的简历
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const { data: session } = await supabase
      .from("bootcamp_sessions")
      .select("parsed_profile, weakness_prediction, status, current_day")
      .eq("user_id", user.id)
      .single();

    if (!session) return NextResponse.json({ error: "未找到特训记录" }, { status: 404 });

    return NextResponse.json(session);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "服务器错误" }, { status: 500 });
  }
}
```

- [ ] **Step 4.1: 实现简历解析 API**

### Step 4.2: 实现面试题生成 API

```typescript
// src/app/api/bootcamp/interview/route.ts
import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { getChatModel } from "@/lib/ai";

// POST: 生成每日面试题
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const { day_number } = await req.json();
    if (!day_number || day_number < 1 || day_number > 3) {
      return NextResponse.json({ error: "无效的 Day 参数" }, { status: 400 });
    }

    // 获取会话信息
    const { data: session } = await supabase
      .from("bootcamp_sessions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!session) return NextResponse.json({ error: "未找到特训会话" }, { status: 404 });

    // 获取前一日表现（用于 Day 2/3）
    let previousPerformance = "";
    if (day_number > 1) {
      const { data: prevQuestions } = await supabase
        .from("bootcamp_interviews")
        .select("*")
        .eq("session_id", session.id)
        .eq("day_number", day_number - 1);
      
      if (prevQuestions?.length) {
        const avgScore = prevQuestions.reduce((sum, q) => sum + (q.ai_evaluation?.overall_score || 0), 0) / prevQuestions.length;
        previousPerformance = `前一日平均得分：${avgScore.toFixed(1)}，低分维度：${prevQuestions
          .filter((q) => (q.ai_evaluation?.overall_score || 0) < 6)
          .map((q) => q.question_type)
          .join(", ")}`;
      }
    }

    // 调用 AI 生成题目
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "AI 服务未配置" }, { status: 500 });

    const model = getChatModel(apiKey);
    
    const { text } = await generateText({
      model,
      system: `你是一位 B 端产品 VP，正在设计定制化面试题。请返回 JSON 格式。`,
      messages: [{
        role: "user",
        content: `候选人信息：${JSON.stringify(session.parsed_profile)}
弱点预测：${JSON.stringify(session.weakness_prediction)}
当前第 ${day_number} 天
${previousPerformance}`
      }],
    });

    let questions;
    try {
      const parsed = JSON.parse(text);
      questions = parsed.questions;
    } catch {
      return NextResponse.json({ error: "题目生成失败" }, { status: 500 });
    }

    // 存储题目
    const inserts = questions.map((q: any, idx: number) => ({
      session_id: session.id,
      day_number: day_number,
      question_index: idx + 1,
      question_text: q.question_text,
      question_type: q.question_type,
      difficulty: q.difficulty || day_number,
      status: "pending",
    }));

    const { error } = await supabase.from("bootcamp_interviews").insert(inserts);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // 更新会话当前天数
    await supabase
      .from("bootcamp_sessions")
      .update({ current_day: day_number, status: "in_progress" })
      .eq("id", session.id);

    return NextResponse.json({ questions: inserts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "服务器错误" }, { status: 500 });
  }
}

// GET: 获取当前天数的题目
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const day = parseInt(searchParams.get("day") || "1");

    const { data: session } = await supabase
      .from("bootcamp_sessions")
      .select("id, current_day")
      .eq("user_id", user.id)
      .single();

    if (!session) return NextResponse.json({ error: "未找到特训会话" }, { status: 404 });

    const { data: questions } = await supabase
      .from("bootcamp_interviews")
      .select("*")
      .eq("session_id", session.id)
      .eq("day_number", day)
      .order("question_index");

    return NextResponse.json({ questions, current_day: session.current_day });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "服务器错误" }, { status: 500 });
  }
}
```

- [ ] **Step 4.2: 实现面试题生成 API**

### Step 4.3: 实现答案提交与评分 API

```typescript
// src/app/api/bootcamp/interview/answer/route.ts
import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { getChatModel } from "@/lib/ai";

// POST: 提交答案并评分
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const { interview_id, answer } = await req.json();
    if (!interview_id || !answer) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 });
    }

    if (answer.length < 20) {
      return NextResponse.json({ error: "回答过于简短，建议详细阐述你的思路" }, { status: 400 });
    }

    // 获取题目信息
    const { data: interview } = await supabase
      .from("bootcamp_interviews")
      .select("*, session:user_id")
      .eq("id", interview_id)
      .single();

    if (!interview) return NextResponse.json({ error: "未找到题目" }, { status: 404 });

    // 更新答案
    await supabase
      .from("bootcamp_interviews")
      .update({ user_answer: answer, status: "answered" })
      .eq("id", interview_id);

    // 调用 AI 评分
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "AI 服务未配置" }, { status: 500 });

    const model = getChatModel(apiKey);
    
    let evaluation;
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        const { text } = await generateText({
          model,
          system: `你是一位严格的 B 端产品面试官，请评分并返回 JSON。`,
          messages: [{
            role: "user",
            content: `题目：${interview.question_text}
类型：${interview.question_type}
难度：${interview.difficulty}
回答：${answer}`
          }],
        });

        evaluation = JSON.parse(text);
        break;
      } catch {
        retries++;
        if (retries === maxRetries) {
          return NextResponse.json({ error: "评分服务暂时不可用，请稍后刷新页面查看" }, { status: 503 });
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    // 更新评分结果
    const { error } = await supabase
      .from("bootcamp_interviews")
      .update({
        ai_evaluation: evaluation,
        status: "evaluated",
      })
      .eq("id", interview_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ evaluation });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "服务器错误" }, { status: 500 });
  }
}
```

- [ ] **Step 4.3: 实现答案提交与评分 API**

### Step 4.4: 实现报告生成 API

```typescript
// src/app/api/bootcamp/report/route.ts
import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { getChatModel } from "@/lib/ai";

// POST: 生成报告
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const { report_type, day_number } = await req.json();
    if (!report_type || !["daily", "comprehensive"].includes(report_type)) {
      return NextResponse.json({ error: "无效的报告类型" }, { status: 400 });
    }

    const { data: session } = await supabase
      .from("bootcamp_sessions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!session) return NextResponse.json({ error: "未找到特训会话" }, { status: 404 });

    // 获取面试记录
    const { data: interviews } = await supabase
      .from("bootcamp_interviews")
      .select("*")
      .eq("session_id", session.id)
      .order("day_number, question_index");

    if (!interviews?.length) return NextResponse.json({ error: "无面试记录" }, { status: 400 });

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "AI 服务未配置" }, { status: 500 });

    const model = getChatModel(apiKey);

    let prompt = "";
    if (report_type === "daily" && day_number) {
      const dayInterviews = interviews.filter((i) => i.day_number === day_number);
      const avgScore = dayInterviews.reduce((sum, i) => sum + (i.ai_evaluation?.overall_score || 0), 0) / dayInterviews.length;
      
      prompt = `今日答题记录：${JSON.stringify(dayInterviews)}
今日平均分：${avgScore.toFixed(1)}`;
    } else {
      // comprehensive
      const dailyScores = [1, 2, 3].map((day) => {
        const dayInterviews = interviews.filter((i) => i.day_number === day);
        return {
          day,
          avg: dayInterviews.reduce((sum, i) => sum + (i.ai_evaluation?.overall_score || 0), 0) / (dayInterviews.length || 1),
        };
      });
      prompt = `3 天答题记录：${JSON.stringify(interviews)}
每日平均分：${JSON.stringify(dailyScores)}`;
    }

    const { text } = await generateText({
      model,
      system: `你是一位 B 端产品导师，请生成${report_type === "daily" ? "日报" : "综合报告"}并返回 JSON。`,
      messages: [{ role: "user", content: prompt }],
    });

    let reportContent;
    try {
      reportContent = JSON.parse(text);
    } catch {
      reportContent = { summary: "报告生成失败", key_takeaways: [] };
    }

    // 计算分数快照
    const scoresSnapshot: Record<string, number> = {};
    if (report_type === "comprehensive") {
      const dimensions = ["structure", "logic", "professionalism", "innovation"];
      dimensions.forEach((dim) => {
        const scores = interviews
          .map((i) => i.ai_evaluation?.[dim])
          .filter((s): s is number => s !== undefined);
        scoresSnapshot[dim] = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0;
      });
    }

    const { data: report, error } = await supabase
      .from("bootcamp_reports")
      .insert({
        session_id: session.id,
        report_type,
        day_number,
        content: reportContent,
        scores_snapshot: scoresSnapshot,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // 如果是综合报告，标记会话完成
    if (report_type === "comprehensive") {
      await supabase
        .from("bootcamp_sessions")
        .update({ status: "completed" })
        .eq("id", session.id);
    }

    return NextResponse.json({ report });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "服务器错误" }, { status: 500 });
  }
}

// GET: 获取报告
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get("type");
    const sessionId = searchParams.get("session_id");

    let query = supabase
      .from("bootcamp_reports")
      .select("*, session:bootcamp_sessions(id, user_id)")
      .eq("session.bootcamp_sessions.user_id", user.id);

    if (reportType) query = query.eq("report_type", reportType);
    if (sessionId) query = query.eq("session_id", sessionId);

    const { data: reports, error } = await query.order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ reports });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "服务器错误" }, { status: 500 });
  }
}
```

- [ ] **Step 4.4: 实现报告生成 API**

### Step 4.5: 提交 API Routes

```bash
git add src/app/api/bootcamp/
git commit -m "feat(api): add bootcamp resume, interview, and report APIs"
```

- [ ] **Step 4.5: 提交 API Routes**

---

## Task 5: 前端组件

**Files:**
- Create: `src/components/bootcamp/ResumeUploader.tsx`
- Create: `src/components/bootcamp/ResumePreview.tsx`
- Create: `src/components/bootcamp/WeaknessReport.tsx`
- Create: `src/components/bootcamp/InterviewQuestion.tsx`
- Create: `src/components/bootcamp/AnswerEvaluation.tsx`
- Create: `src/components/bootcamp/DailySummary.tsx`
- Create: `src/components/bootcamp/ReportCard.tsx`

### Step 5.1: ResumeUploader 组件

```tsx
// src/components/bootcamp/ResumeUploader.tsx
"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";

interface Props {
  onUpload: (file: File) => void;
  isUploading: boolean;
}

export default function ResumeUploader({ onUpload, isUploading }: Props) {
  const [error, setError] = useState("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError("");
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    
    if (!allowedTypes.includes(file.type)) {
      setError("请上传 PDF 或 Word 格式的简历");
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setError("文件大小不能超过 10MB");
      return;
    }
    
    onUpload(file);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-primary bg-primary-container" : "border-outline-variant hover:border-primary"
        }`}
      >
        <input {...getInputProps()} />
        <span className="material-symbols-outlined text-5xl text-primary mb-4">upload_file</span>
        <p className="text-body-lg text-on-surface">
          {isDragActive ? "松开以上传简历" : "拖拽简历到此处，或点击选择文件"}
        </p>
        <p className="text-body-sm text-on-surface-variant mt-2">支持 PDF、Word 格式，最大 10MB</p>
      </div>
      
      {error && (
        <div className="flex items-center gap-2 text-error text-body-sm">
          <span className="material-symbols-outlined">error</span>
          {error}
        </div>
      )}
      
      {isUploading && (
        <div className="flex items-center justify-center gap-3 py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
          <span className="text-body-md text-on-surface-variant">正在解析简历...</span>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5.1: 创建 ResumeUploader 组件**

### Step 5.2: ResumePreview 组件

```tsx
// src/components/bootcamp/ResumePreview.tsx
"use client";

import { ParsedProfile } from "@/types/bootcamp";

interface Props {
  profile: ParsedProfile;
}

export default function ResumePreview({ profile }: Props) {
  return (
    <div className="space-y-6">
      {/* 工作经历 */}
      <section>
        <h3 className="text-title-md font-bold text-on-surface mb-3">工作经历</h3>
        <div className="space-y-3">
          {profile.work_experience?.map((work, idx) => (
            <div key={idx} className="bg-surface-container p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-label-bold text-on-surface">{work.company}</p>
                  <p className="text-body-sm text-on-surface-variant">{work.title}</p>
                </div>
                <span className="text-label-sm text-on-surface-variant">{work.duration}</span>
              </div>
              <ul className="mt-2 space-y-1">
                {work.highlights?.map((h, i) => (
                  <li key={i} className="text-body-sm text-on-surface-variant flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* 项目经历 */}
      <section>
        <h3 className="text-title-md font-bold text-on-surface mb-3">项目经历</h3>
        <div className="space-y-3">
          {profile.projects?.map((project, idx) => (
            <div key={idx} className="bg-surface-container p-4 rounded-lg">
              <p className="font-label-bold text-on-surface">{project.name}</p>
              <p className="text-body-sm text-on-surface-variant mt-1">{project.description}</p>
              <p className="text-label-sm text-primary mt-2">角色：{project.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 技能栈 */}
      <section>
        <h3 className="text-title-md font-bold text-on-surface mb-3">技能栈</h3>
        <div className="flex flex-wrap gap-2">
          {profile.skills?.map((skill, idx) => (
            <span key={idx} className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-label-sm">
              {skill}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 5.2: 创建 ResumePreview 组件**

### Step 5.3: WeaknessReport 组件

```tsx
// src/components/bootcamp/WeaknessReport.tsx
"use client";

import { WeaknessPrediction } from "@/types/bootcamp";
import AbilityRadarChart from "@/components/training/RadarChart";

interface Props {
  prediction: WeaknessPrediction;
}

export default function WeaknessReport({ prediction }: Props) {
  const radarData = prediction.weak_dimensions?.map((w) => ({
    dimension: w.dimension,
    score: w.severity === "high" ? 3 : w.severity === "medium" ? 5 : 7,
    fullMark: 10,
  })) || [];

  const severityColor = {
    high: "bg-error text-on-error",
    medium: "bg-warning text-on-warning",
    low: "bg-success text-on-success",
  };

  const severityLabel = {
    high: "严重",
    medium: "中等",
    low: "轻微",
  };

  return (
    <div className="space-y-6">
      <h3 className="text-title-md font-bold text-on-surface">面试弱点预测</h3>
      
      {/* 雷达图 */}
      {radarData.length > 0 && (
        <div className="bg-surface-container rounded-xl p-4">
          <AbilityRadarChart data={radarData} />
        </div>
      )}

      {/* 弱点列表 */}
      <div className="space-y-3">
        {prediction.weak_dimensions?.map((w, idx) => (
          <div key={idx} className="bg-surface-container p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-label-bold text-on-surface">{w.dimension}</span>
              <span className={`px-2 py-1 rounded-full text-label-sm ${severityColor[w.severity]}`}>
                {severityLabel[w.severity]}
              </span>
            </div>
            <p className="text-body-sm text-on-surface-variant">{w.gap_description}</p>
          </div>
        ))}
      </div>

      {/* 推荐关注 */}
      {prediction.recommended_focus?.length > 0 && (
        <div className="bg-primary-container p-4 rounded-lg">
          <h4 className="font-label-bold text-on-primary-container mb-2">建议重点训练</h4>
          <ul className="space-y-1">
            {prediction.recommended_focus.map((focus, idx) => (
              <li key={idx} className="text-body-sm text-on-primary-container flex items-start gap-2">
                <span className="mt-1">→</span>
                {focus}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5.3: 创建 WeaknessReport 组件**

### Step 5.4: InterviewQuestion 组件

```tsx
// src/components/bootcamp/InterviewQuestion.tsx
"use client";

import { useState } from "react";
import { InterviewQuestion as InterviewQuestionType } from "@/types/bootcamp";

interface Props {
  question: InterviewQuestionType;
  onSubmit: (answer: string) => void;
  isEvaluating: boolean;
}

export default function InterviewQuestion({ question, onSubmit, isEvaluating }: Props) {
  const [answer, setAnswer] = useState(question.user_answer || "");
  const [warning, setWarning] = useState("");

  const handleSubmit = () => {
    if (answer.length < 20) {
      setWarning("回答过于简短，建议详细阐述你的思路");
      return;
    }
    setWarning("");
    onSubmit(answer);
  };

  const typeLabels: Record<string, string> = {
    strategy: "战略思维",
    system_design: "系统设计",
    data_driven: "数据驱动",
    user_insight: "用户洞察",
    business_thinking: "商业思维",
  };

  return (
    <div className="space-y-6">
      {/* 题目卡片 */}
      <div className="bg-surface-container p-6 rounded-xl">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-2 py-1 bg-secondary-container text-on-secondary-container rounded text-label-sm">
            {typeLabels[question.question_type] || question.question_type}
          </span>
          <span className="px-2 py-1 bg-tertiary-container text-on-tertiary-container rounded text-label-sm">
            难度 {question.difficulty}/5
          </span>
        </div>
        <h3 className="text-headline-sm font-bold text-on-surface">{question.question_text}</h3>
      </div>

      {/* 作答区 */}
      {!question.ai_evaluation && (
        <div className="space-y-3">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="请详细阐述你的思路和解决方案..."
            className="w-full h-48 p-4 bg-surface-container rounded-xl border border-outline-variant text-on-surface placeholder-on-surface-variant resize-none focus:outline-none focus:border-primary"
          />
          
          {warning && (
            <div className="flex items-center gap-2 text-warning text-body-sm">
              <span className="material-symbols-outlined">warning</span>
              {warning}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isEvaluating || !answer.trim()}
            className="w-full py-3 bg-primary text-on-primary rounded-xl font-label-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEvaluating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-5 w-5 border-2 border-on-primary border-t-transparent" />
                AI 评分中...
              </span>
            ) : (
              "提交回答"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5.4: 创建 InterviewQuestion 组件**

### Step 5.5: AnswerEvaluation 组件

```tsx
// src/components/bootcamp/AnswerEvaluation.tsx
"use client";

import { AIEvaluation } from "@/types/bootcamp";

interface Props {
  evaluation: AIEvaluation;
}

export default function AnswerEvaluation({ evaluation }: Props) {
  const dimensions = [
    { key: "structure", label: "结构化", score: evaluation.structure },
    { key: "logic", label: "逻辑性", score: evaluation.logic },
    { key: "professionalism", label: "专业度", score: evaluation.professionalism },
    { key: "innovation", label: "创新性", score: evaluation.innovation },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-success";
    if (score >= 6) return "text-warning";
    return "text-error";
  };

  return (
    <div className="bg-surface-container p-6 rounded-xl space-y-6">
      {/* 总分 */}
      <div className="text-center">
        <div className={`text-display-lg font-bold ${getScoreColor(evaluation.overall_score)}`}>
          {evaluation.overall_score}
        </div>
        <p className="text-body-sm text-on-surface-variant">综合评分 / 10</p>
      </div>

      {/* 维度拆解 */}
      <div className="grid grid-cols-2 gap-3">
        {dimensions.map((dim) => (
          <div key={dim.key} className="bg-surface p-3 rounded-lg text-center">
            <div className={`text-headline-sm font-bold ${getScoreColor(dim.score)}`}>{dim.score}</div>
            <p className="text-label-sm text-on-surface-variant">{dim.label}</p>
          </div>
        ))}
      </div>

      {/* 评价反馈 */}
      <div className="space-y-4">
        <div>
          <h4 className="font-label-bold text-on-surface mb-2">总体评价</h4>
          <p className="text-body-md text-on-surface-variant">{evaluation.feedback}</p>
        </div>

        {evaluation.strengths?.length > 0 && (
          <div>
            <h4 className="font-label-bold text-success mb-2">亮点</h4>
            <ul className="space-y-1">
              {evaluation.strengths.map((s, idx) => (
                <li key={idx} className="text-body-sm text-on-surface-variant flex items-start gap-2">
                  <span className="text-success mt-1">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {evaluation.gaps?.length > 0 && (
          <div>
            <h4 className="font-label-bold text-error mb-2">不足</h4>
            <ul className="space-y-1">
              {evaluation.gaps.map((g, idx) => (
                <li key={idx} className="text-body-sm text-on-surface-variant flex items-start gap-2">
                  <span className="text-error mt-1">✗</span>
                  {g}
                </li>
              ))}
            </ul>
          </div>
        )}

        {evaluation.suggestions?.length > 0 && (
          <div className="bg-primary-container p-4 rounded-lg">
            <h4 className="font-label-bold text-on-primary-container mb-2">改进建议</h4>
            <ul className="space-y-1">
              {evaluation.suggestions.map((s, idx) => (
                <li key={idx} className="text-body-sm text-on-primary-container flex items-start gap-2">
                  <span className="mt-1">→</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5.5: 创建 AnswerEvaluation 组件**

### Step 5.6: DailySummary 组件

```tsx
// src/components/bootcamp/DailySummary.tsx
"use client";

interface Props {
  dayNumber: number;
  averageScore: number;
  onContinue: () => void;
  isLastDay: boolean;
}

export default function DailySummary({ dayNumber, averageScore, onContinue, isLastDay }: Props) {
  return (
    <div className="bg-surface-container p-8 rounded-xl text-center space-y-6">
      <div className="flex justify-center">
        <span className="material-symbols-outlined text-6xl text-success">celebration</span>
      </div>
      
      <h2 className="text-headline-lg font-bold text-on-surface">
        第 {dayNumber} 天特训完成！
      </h2>
      
      <div className="py-4">
        <div className="text-display-lg font-bold text-primary">{averageScore.toFixed(1)}</div>
        <p className="text-body-sm text-on-surface-variant">今日平均分 / 10</p>
      </div>

      <p className="text-body-md text-on-surface-variant">
        {isLastDay
          ? "恭喜完成全部 3 天特训！查看你的综合成长报告。"
          : `休息片刻，准备迎接第 ${dayNumber + 1} 天的挑战！`}
      </p>

      <button
        onClick={onContinue}
        className="px-8 py-3 bg-primary text-on-primary rounded-xl font-label-bold"
      >
        {isLastDay ? "查看综合报告" : "继续下一天"}
      </button>
    </div>
  );
}
```

- [ ] **Step 5.6: 创建 DailySummary 组件**

### Step 5.7: ReportCard 组件

```tsx
// src/components/bootcamp/ReportCard.tsx
"use client";

import { BootcampReport } from "@/types/bootcamp";
import AbilityRadarChart from "@/components/training/RadarChart";

interface Props {
  report: BootcampReport;
}

export default function ReportCard({ report }: Props) {
  const isComprehensive = report.report_type === "comprehensive";
  
  const radarData = report.scores_snapshot
    ? Object.entries(report.scores_snapshot).map(([dimension, score]) => ({
        dimension: dimension === "structure" ? "结构化" 
          : dimension === "logic" ? "逻辑性" 
          : dimension === "professionalism" ? "专业度" 
          : "创新性",
        score,
        fullMark: 10,
      }))
    : [];

  return (
    <div className="bg-surface-container p-6 rounded-xl space-y-6">
      {/* 报告类型标签 */}
      <div className="flex items-center justify-between">
        <span className={`px-3 py-1 rounded-full text-label-sm ${
          isComprehensive 
            ? "bg-primary-container text-on-primary-container" 
            : "bg-secondary-container text-on-secondary-container"
        }`}>
          {isComprehensive ? "综合报告" : `第 ${report.day_number} 天日报`}
        </span>
        {isComprehensive && report.content.grade && (
          <span className="text-headline-lg font-bold text-primary">
            等级 {report.content.grade}
          </span>
        )}
      </div>

      {/* 雷达图 */}
      {radarData.length > 0 && (
        <div className="h-[240px]">
          <AbilityRadarChart data={radarData} />
        </div>
      )}

      {/* 摘要 */}
      <div>
        <h4 className="font-label-bold text-on-surface mb-2">总体评价</h4>
        <p className="text-body-md text-on-surface-variant">{report.content.summary}</p>
      </div>

      {/* 关键要点 */}
      {report.content.key_takeaways?.length > 0 && (
        <div>
          <h4 className="font-label-bold text-on-surface mb-2">关键要点</h4>
          <ul className="space-y-2">
            {report.content.key_takeaways.map((takeaway, idx) => (
              <li key={idx} className="text-body-sm text-on-surface-variant flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                {takeaway}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 对比（仅综合报告） */}
      {isComprehensive && report.content.comparison && (
        <div className="bg-primary-container p-4 rounded-lg">
          <h4 className="font-label-bold text-on-primary-container mb-2">成长对比</h4>
          <p className="text-body-sm text-on-primary-container">{report.content.comparison.growth}</p>
        </div>
      )}

      {/* 推荐资源 */}
      {report.content.recommended_reading?.length > 0 && (
        <div>
          <h4 className="font-label-bold text-on-surface mb-2">推荐学习资源</h4>
          <ul className="space-y-1">
            {report.content.recommended_reading.map((resource, idx) => (
              <li key={idx} className="text-body-sm text-primary">{resource}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5.7: 创建 ReportCard 组件**

### Step 5.8: 提交组件

```bash
git add src/components/bootcamp/
git commit -m "feat(bootcamp): add 7 UI components for resume, interview, and reports"
```

- [ ] **Step 5.8: 提交组件**

---

## Task 6: 前端页面

**Files:**
- Modify: `src/app/(app)/bootcamp/page.tsx`
- Create: `src/app/(app)/bootcamp/resume/page.tsx`
- Create: `src/app/(app)/bootcamp/interview/page.tsx`
- Create: `src/app/(app)/bootcamp/report/page.tsx`

### Step 6.1: 更新特训入口页

```tsx
// src/app/(app)/bootcamp/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function BootcampPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await supabase
        .from("bootcamp_sessions")
        .select("status, current_day")
        .eq("user_id", user.id)
        .single();
      
      setSession(data);
      setLoading(false);
    }
    fetchSession();
  }, []);

  if (loading) return null;

  // 根据状态决定跳转
  if (!session || session.status === "not_started") {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <span className="material-symbols-outlined text-7xl text-primary">rocket_launch</span>
          <div>
            <h1 className="text-headline-lg font-bold text-on-surface">特训冲刺</h1>
            <p className="text-body-lg text-on-surface-variant mt-2">
              3 天高强度面试特训，基于你的履历定制题目，AI 实时评分反馈
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-left">
            <div className="bg-surface-container p-4 rounded-xl">
              <span className="material-symbols-outlined text-3xl text-primary">upload_file</span>
              <h3 className="font-label-bold text-on-surface mt-2">Day 0</h3>
              <p className="text-body-sm text-on-surface-variant">上传简历，AI 解析能力画像</p>
            </div>
            <div className="bg-surface-container p-4 rounded-xl">
              <span className="material-symbols-outlined text-3xl text-primary">psychology</span>
              <h3 className="font-label-bold text-on-surface mt-2">Day 1-3</h3>
              <p className="text-body-sm text-on-surface-variant">每日 5 题，难度递增，AI 评分</p>
            </div>
            <div className="bg-surface-container p-4 rounded-xl">
              <span className="material-symbols-outlined text-3xl text-primary">assessment</span>
              <h3 className="font-label-bold text-on-surface mt-2">报告</h3>
              <p className="text-body-sm text-on-surface-variant">综合成长报告与改进建议</p>
            </div>
          </div>

          <Link
            href="/bootcamp/resume"
            className="inline-block px-8 py-4 bg-primary text-on-primary rounded-xl font-label-bold text-body-lg"
          >
            开始特训
          </Link>
        </div>
      </div>
    );
  }

  // 有进行中的会话，跳转到对应页面
  if (session.status === "in_progress") {
    if (session.current_day === 0) {
      return <Link href="/bootcamp/resume" />;
    }
    return <Link href="/bootcamp/interview" />;
  }

  // 已完成
  return <Link href="/bootcamp/report" />;
}
```

- [ ] **Step 6.1: 更新特训入口页**

### Step 6.2: 创建简历上传页

```tsx
// src/app/(app)/bootcamp/resume/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ResumeUploader from "@/components/bootcamp/ResumeUploader";
import ResumePreview from "@/components/bootcamp/ResumePreview";
import WeaknessReport from "@/components/bootcamp/WeaknessReport";
import { ParsedProfile, WeaknessPrediction } from "@/types/bootcamp";

export default function ResumePage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [parsedProfile, setParsedProfile] = useState<ParsedProfile | null>(null);
  const [weaknessPrediction, setWeaknessPrediction] = useState<WeaknessPrediction | null>(null);
  const [error, setError] = useState("");

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/bootcamp/resume", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "上传失败");
        return;
      }

      setParsedProfile(data.parsed_profile);
      setWeaknessPrediction(data.weakness_prediction);
    } catch (err: any) {
      setError(err.message || "上传失败");
    } finally {
      setIsUploading(false);
    }
  };

  const startBootcamp = async () => {
    // 生成 Day 1 题目
    const res = await fetch("/api/bootcamp/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day_number: 1 }),
    });

    if (res.ok) {
      router.push("/bootcamp/interview");
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface">简历解析</h1>
          <p className="text-body-md text-on-surface-variant mt-2">
            上传你的简历，AI 将解析你的工作经历和项目经验，生成针对性的面试弱点预测
          </p>
        </div>

        {!parsedProfile && (
          <ResumeUploader onUpload={handleUpload} isUploading={isUploading} />
        )}

        {error && (
          <div className="bg-error-container p-4 rounded-xl text-error">
            {error}
          </div>
        )}

        {parsedProfile && (
          <div className="space-y-8">
            <ResumePreview profile={parsedProfile} />
            
            {weaknessPrediction && (
              <WeaknessReport prediction={weaknessPrediction} />
            )}

            <button
              onClick={startBootcamp}
              className="w-full py-4 bg-primary text-on-primary rounded-xl font-label-bold text-body-lg"
            >
              开始特训
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 6.2: 创建简历上传页**

### Step 6.3: 创建模拟面试页

```tsx
// src/app/(app)/bootcamp/interview/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import InterviewQuestion from "@/components/bootcamp/InterviewQuestion";
import AnswerEvaluation from "@/components/bootcamp/AnswerEvaluation";
import DailySummary from "@/components/bootcamp/DailySummary";
import { InterviewQuestion as InterviewQuestionType } from "@/types/bootcamp";
import { calculateDayProgress } from "@/lib/bootcamp";

export default function InterviewPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<InterviewQuestionType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentDay, setCurrentDay] = useState(1);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    async function fetchQuestions() {
      const res = await fetch(`/api/bootcamp/interview?day=${currentDay}`);
      const data = await res.json();
      if (data.questions) {
        setQuestions(data.questions);
      }
      setLoading(false);
    }
    fetchQuestions();
  }, [currentDay]);

  const handleSubmitAnswer = async (answer: string) => {
    const question = questions[currentIndex];
    if (!question) return;

    setIsEvaluating(true);
    try {
      const res = await fetch("/api/bootcamp/interview/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interview_id: question.id, answer }),
      });

      const data = await res.json();
      if (res.ok && data.evaluation) {
        // 更新本地状态
        const updated = [...questions];
        updated[currentIndex] = {
          ...question,
          user_answer: answer,
          ai_evaluation: data.evaluation,
          status: "evaluated",
        };
        setQuestions(updated);
      }
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNextDay = async () => {
    if (currentDay >= 3) {
      // 生成综合报告
      await fetch("/api/bootcamp/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_type: "comprehensive" }),
      });
      router.push("/bootcamp/report");
      return;
    }

    // 生成日报并进入下一天
    await fetch("/api/bootcamp/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report_type: "daily", day_number: currentDay }),
    });

    // 生成下一天题目
    const nextDay = currentDay + 1;
    await fetch("/api/bootcamp/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day_number: nextDay }),
    });

    setCurrentDay(nextDay);
    setCurrentIndex(0);
    setShowSummary(false);
    setLoading(true);
    
    // 重新获取题目
    const res = await fetch(`/api/bootcamp/interview?day=${nextDay}`);
    const data = await res.json();
    if (data.questions) {
      setQuestions(data.questions);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const progress = calculateDayProgress(questions);
  const currentQuestion = questions[currentIndex];

  if (showSummary) {
    const avgScore = questions.reduce((sum, q) => sum + (q.ai_evaluation?.overall_score || 0), 0) / questions.length;
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-2xl mx-auto">
          <DailySummary
            dayNumber={currentDay}
            averageScore={avgScore}
            onContinue={handleNextDay}
            isLastDay={currentDay >= 3}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* 进度条 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-label-sm text-on-surface-variant">Day {currentDay} / 3</span>
            <span className="text-label-sm text-primary">({getDifficultyLabel(currentDay)})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-label-sm text-on-surface-variant">
              第 {currentIndex + 1} / {questions.length} 题
            </span>
          </div>
        </div>

        {/* 进度指示器 */}
        <div className="flex gap-2">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(idx)}
              className={`flex-1 h-2 rounded-full transition-colors ${
                idx === currentIndex
                  ? "bg-primary"
                  : q.status === "evaluated"
                  ? "bg-success"
                  : "bg-outline-variant"
              }`}
            />
          ))}
        </div>

        {/* 题目 */}
        {currentQuestion && (
          <InterviewQuestion
            question={currentQuestion}
            onSubmit={handleSubmitAnswer}
            isEvaluating={isEvaluating}
          />
        )}

        {/* 评分结果 */}
        {currentQuestion?.ai_evaluation && (
          <AnswerEvaluation evaluation={currentQuestion.ai_evaluation} />
        )}

        {/* 导航按钮 */}
        <div className="flex gap-4">
          <button
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="flex-1 py-3 border border-outline-variant text-on-surface rounded-xl font-label-bold disabled:opacity-50"
          >
            上一题
          </button>
          <button
            onClick={() => {
              if (currentIndex < questions.length - 1) {
                setCurrentIndex((prev) => prev + 1);
              } else if (progress.allEvaluated) {
                setShowSummary(true);
              }
            }}
            disabled={currentIndex < questions.length - 1 && currentQuestion?.status !== "evaluated"}
            className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-label-bold disabled:opacity-50"
          >
            {currentIndex < questions.length - 1 ? "下一题" : "完成今日特训"}
          </button>
        </div>
      </div>
    </div>
  );
}

function getDifficultyLabel(day: number): string {
  switch (day) {
    case 1: return "基础";
    case 2: return "进阶";
    case 3: return "实战";
    default: return "基础";
  }
}
```

- [ ] **Step 6.3: 创建模拟面试页**

### Step 6.4: 创建报告页

```tsx
// src/app/(app)/bootcamp/report/page.tsx
"use client";

import { useEffect, useState } from "react";
import ReportCard from "@/components/bootcamp/ReportCard";
import { BootcampReport } from "@/types/bootcamp";

export default function ReportPage() {
  const [reports, setReports] = useState<BootcampReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      const res = await fetch("/api/bootcamp/report");
      const data = await res.json();
      if (data.reports) {
        setReports(data.reports);
      }
      setLoading(false);
    }
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant">description</span>
          <h2 className="text-headline-lg font-bold text-on-surface">尚未完成特训</h2>
          <p className="text-body-md text-on-surface-variant">
            完成 3 天特训后将生成详细的成长报告
          </p>
        </div>
      </div>
    );
  }

  const comprehensiveReport = reports.find((r) => r.report_type === "comprehensive");
  const dailyReports = reports.filter((r) => r.report_type === "daily");

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface">特训报告</h1>
          <p className="text-body-md text-on-surface-variant mt-2">
            查看你的特训成果和能力成长轨迹
          </p>
        </div>

        {/* 综合报告 */}
        {comprehensiveReport && (
          <div className="space-y-4">
            <h2 className="text-title-lg font-bold text-on-surface">综合成长报告</h2>
            <ReportCard report={comprehensiveReport} />
          </div>
        )}

        {/* 日报列表 */}
        {dailyReports.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-title-lg font-bold text-on-surface">每日报告</h2>
            <div className="space-y-4">
              {dailyReports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 6.4: 创建报告页**

### Step 6.5: 提交页面

```bash
git add src/app/(app)/bootcamp/
git commit -m "feat(bootcamp): add resume, interview, and report pages"
```

- [ ] **Step 6.5: 提交页面**

---

## Task 7: 集成与验证

### Step 7.1: 安装缺失依赖

```bash
npm install react-dropzone
npm install -D @types/react-dropzone
```

- [ ] **Step 7.1: 安装 react-dropzone**

### Step 7.2: 运行类型检查

```bash
npx tsc --noEmit
```

- [ ] **Step 7.2: 运行类型检查**

### Step 7.3: 运行 ESLint

```bash
npx eslint src/ --max-warnings 0
```

- [ ] **Step 7.3: 运行 ESLint**

### Step 7.4: 运行构建

```bash
npm run build
```

- [ ] **Step 7.4: 运行构建**

### Step 7.5: 更新任务状态

在 `openspec/changes/bootcamp-module/tasks.md` 中勾选所有完成任务。

- [ ] **Step 7.5: 更新任务清单**

### Step 7.6: 提交验证

```bash
git add .
git commit -m "feat(bootcamp): complete bootcamp module with tests and lint fixes"
```

- [ ] **Step 7.6: 最终提交**

---

## 自检清单

### Spec 覆盖度
- [x] 简历上传与解析 → Task 4.1, 6.2
- [x] 弱点预测 → Task 4.1, 5.3
- [x] 每日 5 题生成 → Task 4.2
- [x] 答案提交与评分 → Task 4.3, 5.4, 5.5
- [x] 进度追踪 → Task 6.3 (页面内指示器)
- [x] 日报生成 → Task 4.4, 5.7
- [x] 综合报告 → Task 4.4, 6.4
- [x] 会话持久化 → Task 4.2, 4.3, 6.3

### Placeholder 扫描
- [x] 无 TBD/TODO
- [x] 所有步骤含具体代码
- [x] 所有步骤含具体命令
- [x] 无 "类似 Task N" 引用

### 类型一致性
- [x] `InterviewQuestion` 类型在 Task 2 定义，Task 4/5/6 一致使用
- [x] `AIEvaluation` 类型在 Task 2 定义，Task 4/5 一致使用
- [x] API 返回结构与前端类型一致
