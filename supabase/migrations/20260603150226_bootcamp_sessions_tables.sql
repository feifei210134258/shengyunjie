-- 特训冲刺模块：会话、面试题、报告
-- 远端 Supabase 当前缺少这些表，会导致 /api/bootcamp/resume 写入时 schema cache 报错。

create table if not exists public.bootcamp_sessions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references public.profiles(id) on delete cascade unique not null,
  status              text default 'not_started',
  current_day         smallint default 0,
  resume_text         text,
  parsed_profile      jsonb,
  weakness_prediction jsonb,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.bootcamp_sessions'::regclass
      and conname = 'bootcamp_sessions_user_id_key'
  ) then
    alter table public.bootcamp_sessions
      add constraint bootcamp_sessions_user_id_key unique (user_id);
  end if;
end $$;

alter table public.bootcamp_sessions enable row level security;

drop policy if exists "用户可以查看自己的训练营会话" on public.bootcamp_sessions;
create policy "用户可以查看自己的训练营会话"
  on public.bootcamp_sessions for select
  using (auth.uid() = user_id);

drop policy if exists "用户可以创建自己的训练营会话" on public.bootcamp_sessions;
create policy "用户可以创建自己的训练营会话"
  on public.bootcamp_sessions for insert
  with check (auth.uid() = user_id);

drop policy if exists "用户可以更新自己的训练营会话" on public.bootcamp_sessions;
create policy "用户可以更新自己的训练营会话"
  on public.bootcamp_sessions for update
  using (auth.uid() = user_id);

drop policy if exists "用户可以删除自己的训练营会话" on public.bootcamp_sessions;
create policy "用户可以删除自己的训练营会话"
  on public.bootcamp_sessions for delete
  using (auth.uid() = user_id);

create table if not exists public.bootcamp_interviews (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid references public.bootcamp_sessions(id) on delete cascade not null,
  day_number      smallint not null,
  question_index  smallint not null,
  question_text   text not null,
  question_type   text,
  difficulty      smallint default 1,
  user_answer     text,
  ai_evaluation   jsonb,
  status          text default 'pending',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique(session_id, day_number, question_index)
);

alter table public.bootcamp_interviews enable row level security;

drop policy if exists "用户可以查看自己的面试题" on public.bootcamp_interviews;
create policy "用户可以查看自己的面试题"
  on public.bootcamp_interviews for select
  using (exists (
    select 1 from public.bootcamp_sessions
    where bootcamp_sessions.id = bootcamp_interviews.session_id
      and bootcamp_sessions.user_id = auth.uid()
  ));

drop policy if exists "用户可以创建自己的面试题" on public.bootcamp_interviews;
create policy "用户可以创建自己的面试题"
  on public.bootcamp_interviews for insert
  with check (exists (
    select 1 from public.bootcamp_sessions
    where bootcamp_sessions.id = bootcamp_interviews.session_id
      and bootcamp_sessions.user_id = auth.uid()
  ));

drop policy if exists "用户可以更新自己的面试题" on public.bootcamp_interviews;
create policy "用户可以更新自己的面试题"
  on public.bootcamp_interviews for update
  using (exists (
    select 1 from public.bootcamp_sessions
    where bootcamp_sessions.id = bootcamp_interviews.session_id
      and bootcamp_sessions.user_id = auth.uid()
  ));

drop policy if exists "用户可以删除自己的面试题" on public.bootcamp_interviews;
create policy "用户可以删除自己的面试题"
  on public.bootcamp_interviews for delete
  using (exists (
    select 1 from public.bootcamp_sessions
    where bootcamp_sessions.id = bootcamp_interviews.session_id
      and bootcamp_sessions.user_id = auth.uid()
  ));

create table if not exists public.bootcamp_reports (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid references public.bootcamp_sessions(id) on delete cascade not null,
  report_type     text not null,
  day_number      smallint,
  content         jsonb not null,
  scores_snapshot jsonb,
  created_at      timestamptz default now()
);

alter table public.bootcamp_reports enable row level security;

drop policy if exists "用户可以查看自己的训练营报告" on public.bootcamp_reports;
create policy "用户可以查看自己的训练营报告"
  on public.bootcamp_reports for select
  using (exists (
    select 1 from public.bootcamp_sessions
    where bootcamp_sessions.id = bootcamp_reports.session_id
      and bootcamp_sessions.user_id = auth.uid()
  ));

drop policy if exists "用户可以创建自己的训练营报告" on public.bootcamp_reports;
create policy "用户可以创建自己的训练营报告"
  on public.bootcamp_reports for insert
  with check (exists (
    select 1 from public.bootcamp_sessions
    where bootcamp_sessions.id = bootcamp_reports.session_id
      and bootcamp_sessions.user_id = auth.uid()
  ));

drop policy if exists "用户可以更新自己的训练营报告" on public.bootcamp_reports;
create policy "用户可以更新自己的训练营报告"
  on public.bootcamp_reports for update
  using (exists (
    select 1 from public.bootcamp_sessions
    where bootcamp_sessions.id = bootcamp_reports.session_id
      and bootcamp_sessions.user_id = auth.uid()
  ));

drop policy if exists "用户可以删除自己的训练营报告" on public.bootcamp_reports;
create policy "用户可以删除自己的训练营报告"
  on public.bootcamp_reports for delete
  using (exists (
    select 1 from public.bootcamp_sessions
    where bootcamp_sessions.id = bootcamp_reports.session_id
      and bootcamp_sessions.user_id = auth.uid()
  ));

grant select, insert, update, delete on public.bootcamp_sessions to authenticated;
grant select, insert, update, delete on public.bootcamp_interviews to authenticated;
grant select, insert, update, delete on public.bootcamp_reports to authenticated;
