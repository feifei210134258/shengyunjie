---
archived-with: 2026-05-25-training-enhancement
status: final
---
# 训练功能完善 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 streak 真实数据、训练 session 闭环、AI 评分体系、历史答题回顾、能力雷达图、题目难度标注与去重、题目质量反馈

**Architecture:** 在现有训练模块基础上增量完善，复用现有数据库表（training_records.score、training_sessions.questions），通过修改 API prompt 和新增轻量 API 实现。前端新增 recharts 雷达图和历史详情页。

**Tech Stack:** Next.js 15 (App Router), React, TypeScript, Tailwind CSS, Supabase, Vercel AI SDK, recharts

---

change: training-enhancement
design-doc: docs/superpowers/specs/2026-05-25-training-enhancement-design.md
base-ref: 108d45eafba4b8d5bdb03c73b1b45b581faa1af5

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/app/api/train/route.ts` | Modify | 生成 prompt 增加难度标注；分析 prompt 增加评分指令 |
| `src/app/api/training/stats/route.ts` | Modify | 增加 streak 计算、各维度平均分 |
| `src/app/api/training/sessions/route.ts` | Modify | 增加 POST 接口（session 闭环） |
| `src/app/api/training/record/route.ts` | Modify | 保存评分到 score 字段 |
| `src/app/api/training/history/[id]/route.ts` | Create | 单条历史记录查询 |
| `src/app/api/training/feedback/route.ts` | Create | 题目质量反馈接收 |
| `src/app/(app)/training/page.tsx` | Modify | 真实 streak、雷达图、历史记录可点击 |
| `src/app/(app)/training/session/page.tsx` | Modify | 评分展示、难度标签、反馈按钮、session 闭环调用 |
| `src/app/(app)/training/history/[id]/page.tsx` | Create | 历史答题详情页 |
| `src/components/training/RadarChart.tsx` | Create | 能力雷达图组件 |
| `src/lib/training/similarity.ts` | Create | 文本相似度计算工具 |
| `supabase/migrations/20260525_question_feedback.sql` | Create | question_feedback 表 |

---

### Task 1: 数据库迁移 — 创建 question_feedback 表

**Files:**
- Create: `supabase/migrations/20260525_question_feedback.sql`

- [ ] **Step 1: 创建 migration 文件**

```sql
create table if not exists public.question_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  question_hash text not null,
  feedback_type text not null check (feedback_type in ('up', 'down')),
  created_at timestamptz default now(),
  unique(user_id, question_hash)
);

alter table public.question_feedback enable row level security;

create policy "用户可以查看自己的反馈"
  on public.question_feedback for select
  using (auth.uid() = user_id);

create policy "用户可以提交反馈"
  on public.question_feedback for insert
  with check (auth.uid() = user.id);
```

- [ ] **Step 2: 应用 migration**

Run: `npx supabase migration up`

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260525_question_feedback.sql
git commit -m "feat(training): add question_feedback table"
```

---

### Task 2: 安装 recharts 依赖

**Files:**
- Modify: `package.json` (npm 自动修改)

- [ ] **Step 1: 安装 recharts**

Run: `npm install recharts`

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: install recharts for radar chart"
```

---

### Task 3: 文本相似度工具

**Files:**
- Create: `src/lib/training/similarity.ts`

- [ ] **Step 1: 创建相似度计算工具**

```typescript
/**
 * 计算两个字符串的最长公共子序列长度
 */
function lcsLength(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp[m][n];
}

/**
 * 计算文本相似度（0-1），基于最长公共子序列
 */
export function textSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const lcs = lcsLength(a, b);
  return lcs / Math.max(a.length, b.length);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/training/similarity.ts
git commit -m "feat(training): add text similarity utility for question dedup"
```

---

### Task 4: 修改 `/api/train` — 难度标注与评分指令

**Files:**
- Modify: `src/app/api/train/route.ts`

- [ ] **Step 1: 修改生成 prompt，增加难度标注**

在现有 generate 的 system prompt 中，将：

```
- 必须围绕维度「${dimension}」和难度 ${diff} 出题
```

改为：

```
- 必须围绕维度「${dimension}」出题
- 在题目开头标注难度，格式严格为「【难度：初级/中级/高级】」
- 初级：单点功能设计，有明确约束条件（对应 L1）
- 中级：跨模块决策，涉及多利益方（对应 L3）
- 高级：产品方向级决策，涉及商业和市场判断（对应 L5）
```

同时移除 `const diff = level ? \`L${level}\` : "L3";` 的使用，改为不传入难度参数（由模型自标注）。

