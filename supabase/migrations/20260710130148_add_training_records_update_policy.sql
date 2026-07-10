drop policy if exists "用户可以更新自己的训练记录"
  on public.training_records;

create policy "用户可以更新自己的训练记录"
  on public.training_records for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
