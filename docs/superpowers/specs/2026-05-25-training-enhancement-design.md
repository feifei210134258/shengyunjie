---
comet_change: training-enhancement
role: technical-design
canonical_spec: openspec
archived-with: 2026-05-25-training-enhancement
status: final
---

# Design Doc: 训练功能完善（Streak / 历史回顾 / AI 评分 / 题目质量）

## 技术上下文

### 现有数据模型（无需变更）

```sql
training_records (
  id uuid PK,
  user_id uuid FK -> profiles,
  dimension text NOT NULL,      -- 5 维度之一
  difficulty smallint DEFAULT 3, -- 1-5，已存在
  question_scenario text,
  user_answer text,
  ai_feedback jsonb,
  score smallint,               -- 0-100，已存在，本次用于存储 1-10 评分×10
  created_at timestamptz
)

training_sessions (
  id uuid PK,
  user_id uuid FK -> profiles,
  session_date date DEFAULT current_date,
  questions jsonb DEFAULT '{}', -- {"战略思维": "题文本", ...}
  unique(user_id, session_date)
)
```

### 现有 API

- `POST /api/train` — `action: generate` 出题，`action: analyze` AI 分析
- `GET /api/training/stats` — 统计（totalCount, todayCount, dimStats, recent）
- `GET /api/training/sessions?month=` — 按月查询训练日期
- `POST /api/training/record` — 保存答题记录
- `POST /api/training/questions` — 保存生成的题目

### 关键发现

- `score` 字段已存在（0-100），1-10 评分映射为 10-100 存储
- `difficulty` 字段已存在（1-5），与"初级/中级/高级"三级映射：1-2→初级，3→中级，4-5→高级
- `/api/train` 生成 prompt 已有 `level`（L1/L3/L5）参数体系

archived-with: 2026-05-25-training-enhancement
status: final
---

## 关键决策

### D1: AI 评分集成 — Prompt 内嵌评分指令

在现有分析 prompt 末尾追加评分指令，模型在 Markdown 输出开头包含 `【评分：X/10】`。前端用正则提取，不破坏流式输出体验。

```
请在分析开头给出 1-10 分的综合评分，格式严格为「【评分：X/10】」，
X 为整数。评分标准：1-3 初级水平，4-6 中等水平，7-8 良好水平，9-10 优秀水平。
```

提取正则：`/【评分：(\d+)\/10】/`。提取失败时默认记为 0（不展示）。

**为什么不用 JSON 结构化输出？** 会破坏现有 Markdown 流式渲染体验，需要重写 stream 解析逻辑。
**为什么不用单独评分 API？** 延迟和成本翻倍，无显著收益。

### D2: Session 闭环 — "再来一轮"时触发

当用户在第5题点击"再来一轮"按钮时，客户端将本轮5道题的题目文本数组 POST 到 `/api/training/sessions`。

```typescript
// 客户端 handleNext 中
if (isLast && hasAnalysis) {
  // 收集本轮5题文本
  const roundQuestions = ALL_DIMS.map(d => questions[d]?.text).filter(Boolean);
  fetch("/api/training/sessions", {
    method: "POST",
    body: JSON.stringify({ questions: roundQuestions })
  });
  // 然后重置状态进入下一轮
}
```

服务端：
- `UPSERT` 到 `training_sessions`，`session_date = CURRENT_DATE`
- `questions` 追加到现有 jsonb（同一天多轮训练不创建新记录）

**为什么不每题都更新？** 避免用户中途退出留下不完整 session，导致 streak 语义模糊。

### D3: 题目去重 — 服务端文本相似度检查

在 `/api/train` `generate` action 中，生成题目后：
1. 查询该用户最近 10 题的 `question_scenario`
2. 用 Levenshtein 距离（或 longest common substring 比例）计算相似度
3. 相似度 > 0.7 时，重新生成一次（最多重试 2 次）
4. 超过重试次数后返回最后一次生成的题目（避免死循环）

```typescript
function similarity(a: string, b: string): number {
  // 简化：基于最长公共子序列比例
  const lcs = longestCommonSubsequence(a, b);
  return lcs / Math.max(a.length, b.length);
}
```

**为什么不用向量去重？** 需要 embedding 服务和向量数据库，引入过重。文本相似度足以应对早期阶段。
**阈值 0.7 会不会误杀？** 可能。但最多重试 2 次，且放宽阈值到 0.7（而非 0.5），平衡去重效果与用户体验。

archived-with: 2026-05-25-training-enhancement
status: final
---

