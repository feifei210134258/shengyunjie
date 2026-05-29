import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { product, perspective } = await req.json();
  if (!product || !perspective) {
    return NextResponse.json({ error: "缺少 product 或 perspective 参数" }, { status: 400 });
  }

  const { data: deleted, error } = await supabase
    .from("case_articles")
    .delete()
    .ilike("product_name", product)
    .eq("perspective", perspective)
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!deleted || deleted.length === 0) {
    return NextResponse.json({ error: "未找到可删除的记录，可能是 RLS 策略未生效" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
