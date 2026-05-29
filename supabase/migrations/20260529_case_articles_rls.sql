-- 为 case_articles 表添加 DELETE 和 UPDATE 的 RLS 策略
-- 注：PostgreSQL 不支持 CREATE POLICY IF NOT EXISTS，所以先 DROP 再 CREATE

drop policy if exists "认证用户可删除案例文章" on public.case_articles;
create policy "认证用户可删除案例文章"
  on public.case_articles for delete
  using (auth.role() = 'authenticated');

drop policy if exists "认证用户可更新案例文章" on public.case_articles;
create policy "认证用户可更新案例文章"
  on public.case_articles for update
  using (auth.role() = 'authenticated');
