-- ==========================================================
-- 产品升云阶 — 数据库 Schema
-- 在 Supabase SQL Editor 中执行此文件
-- ==========================================================

-- 1. 用户资料表
create table if not exists public.profiles (
  id            uuid references auth.users on delete cascade primary key,
  display_name  text,
  title         text,                    -- 如"资深产品经理"
  avatar_url    text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "用户可以查看自己的资料"
  on public.profiles for select
  using (auth.uid() = id);

create policy "用户可以更新自己的资料"
  on public.profiles for update
  using (auth.uid() = id);

create policy "用户可以创建自己的资料"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "用户可以删除自己的资料"
  on public.profiles for delete
  using (auth.uid() = id);

-- 注册时自动创建资料
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', '用户'));
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. 诊断报告表
create table if not exists public.diagnosis_reports (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references public.profiles(id) on delete cascade not null,
  status            text default 'in_progress',  -- in_progress, completed
  overall_score     smallint,                    -- 0-100
  overall_grade     text,                        -- 如 "高级 PM (B端方向)"
  strengths         jsonb,                       -- 强项列表
  weaknesses        jsonb,                       -- 薄弱项列表
  improvements      jsonb,                       -- 改进建议列表
  stage1_data       jsonb,                       -- 量表原始答案
  stage2_summary    jsonb,                       -- 访谈摘要
  stage3_case_data  jsonb,                       -- 案例答案
  created_at        timestamptz default now(),
  completed_at      timestamptz
);

alter table public.diagnosis_reports enable row level security;

create policy "用户可以查看自己的诊断报告"
  on public.diagnosis_reports for select
  using (auth.uid() = user_id);

create policy "用户可以创建自己的诊断报告"
  on public.diagnosis_reports for insert
  with check (auth.uid() = user_id);

create policy "用户可以更新自己的诊断报告"
  on public.diagnosis_reports for update
  using (auth.uid() = user_id);

-- 3. 维度得分表（每个诊断报告有 5 条记录）
create table if not exists public.dimension_scores (
  id              uuid primary key default gen_random_uuid(),
  report_id       uuid references public.diagnosis_reports(id) on delete cascade not null,
  dimension       text not null,   -- strategic_thinking, system_design, data_decision, user_insight, commercial_thinking
  score           smallint not null,  -- 0-100
  grade           text,               -- A, B-, B+, A- 等
  label           text,               -- 中文维度名
  description     text,               -- 简要评语
  created_at      timestamptz default now()
);

alter table public.dimension_scores enable row level security;

create policy "用户可以通过报告查看维度得分"
  on public.dimension_scores for select
  using (exists (
    select 1 from public.diagnosis_reports
    where diagnosis_reports.id = dimension_scores.report_id
    and diagnosis_reports.user_id = auth.uid()
  ));

create policy "用户可以创建维度得分"
  on public.dimension_scores for insert
  with check (exists (
    select 1 from public.diagnosis_reports
    where diagnosis_reports.id = dimension_scores.report_id
    and diagnosis_reports.user_id = auth.uid()
  ));

create policy "用户可以更新自己的维度得分"
  on public.dimension_scores for update
  using (exists (
    select 1 from public.diagnosis_reports
    where diagnosis_reports.id = dimension_scores.report_id
    and diagnosis_reports.user_id = auth.uid()
  ));

create policy "用户可以删除自己的维度得分"
  on public.dimension_scores for delete
  using (exists (
    select 1 from public.diagnosis_reports
    where diagnosis_reports.id = dimension_scores.report_id
    and diagnosis_reports.user_id = auth.uid()
  ));

-- 4. 训练答题记录表
create table if not exists public.training_records (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references public.profiles(id) on delete cascade not null,
  dimension         text not null,            -- 题目所属维度
  difficulty        smallint default 3,       -- 1-5
  question_scenario text not null,            -- 题目场景
  user_answer       text,                     -- 用户答案
  ai_feedback       jsonb,                    -- AI 评分反馈
  score             smallint,                 -- 0-100
  created_at        timestamptz default now()
);

alter table public.training_records enable row level security;

create policy "用户可以查看自己的训练记录"
  on public.training_records for select
  using (auth.uid() = user_id);

create policy "用户可以创建训练记录"
  on public.training_records for insert
  with check (auth.uid() = user_id);

create policy "用户可以更新自己的训练记录"
  on public.training_records for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 5. 特训冲刺记录表
create table if not exists public.bootcamp_records (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references public.profiles(id) on delete cascade not null,
  current_day       smallint default 0,       -- 0-5
  resume_analysis   jsonb,                    -- 简历解析结果
  interview_logs    jsonb default '[]',       -- 面试记录数组
  status            text default 'not_started', -- not_started, in_progress, completed
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

alter table public.bootcamp_records enable row level security;

create policy "用户可以查看自己的特训记录"
  on public.bootcamp_records for select
  using (auth.uid() = user_id);

create policy "用户可以创建自己的特训记录"
  on public.bootcamp_records for insert
  with check (auth.uid() = user_id);

create policy "用户可以更新自己的特训记录"
  on public.bootcamp_records for update
  using (auth.uid() = user_id);

-- 6. 用户设置表（含 AI 模型配置）
create table if not exists public.user_settings (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references public.profiles(id) on delete cascade unique not null,
  ai_provider       text default 'deepseek',    -- deepseek, custom
  ai_model          text default 'deepseek-v4-flash',
  ai_api_key        text,                       -- 加密存储
  ai_reasoning      boolean default true,
  custom_api_url    text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

alter table public.user_settings enable row level security;

create policy "用户可以查看自己的设置"
  on public.user_settings for select
  using (auth.uid() = user_id);

create policy "用户可以创建自己的设置"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

create policy "用户可以更新自己的设置"
  on public.user_settings for update
  using (auth.uid() = user_id);

-- 7. 成长曲线快照表（每天或每次诊断后记录）
create table if not exists public.growth_snapshots (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.profiles(id) on delete cascade not null,
  snapshot_date   date default current_date,
  dimension_scores jsonb,   -- {"strategic_thinking": 85, "system_design": 65, ...}
  overall_score   smallint,
  training_count  integer default 0,
  created_at      timestamptz default now()
);

alter table public.growth_snapshots enable row level security;

create policy "用户可以查看自己的成长快照"
  on public.growth_snapshots for select
  using (auth.uid() = user_id);

create policy "用户可以创建成长快照"
  on public.growth_snapshots for insert
  with check (auth.uid() = user_id);

create policy "用户可以更新自己的成长快照"
  on public.growth_snapshots for update
  using (auth.uid() = user_id);

create policy "用户可以删除自己的成长快照"
  on public.growth_snapshots for delete
  using (auth.uid() = user_id);

-- 8. 训练会话表（每日生成的 5 道题）
create table if not exists public.training_sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.profiles(id) on delete cascade not null,
  session_date    date not null default current_date,
  questions       jsonb not null default '{}'::jsonb,  -- {"战略思维": "题目文本", ...}
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique(user_id, session_date)
);

alter table public.training_sessions enable row level security;

create policy "用户可以查看自己的训练会话"
  on public.training_sessions for select
  using (auth.uid() = user_id);

create policy "用户可以创建自己的训练会话"
  on public.training_sessions for insert
  with check (auth.uid() = user_id);

create policy "用户可以更新自己的训练会话"
  on public.training_sessions for update
  using (auth.uid() = user_id);

create policy "用户可以删除自己的训练会话"
  on public.training_sessions for delete
  using (auth.uid() = user_id);

-- 9. 题目质量反馈表（点赞/点踩）
create table if not exists public.question_feedback (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.profiles(id) on delete cascade not null,
  question_hash   text not null,
  feedback_type   text not null check (feedback_type in ('up', 'down')),
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

create policy "用户可以删除自己的反馈"
  on public.question_feedback for delete
  using (auth.uid() = user_id);

-- Case Library: AI-generated product case study articles
create table if not exists public.case_articles (
  id                uuid primary key default gen_random_uuid(),
  product_name      text not null,
  perspective       text not null,
  perspective_label text not null,
  content           text not null,
  summary           text,
  created_at        timestamptz default now(),
  unique(product_name, perspective)
);

alter table public.case_articles enable row level security;

create policy "所有认证用户可读案例文章"
  on public.case_articles for select
  using (auth.role() = 'authenticated');

create policy "认证用户可创建案例文章"
  on public.case_articles for insert
  with check (auth.role() = 'authenticated');

-- 注意：案例文章表没有 user_id 字段，默认行为是共享内容池
-- 所有认证用户均可读写删改。如需限制为仅创建者可删改，
-- 需要新增 created_by 字段并调整策略。
create policy "认证用户可删除案例文章"
  on public.case_articles for delete
  using (auth.role() = 'authenticated');

create policy "认证用户可更新案例文章"
  on public.case_articles for update
  using (auth.role() = 'authenticated');

-- ==========================================================
-- 10. 训练营会话表
-- ==========================================================
create table if not exists public.bootcamp_sessions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references public.profiles(id) on delete cascade unique not null,
  status              text default 'not_started',  -- not_started, in_progress, completed
  current_day         smallint default 0,          -- 0-3 (0=简历上传阶段)
  resume_text         text,                        -- 提取的原始简历文本
  parsed_profile      jsonb,                       -- 结构化解析结果
  weakness_prediction jsonb,                       -- 薄弱项预测报告
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

alter table public.bootcamp_sessions enable row level security;

create policy "用户可以查看自己的训练营会话"
  on public.bootcamp_sessions for select
  using (auth.uid() = user_id);

create policy "用户可以创建自己的训练营会话"
  on public.bootcamp_sessions for insert
  with check (auth.uid() = user_id);

create policy "用户可以更新自己的训练营会话"
  on public.bootcamp_sessions for update
  using (auth.uid() = user_id);

create policy "用户可以删除自己的训练营会话"
  on public.bootcamp_sessions for delete
  using (auth.uid() = user_id);

-- ==========================================================
-- 11. 训练营面试题表（每日 5 道题）
-- ==========================================================
create table if not exists public.bootcamp_interviews (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid references public.bootcamp_sessions(id) on delete cascade not null,
  day_number      smallint not null,               -- 1-3
  question_index  smallint not null,               -- 1-5
  question_text   text not null,
  question_type   text,                            -- strategy, system_design, data_driven, user_insight, business_thinking
  difficulty      smallint default 1,              -- 1-5
  user_answer     text,
  ai_evaluation   jsonb,                           -- {overall_score, structure, logic, professionalism, innovation, feedback}
  status          text default 'pending',          -- pending, answered, evaluated
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique(session_id, day_number, question_index)
);

alter table public.bootcamp_interviews enable row level security;

create policy "用户可以查看自己的面试题"
  on public.bootcamp_interviews for select
  using (exists (
    select 1 from public.bootcamp_sessions
    where bootcamp_sessions.id = bootcamp_interviews.session_id
    and bootcamp_sessions.user_id = auth.uid()
  ));

create policy "用户可以创建自己的面试题"
  on public.bootcamp_interviews for insert
  with check (exists (
    select 1 from public.bootcamp_sessions
    where bootcamp_sessions.id = bootcamp_interviews.session_id
    and bootcamp_sessions.user_id = auth.uid()
  ));

create policy "用户可以更新自己的面试题"
  on public.bootcamp_interviews for update
  using (exists (
    select 1 from public.bootcamp_sessions
    where bootcamp_sessions.id = bootcamp_interviews.session_id
    and bootcamp_sessions.user_id = auth.uid()
  ));

create policy "用户可以删除自己的面试题"
  on public.bootcamp_interviews for delete
  using (exists (
    select 1 from public.bootcamp_sessions
    where bootcamp_sessions.id = bootcamp_interviews.session_id
    and bootcamp_sessions.user_id = auth.uid()
  ));

-- ==========================================================
-- 12. 训练营报告表（日报 + 综合报告）
-- ==========================================================
create table if not exists public.bootcamp_reports (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid references public.bootcamp_sessions(id) on delete cascade not null,
  report_type     text not null,                   -- daily, comprehensive
  day_number      smallint,                        -- 1-3 (日报)
  content         jsonb not null,                  -- 报告内容
  scores_snapshot jsonb,                           -- 分数快照（用于图表）
  created_at      timestamptz default now()
);

alter table public.bootcamp_reports enable row level security;

create policy "用户可以查看自己的训练营报告"
  on public.bootcamp_reports for select
  using (exists (
    select 1 from public.bootcamp_sessions
    where bootcamp_sessions.id = bootcamp_reports.session_id
    and bootcamp_sessions.user_id = auth.uid()
  ));

create policy "用户可以创建自己的训练营报告"
  on public.bootcamp_reports for insert
  with check (exists (
    select 1 from public.bootcamp_sessions
    where bootcamp_sessions.id = bootcamp_reports.session_id
    and bootcamp_sessions.user_id = auth.uid()
  ));

create policy "用户可以更新自己的训练营报告"
  on public.bootcamp_reports for update
  using (exists (
    select 1 from public.bootcamp_sessions
    where bootcamp_sessions.id = bootcamp_reports.session_id
    and bootcamp_sessions.user_id = auth.uid()
  ));

create policy "用户可以删除自己的训练营报告"
  on public.bootcamp_reports for delete
  using (exists (
    select 1 from public.bootcamp_sessions
    where bootcamp_sessions.id = bootcamp_reports.session_id
    and bootcamp_sessions.user_id = auth.uid()
  ));