## Capability 实现细节

### training-streak-session

**Streak 算法**（服务端，`/api/training/stats`）：

```typescript
async function calcStreak(userId: string): Promise<number> {
  // 查询最近 60 天的 session 日期（留足缓冲区）
  const { data } = await supabase
    .from("training_sessions")
    .select("session_date")
    .eq("user_id", userId)
    .gte("session_date", sixtyDaysAgo)
    .order("session_date", { ascending: false });

  const dates = data?.map(d => d.session_date) || [];
  if (!dates.length) return 0;

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  let streak = 0;
  let checkDate = dates.includes(today) ? today : yesterday;

  // 如果今天没训练且昨天也没训练，streak = 0
  if (!dates.includes(checkDate)) return 0;

  // 从今天/昨天往前数连续天数
  while (dates.includes(checkDate)) {
    streak++;
    const d = new Date(checkDate);
    d.setDate(d.getDate() - 1);
    checkDate = d.toISOString().slice(0, 10);
  }

  return streak;
}
```

**Session 闭环 API**（`POST /api/training/sessions`）：

```typescript
// 新增 POST 处理器到现有 /api/training/sessions/route.ts
const { questions } = await req.json(); // string[]

const today = new Date().toISOString().slice(0, 10);

// 先查询今日是否已有记录
const { data: existing } = await supabase
  .from("training_sessions")
  .select("questions")
  .eq("user_id", user.id)
  .eq("session_date", today)
  .single();

const merged = existing?.questions || {};
questions.forEach((q: string, i: number) => {
  merged[`round_${Object.keys(merged).length + i}`] = q;
});

await supabase
  .from("training_sessions")
  .upsert({
    user_id: user.id,
    session_date: today,
    questions: merged,
  }, { onConflict: "user_id,session_date" });
```

### training-ai-scoring

**Prompt 修改**（`/api/train` analyze action）：

在现有 system prompt 末尾追加：

```
请在分析开头给出 1-10 分的综合评分，格式严格为「【评分：X/10】」。
评分标准：
- 1-3：回答不完整，缺少关键思考维度
- 4-6：覆盖了基本要点，但深度不足
- 7-8：思考深入，有结构化的分析框架
- 9-10：不仅深入，还展现了跨维度思考和创新性
```

**前端提取**（`session/page.tsx`）：

```typescript
const scoreMatch = fullText.match(/【评分：(\d+)\/10】/);
const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;
```

**保存**（`POST /api/training/record`）：

```typescript
body: JSON.stringify({
  dimension: currentDim,
  question_scenario: q,
  user_answer: answerText,
  ai_feedback: { analysis: fullText, score },
  score: score * 10, // 映射到 0-100
})
```

**雷达图数据**（`/api/training/stats` 新增）：

```typescript
// 各维度平均分（基于 score 字段）
const { data: avgScores } = await supabase
  .from("training_records")
  .select("dimension, score")
  .eq("user_id", user.id)
  .not("score", "is", null);

const dimAverages: Record<string, number> = {};
const dimCounts: Record<string, number> = {};

avgScores?.forEach(r => {
  dimCounts[r.dimension] = (dimCounts[r.dimension] || 0) + 1;
  dimAverages[r.dimension] = (dimAverages[r.dimension] || 0) + r.score / 10;
});

Object.keys(dimAverages).forEach(d => {
  dimAverages[d] = Math.round((dimAverages[d] / dimCounts[d]) * 10) / 10;
});
```

### training-history-review

**新 API**（`GET /api/training/history/[id]/route.ts`）：

```typescript
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { data } = await supabase
    .from("training_records")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({ record: data });
}
```

**新页面**（`src/app/(app)/training/history/[id]/page.tsx`）：

只读展示页，结构参考现有 session 页面的 AI 分析卡片样式：
- 顶部：维度标签 + 日期
- 题目卡片
- 用户答案卡片
- AI 诊断卡片
- AI 建议卡片
- 评分标签（如果有）

**历史列表跳转**（`training/page.tsx`）：

将现有历史记录 `<div>` 改为 `<Link href={`/training/history/${r.id}`}>`。

### training-question-quality

**难度标注**（`/api/train` generate prompt）：

```
要求：
- 必须围绕维度「${dimension}」出题
- 在题目开头标注难度，格式为「【难度：初级/中级/高级】」
- 初级：单点功能设计，有明确约束条件
- 中级：跨模块决策，涉及多利益方
- 高级：产品方向级决策，涉及商业和市场判断
- **每道题不超过 300 字**
```