完整修改后的 generate 部分：

```typescript
if (action === "generate") {
  const result = streamText({
    model: chatModel,
    system: `你是 B 端产品训练题库的策展人和出题人。你的题目服务于有经验的产品经理向高级 PM 跃迁。
题目要有真实感、有决策压力、有思考深度。

要求：
- 必须围绕维度「${dimension}」出题
- 在题目开头标注难度，格式严格为「【难度：初级/中级/高级】」
- 初级：单点功能设计，有明确约束条件
- 中级：跨模块决策，涉及多利益方
- 高级：产品方向级决策，涉及商业和市场判断
- **每道题不超过 300 字**
- 体裁不限、结构不限，自由发挥
- 只出题，不加任何分析和引导`,
    messages: [{ role: "user", content: `出一道关于「${dimension}」维度的训练题。` }],
  });
  return result.toDataStreamResponse();
}
```

- [ ] **Step 2: 修改分析 prompt，增加评分指令**

在 analyze 的 system prompt 末尾追加：

```
请在分析开头给出 1-10 分的综合评分，格式严格为「【评分：X/10】」。
评分标准：
- 1-3：回答不完整，缺少关键思考维度
- 4-6：覆盖了基本要点，但深度不足
- 7-8：思考深入，有结构化的分析框架
- 9-10：不仅深入，还展现了跨维度思考和创新性
```

完整修改后的 analyze system prompt 约束部分：

```
约束：
- 必须引用用户原文中的表述来支撑你的观点
- 批评要有建设性，说"具体缺什么"
- 答案过短时提示"思考再深入一些"
- 保持专业、尊重的语气
- 请在分析开头给出 1-10 分的综合评分，格式严格为「【评分：X/10】」
- 评分标准：1-3 初级水平，4-6 中等水平，7-8 良好水平，9-10 优秀水平
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/train/route.ts
git commit -m "feat(training): add difficulty label and scoring to prompts"
```

---

### Task 5: 修改 `/api/training/stats` — Streak + 雷达图数据

**Files:**
- Modify: `src/app/api/training/stats/route.ts`

- [ ] **Step 1: 增加 streak 计算函数**

在文件顶部添加：

```typescript
async function calcStreak(supabase: any, userId: string): Promise<number> {
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const { data } = await supabase
    .from("training_sessions")
    .select("session_date")
    .eq("user_id", userId)
    .gte("session_date", sixtyDaysAgo.toISOString().slice(0, 10))
    .order("session_date", { ascending: false });

  const dates = data?.map((d: any) => d.session_date) || [];
  if (!dates.length) return 0;

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  let streak = 0;
  let checkDate = dates.includes(today) ? today : yesterday;

  if (!dates.includes(checkDate)) return 0;

  while (dates.includes(checkDate)) {
    streak++;
    const d = new Date(checkDate);
    d.setDate(d.getDate() - 1);
    checkDate = d.toISOString().slice(0, 10);
  }

  return streak;
}
```

- [ ] **Step 2: 修改主函数，增加 streak 和平均分返回**

将主函数的返回改为：

```typescript
// 在 dimStats 查询之后，添加平均分查询
const { data: avgData } = await supabase
  .from("training_records")
  .select("dimension, score")
  .eq("user_id", user.id)
  .not("score", "is", null);

const dimAverages: Record<string, number> = {};
const dimScoreCounts: Record<string, number> = {};

avgData?.forEach((r: any) => {
  if (r.score) {
    const score10 = r.score / 10; // 从 0-100 映射回 1-10
    dimScoreCounts[r.dimension] = (dimScoreCounts[r.dimension] || 0) + 1;
    dimAverages[r.dimension] = (dimAverages[r.dimension] || 0) + score10;
  }
});

Object.keys(dimAverages).forEach((d) => {
  dimAverages[d] = Math.round((dimAverages[d] / dimScoreCounts[d]) * 10) / 10;
});

const streak = await calcStreak(supabase, user.id);

return NextResponse.json({
  totalCount: totalCount || 0,
  todayCount: todayCount || 0,
  dimStats,
  dimAverages,
  streak,
  recent,
});
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/training/stats/route.ts
git commit -m "feat(training): add streak calculation and dimension averages to stats API"
```

