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

  const { error } = await supabase
    .from("case_articles")
    .delete()
    .ilike("product_name", product)
    .eq("perspective", perspective);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
