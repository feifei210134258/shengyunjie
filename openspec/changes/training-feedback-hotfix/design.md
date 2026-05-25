# Design: 题目质量反馈修复方案

## 方案

### 1. 数据库表定义

根据 API 代码反推表结构：

```sql
create table if not exists public.question_feedback (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.profiles(id) on delete cascade not null,
  question_hash   text not null,      -- md5(question_text.slice(0,50))
  feedback_type   text not null,      -- 'up' | 'down'
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique(user_id, question_hash)
);

alter table public.question_feedback enable row level security;

create policy "用户可以查看自己的反馈"
  on public.question_feedback for select
  using (auth.uid() = user_id);

create policy "用户可以提交反馈"
  on public.question_feedback for insert
  with check (auth.uid() = user_id);

create policy "用户可以更新自己的反馈"
  on public.question_feedback for update
  using (auth.uid() = user_id);
```

### 2. 前端反馈提示

`handleFeedback` 中添加 try/catch 和用户可见反馈：
- 成功：显示 toast "反馈已提交，感谢！"
- 失败：显示 toast "反馈提交失败，请重试"
- 点击后临时改变按钮样式，让用户知道已记录

### 3. 文件清单
- `supabase/schema.sql` — 追加表定义
- `src/app/(app)/training/session/page.tsx` — 添加用户反馈提示