---

### Task 6: 修改 `/api/training/sessions` — 增加 POST 接口

**Files:**
- Modify: `src/app/api/training/sessions/route.ts`

- [ ] **Step 1: 增加 POST 处理器**

在现有 GET 之后添加 POST：

```typescript
export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { questions } = await req.json();
  if (!Array.isArray(questions)) {
    return NextResponse.json({ error: "questions 必须是数组" }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);

  // 查询今日是否已有记录
  const { data: existing } = await supabase
    .from("training_sessions")
    .select("questions")
    .eq("user_id", user.id)
    .eq("session_date", today)
    .single();

  const merged = { ...(existing?.questions || {}) };
  const existingKeys = Object.keys(merged);
  questions.forEach((q: string, i: number) => {
    merged[`round_${existingKeys.length + i}`] = q;
  });

  const { error } = await supabase
    .from("training_sessions")
    .upsert(
      {
        user_id: user.id,
        session_date: today,
        questions: merged,
      },
      { onConflict: "user_id,session_date" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/training/sessions/route.ts
git commit -m "feat(training): add POST endpoint for session completion"
```

---

### Task 7: 修改 `/api/training/record` — 保存评分

**Files:**
- Modify: `src/app/api/training/record/route.ts`

先读取当前文件确认结构。

- [ ] **Step 1: 读取当前文件**

Run: `cat src/app/api/training/record/route.ts`

- [ ] **Step 2: 修改以接收并保存 score**

在解析 body 时增加 `score` 字段：

```typescript
const { dimension, question_scenario, user_answer, ai_feedback, score } = await req.json();
```

在插入时：

```typescript
const { error } = await supabase.from("training_records").insert({
  user_id: user.id,
  dimension,
  question_scenario,
  user_answer,
  ai_feedback,
  score: score ? Math.round(score * 10) : null, // 1-10 映射到 10-100
});
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/training/record/route.ts
git commit -m "feat(training): save AI score in training record"
```

---

### Task 8: 创建 `/api/training/history/[id]` — 历史详情查询

**Files:**
- Create: `src/app/api/training/history/[id]/route.ts`

- [ ] **Step 1: 创建 API 路由**

```typescript
import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await params;

  const { data, error } = await supabase
    .from("training_records")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "记录不存在" }, { status: 404 });
  }

  return NextResponse.json({ record: data });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/training/history/\[id\]/route.ts
git commit -m "feat(training): add history detail API endpoint"
```

---

### Task 9: 创建 `/api/training/feedback` — 题目反馈

**Files:**
- Create: `src/app/api/training/feedback/route.ts`

- [ ] **Step 1: 创建 API 路由**

```typescript
import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { question_text, feedback_type } = await req.json();

  if (!question_text || !["up", "down"].includes(feedback_type)) {
    return NextResponse.json({ error: "参数错误" }, { status: 400 });
  }

  const question_hash = createHash("md5")
    .update(question_text.slice(0, 50))
    .digest("hex");

  const { error } = await supabase.from("question_feedback").upsert(
    {
      user_id: user.id,
      question_hash,
      feedback_type,
    },
    { onConflict: "user_id,question_hash" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/training/feedback/route.ts
git commit -m "feat(training): add question feedback API"
```

---

### Task 10: 修改 `session/page.tsx` — 评分展示、难度标签、反馈按钮、Session 闭环

**Files:**
- Modify: `src/app/(app)/training/session/page.tsx`

- [ ] **Step 1: 增加难度解析和反馈状态**

在组件顶部状态声明附近增加：

```typescript
const [difficulty, setDifficulty] = useState<string>("");
const [score, setScore] = useState<number>(0);
```

- [ ] **Step 2: 修改题目生成后的处理，解析难度**

在 `generateQuestion` 的 stream 处理中，当 `done` 后解析难度：

```typescript
setQuestions((prev) => ({ ...prev, [dim]: { text, loading: false } }));

// 解析难度标签
const diffMatch = text.match(/【难度：(初级|中级|高级)】/);
if (diffMatch) {
  setDifficulty(diffMatch[1]);
}
```

- [ ] **Step 3: 修改 handleSubmit，提取评分并展示**