**难度映射**：
- `初级` → difficulty = 2
- `中级` → difficulty = 3
- `高级` → difficulty = 5

前端解析：
```typescript
const difficultyMatch = text.match(/【难度：(初级|中级|高级)】/);
const difficulty = difficultyMatch ? difficultyMatch[1] : "中级";
```

**质量反馈表**（新增 migration）：

```sql
create table if not exists public.question_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  question_hash text not null,  -- MD5(question_scenario前50字)
  feedback_type text not null check (feedback_type in ('up', 'down')),
  created_at timestamptz default now(),
  unique(user_id, question_hash)
);

alter table public.question_feedback enable row level security;

create policy "用户可以查看自己的反馈" on public.question_feedback for select using (auth.uid() = user_id);
create policy "用户可以提交反馈" on public.question_feedback for insert with check (auth.uid() = user_id);
```

**反馈 API**（`POST /api/training/feedback/route.ts`）：

```typescript
const { question_hash, feedback_type } = await req.json();
await supabase.from("question_feedback").upsert(
  { user_id: user.id, question_hash, feedback_type },
  { onConflict: "user_id,question_hash" }
);
```

archived-with: 2026-05-25-training-enhancement
status: final
---

## 数据流

```
┌─────────────────────────────────────────────────────────────────────┐
│                         训练 Session 数据流                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [用户] ──开始训练──▶ /training/session                              │
│     │                    │                                          │
│     │                    ▼                                          │
│     │              POST /api/train (generate)                        │
│     │                    │                                          │
│     │                    ▼                                          │
│     │              [题目] + 【难度标签】                              │
│     │                    │                                          │
│     │         用户作答 ──▶ POST /api/train (analyze)                 │
│     │                    │                                          │
│     │                    ▼                                          │
│     │         [AI分析] + 【评分：X/10】                              │
│     │                    │                                          │
│     │                    ▼                                          │
│     │         POST /api/training/record (保存答案+评分)              │
│     │                    │                                          │
│     │         [可选] POST /api/training/feedback (题目反馈)          │
│     │                    │                                          │
│     │         下一题 / 再来一轮                                      │
│     │                    │                                          │
│     │         再来一轮 ──▶ POST /api/training/sessions (闭环)        │
│     │                    │                                          │
│     │                    ▼                                          │
│     │              training_sessions 表写入                          │
│     │                    │                                          │
│     │         结束训练 ──▶ /training                                 │
│     │                    │                                          │
│     │                    ▼                                          │
│     │         GET /api/training/stats (streak + 雷达图数据)          │
│     │                    │                                          │
│     │                    ▼                                          │
│     │              [首页展示真实 streak + 雷达图]                    │
│     │                                                              │
│     │         点击历史记录 ──▶ /training/history/[id]                │
│     │                    │                                          │
│     │                    ▼                                          │
│     │         GET /api/training/history/[id]                         │
│     │                                                              │
└─────────────────────────────────────────────────────────────────────┘
```

archived-with: 2026-05-25-training-enhancement
status: final
---

## 边界条件

| 场景 | 处理 |
|------|------|
| 新用户无历史数据 | 雷达图显示空状态引导，streak = 0 |
| AI 未输出评分格式 | 提取失败，score = 0，前端不展示评分标签 |
| 题目去重重试 2 次仍重复 | 返回最后一次生成的题目（避免死循环）|
| 同一天多轮训练 | session 记录追加 questions，不创建新日期 |
| 用户中途退出（未完成5题）| 已答题目保存到 training_records，但不触发 session 闭环 |
| 同一题重复反馈 | `question_feedback` 表 `upsert` 覆盖 |
| 历史记录 AI 反馈为旧格式（无评分）| 详情页正常展示，评分区域隐藏 |

archived-with: 2026-05-25-training-enhancement
status: final
---

## 测试策略

1. **Streak 计算**：用固定日期数据测试跨月连续、中断、空数据场景
2. **评分提取**：准备包含/不包含评分格式的 AI 输出文本，验证正则提取
3. **Session 闭环**：模拟完成5题点击"再来一轮"，验证 `training_sessions` 写入
4. **去重逻辑**：构造相似题目对，验证阈值触发和重试上限
5. **难度映射**：验证 "初级/中级/高级" 正确映射到 difficulty 值

archived-with: 2026-05-25-training-enhancement
status: final
---

## 依赖

- `recharts` — 雷达图渲染（新增 npm 依赖）
- 现有 `ai` SDK、`supabase` 客户端 — 无需变更
