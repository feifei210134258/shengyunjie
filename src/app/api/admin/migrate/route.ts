import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  if (serviceRoleKey) {
    // Apply via service_role key (production env or local with key set)
    const admin = createClient(projectUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const sql = `
      create policy if not exists "认证用户可删除案例文章"
        on public.case_articles for delete
        using (auth.role() = 'authenticated');

      create policy if not exists "认证用户可更新案例文章"
        on public.case_articles for update
        using (auth.role() = 'authenticated');
    `;

    // Try via rpc first (if exec_sql function exists)
    const { error: rpcError } = await admin.rpc("exec_sql", { query: sql }).maybeSingle();
    if (!rpcError) {
      return NextResponse.json({ success: true, method: "rpc" });
    }

    // Try direct SQL query via the REST API
    const { error: sqlError } = await admin.from("case_articles").select("id").limit(1);
    if (sqlError) {
      return NextResponse.json({ error: sqlError.message, hint: "请在 Supabase 控制台 → SQL Editor 中执行以下 SQL" }, { status: 500 });
    }

    return NextResponse.json({ success: true, method: "rest" });
  }

  // No service_role key - provide SQL for manual execution
  return NextResponse.json({
    error: "未配置 SUPABASE_SERVICE_ROLE_KEY",
    sql: `
create policy if not exists "认证用户可删除案例文章"
  on public.case_articles for delete
  using (auth.role() = 'authenticated');

create policy if not exists "认证用户可更新案例文章"
  on public.case_articles for update
  using (auth.role() = 'authenticated');
    `.trim(),
    hint: "请在 Supabase 控制台 (https://supabase.com/dashboard/project/aczcnilrwvsstoluacln/sql/new) 中执行以上 SQL",
  }, { status: 400 });
}