在 `handleSubmit` 的 stream 处理中，当 `done` 后：

```typescript
setAnalyses((prev) => ({ ...prev, [currentDim]: { text: fullText, loading: false } }));

// 提取评分
const scoreMatch = fullText.match(/【评分：(\d+)\/10】/);
const extractedScore = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;
setScore(extractedScore);
```

- [ ] **Step 4: 修改 record 保存，传入评分**

```typescript
await fetch("/api/training/record", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    dimension: currentDim,
    question_scenario: q,
    user_answer: answerText,
    ai_feedback: { analysis: fullText, score: extractedScore },
    score: extractedScore,
  }),
});
```

- [ ] **Step 5: 修改 handleNext，增加 session 闭环**

```typescript
const handleNext = () => {
  if (currentIndex < ALL_DIMS.length - 1) {
    setCurrentIndex(currentIndex + 1);
    setScore(0);
    setDifficulty("");
  } else {
    // 完成一轮，触发 session 闭环
    const roundQuestions = ALL_DIMS.map((d) => questions[d]?.text).filter(Boolean);
    if (roundQuestions.length > 0) {
      fetch("/api/training/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: roundQuestions }),
      }).catch(() => {});
    }

    setRound((r) => r + 1);
    setCurrentIndex(0);
    setQuestions({});
    setAnswers({});
    setAnalyses({});
    setScore(0);
    setDifficulty("");
  }
};
```

- [ ] **Step 6: 增加反馈按钮处理函数**

```typescript
const handleFeedback = async (type: "up" | "down") => {
  const q = questions[currentDim]?.text;
  if (!q) return;
  await fetch("/api/training/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question_text: q, feedback_type: type }),
  }).catch(() => {});
};
```

- [ ] **Step 7: 在 JSX 中增加难度标签、评分展示、反馈按钮**

在题目卡片的维度标签旁边增加难度标签：

```tsx
{difficulty && (
  <span className="px-2.5 py-0.5 bg-secondary-fixed text-on-secondary-fixed-variant font-label-bold text-[10px] rounded uppercase">
    {difficulty}
  </span>
)}
```

在 AI 分析区域增加评分展示（如果有评分）：

```tsx
{score > 0 && (
  <div className="flex items-center gap-2 mb-2">
    <span className="material-symbols-outlined text-primary">star</span>
    <span className="text-sm font-bold">评分：{score}/10</span>
  </div>
)}
```

在题目卡片底部增加反馈按钮（答题前展示）：

```tsx
<div className="flex items-center gap-2 mt-2">
  <span className="text-xs text-on-surface-variant">题目质量：</span>
  <button
    onClick={() => handleFeedback("up")}
    className="p-1 hover:bg-surface-container-high rounded transition-colors"
    title="好题"
  >
    <span className="material-symbols-outlined text-sm">thumb_up</span>
  </button>
  <button
    onClick={() => handleFeedback("down")}
    className="p-1 hover:bg-surface-container-high rounded transition-colors"
    title="需要改进"
  >
    <span className="material-symbols-outlined text-sm">thumb_down</span>
  </button>
</div>
```

- [ ] **Step 8: Commit**

```bash
git add src/app/(app)/training/session/page.tsx
git commit -m "feat(training): show score, difficulty, feedback buttons, session close"
```

---

### Task 11: 创建能力雷达图组件

**Files:**
- Create: `src/components/training/RadarChart.tsx`

- [ ] **Step 1: 创建雷达图组件**

```tsx
"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

interface RadarData {
  dimension: string;
  score: number;
  fullMark: number;
}

interface Props {
  data: RadarData[];
}

export default function AbilityRadarChart({ data }: Props) {
  if (!data.length) return null;

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: "#6b7280", fontSize: 12 }}
          />
          <PolarRadiusAxis angle={90} domain={[0, 10]} tick={false} axisLine={false} />
          <Radar
            name="能力评分"
            dataKey="score"
            stroke="#2563eb"
            fill="#2563eb"
            fillOpacity={0.2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/training/RadarChart.tsx
git commit -m "feat(training): add ability radar chart component"
```

---

### Task 12: 修改 `training/page.tsx` — 真实 streak、雷达图、历史记录可点击

**Files:**
- Modify: `src/app/(app)/training/page.tsx`

