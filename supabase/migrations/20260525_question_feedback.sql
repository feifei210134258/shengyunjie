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
  with check (auth.uid() = user_id);