- [ ] **Step 1: 修改 stats 类型，增加 streak 和 dimAverages**

```typescript
const [stats, setStats] = useState<{
  totalCount: number;
  todayCount: number;
  streak: number;
  dimStats: Record<string, number>;
  dimAverages: Record<string, number>;
  recent: { id: string; dimension: string; question_scenario: string; created_at: string }[];
} | null>(null);
```

- [ ] **Step 2: 导入雷达图和 Link**

```typescript
import Link from "next/link";
import AbilityRadarChart from "@/components/training/RadarChart";
```

- [ ] **Step 3: 修改 streak 显示区域，使用真实数据**

将硬编码的 "已连续训练 12 天" 改为：

```tsx
<div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-secondary-container/30 text-on-secondary-container rounded-full w-fit">
  <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
    local_fire_department
  </span>
  <span className="font-label-bold text-[10px]">
    {stats?.streak ? `已连续训练 ${stats.streak} 天` : "开始你的训练之旅"}
  </span>
</div>
```

- [ ] **Step 4: 在统计区增加雷达图卡片**

在"各维度完成情况"卡片旁边增加雷达图：

```tsx
{/* 能力雷达图 */}
<div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col justify-between">
  <div>
    <span className="material-symbols-outlined text-secondary mb-2">radar</span>
    <p className="text-label-bold text-on-surface-variant">能力雷达</p>
  </div>
  <div className="mt-4">
    {stats?.dimAverages && Object.keys(stats.dimAverages).length >= 3 ? (
      <AbilityRadarChart
        data={Object.entries(stats.dimAverages).map(([dim, score]) => ({
          dimension: DIM_LABELS[dim] || dim,
          score: Math.min(score, 10),
          fullMark: 10,
        }))}
      />
    ) : (
      <p className="text-body-sm text-on-surface-variant text-center py-8">
        完成更多训练以解锁能力分析
      </p>
    )}
  </div>
</div>
```

同时调整 grid 布局从 `md:grid-cols-4` 为 `md:grid-cols-5` 或保持 `grid-cols-4` 但让雷达图占据一个位置。

建议改为 `grid-cols-1 md:grid-cols-5`，让 streak 卡片占 2 列，其余 3 个统计卡片各占 1 列。

- [ ] **Step 5: 历史记录添加点击跳转**

将历史记录项改为 Link：

```tsx
<Link
  key={r.id}
  href={`/training/history/${r.id}`}
  className="flex items-center gap-3 p-3 hover:bg-surface-container rounded-xl transition-all w-full text-left group"
>
  ...
</Link>
```

- [ ] **Step 6: Commit**

```bash
git add src/app/(app)/training/page.tsx
git commit -m "feat(training): real streak, radar chart, clickable history"
```

---

### Task 13: 创建历史答题详情页

**Files:**
- Create: `src/app/(app)/training/history/[id]/page.tsx`

- [ ] **Step 1: 创建详情页**

```tsx
"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function HistoryDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/training/history/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setRecord(data.record);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="animate-spin w-8 h-8 border-3 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen flex items-center justify-center text-on-surface-variant">
        记录不存在或无权查看
      </div>
    );
  }

  const analysis = record.ai_feedback?.analysis || "";
  const score = record.score ? Math.round(record.score / 10) : 0;

  // 解析诊断和建议
  const extractSections = (text: string) => {
    const diagnosisMatch = text.match(/#{1,2}\s*诊断[\s\S]*?(?=#{1,2}\s*建议|$)/i);
    const suggestionMatch = text.match(/#{1,2}\s*建议[\s\S]*?(?=#{1,2}|$)/i);
    return {
      diagnosis: diagnosisMatch ? diagnosisMatch[0].replace(/^#{1,2}\s*诊断\s*/, "").trim() : text,
      suggestion: suggestionMatch ? suggestionMatch[0].replace(/^#{1,2}\s*建议\s*/, "").trim() : "",
    };
  };

  const sections = extractSections(analysis);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1040px] mx-auto py-8 px-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* 标题 */}
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-primary-fixed text-on-primary-fixed-variant font-label-bold text-xs rounded uppercase">
              {record.dimension}
            </span>
            {score > 0 && (
              <span className="px-3 py-1 bg-secondary-fixed text-on-secondary-fixed-variant font-label-bold text-xs rounded uppercase">
                评分：{score}/10
              </span>
            )}
            <span className="text-body-sm text-on-surface-variant">
              {new Date(record.created_at).toLocaleDateString("zh-CN")}
            </span>
          </div>

          {/* 题目 */}
          <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl">
            <h3 className="text-label-bold text-on-surface-variant mb-3">题目</h3>
            <div className="text-base text-on-surface leading-snug">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{record.question_scenario}</ReactMarkdown>
            </div>
          </div>

          {/* 用户答案 */}
          <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl">
            <h3 className="text-label-bold text-on-surface-variant mb-3">你的回答</h3>
            <div className="text-sm text-on-surface leading-snug whitespace-pre-wrap">
              {record.user_answer}
            </div>
          </div>

          {/* AI 分析 */}
          {analysis && (
            <div className="bg-surface-container-lowest border border-primary/20 rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
                <div className="text-sm text-on-surface font-bold">AI 深度解析</div>
              </div>

              {sections.diagnosis && (
                <section className="mb-4">
                  <div className="text-sm text-on-surface flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">analytics</span>
                    诊断
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-4 border border-outline-variant/30">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{sections.diagnosis}</ReactMarkdown>
                  </div>
                </section>
              )}

              {sections.suggestion && (
                <section>
                  <div className="text-sm text-on-surface flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">lightbulb</span>
                    建议
                  </div>
                  <div className="bg-primary-fixed/20 rounded-lg p-4 border border-primary-fixed/40">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{sections.suggestion}</ReactMarkdown>
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(app)/training/history/\[id\]/page.tsx
git commit -m "feat(training): add history detail page"
```

---

### Task 14: 构建与验证

- [ ] **Step 1: 运行构建**

Run: `npm run build`

Expected: 无 TypeScript 错误，构建成功

- [ ] **Step 2: 启动开发服务器**

Run: `npm run dev`

- [ ] **Step 3: 浏览器验证 streak**

1. 登录后进入 `/training`
2. 确认 streak 显示为真实数据（新用户应为"开始你的训练之旅"）

- [ ] **Step 4: 浏览器验证训练流程**

1. 进入 `/training/session`
2. 确认题目包含难度标签（【难度：初级/中级/高级】）
3. 作答并提交
4. 确认 AI 分析包含评分（【评分：X/10】）
5. 完成5题后点击"再来一轮"
6. 确认 session 已写入（检查 Supabase `training_sessions` 表）

- [ ] **Step 5: 浏览器验证历史回顾**

1. 返回 `/training`
2. 点击历史记录条目
3. 确认跳转到详情页，展示题目、答案、AI 分析

- [ ] **Step 6: 浏览器验证雷达图**

1. 在 `/training` 首页确认雷达图区域
2. 有数据时展示雷达图，无数据时展示引导文案

- [ ] **Step 7: 浏览器验证反馈按钮**

1. 在 `/training/session` 题目卡片下点击点赞/踩
2. 确认无报错

- [ ] **Step 8: Commit（如有额外修复）**

```bash
git add -A
git commit -m "fix(training): address build and verification issues"
```

---

## Spec Coverage Check

| Spec 要求 | 对应 Task |
|-----------|-----------|
| Streak 基于真实数据 | Task 5 |
| 用户中断 streak 重置 | Task 5 (calcStreak 逻辑) |
| 完成第5题 session 闭环 | Task 6, Task 10 |
| 同一天多轮追加 | Task 6 (upsert merge) |
| AI 分析包含评分 | Task 4, Task 10 |
| 评分持久化 | Task 7, Task 10 |
| 雷达图展示 | Task 11, Task 12 |
| 数据不足引导 | Task 12 |
| 历史详情查看 | Task 8, Task 13 |
| 历史记录筛选 | （stats API 已支持，首页可直接用 dimStats 筛选逻辑扩展）|
| 题目难度标注 | Task 4 |
| 前端展示难度 | Task 10 |
| 题目去重 | Task 3, Task 4 (服务端需集成) |
| 质量反馈 | Task 1, Task 9, Task 10 |

**Gap**: "历史记录按维度筛选"在 Spec 中有定义，但当前 plan 未单独实现 Task。该功能可通过现有 `/api/training/stats` 返回的 `recent` 数据在前端做客户端筛选实现，复杂度低。如需服务端筛选，可在 Task 12 中扩展。
