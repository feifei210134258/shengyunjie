import { createServerClient } from "@/lib/supabase-server";
import { generateText } from "ai";
import { getChatModel } from "@/lib/ai";
import { NextResponse } from "next/server";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PERSPECTIVES = [
  { slug: "overview", label: "全局分析" },
  { slug: "positioning", label: "产品定位" },
  { slug: "growth", label: "增长飞轮" },
  { slug: "business-model", label: "商业模式" },
  { slug: "pricing", label: "定价策略" },
  { slug: "architecture", label: "功能架构" },
  { slug: "competition", label: "竞争博弈" },
  { slug: "retention", label: "留存激活" },
  { slug: "ecosystem", label: "生态平台" },
];

const PRESET_PRODUCTS = [
  { name: "飞书", enName: "Feishu/Lark", description: "字节跳动旗下企业协作平台" },
  { name: "Notion", enName: "Notion", description: "模块化知识管理与协作工具" },
  { name: "Salesforce", enName: "Salesforce", description: "全球领先的 CRM 平台" },
  { name: "钉钉", enName: "DingTalk", description: "阿里巴巴旗下企业沟通协同平台" },
  { name: "企业微信", enName: "WeCom", description: "腾讯旗下企业通信与办公工具" },
  { name: "Figma", enName: "Figma", description: "云端协作设计工具" },
  { name: "Canva", enName: "Canva", description: "在线图形设计平台" },
  { name: "Zoom", enName: "Zoom", description: "视频会议与远程协作平台" },
  { name: "Slack", enName: "Slack", description: "团队即时通讯与协作平台" },
  { name: "飞猪", enName: "Fliggy", description: "阿里巴巴旗下在线旅游平台" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

async function generateArticle(
  productName: string,
  perspective: { slug: string; label: string },
) {
  const model = getChatModel(
    process.env.DEEPSEEK_API_KEY || "",
    "deepseek-v4-flash"
  );

  const isOverview = perspective.slug === "overview";
  const wordLimit = isOverview ? 1000 : 500;

  const questions = isOverview
    ? "请对「${productName}」进行全面的产品分析，涵盖产品定位、增长飞轮、商业模式、功能架构、竞争策略等方面。"
    : "请从「${perspective.label}」视角分析「${productName}」。";

  const result = await generateText({
    model,
    system: `你是资深 B 端产品分析专家。你的任务是对指定产品进行简洁、有洞察的拆解分析。

要求：
- 总字数控制在 ${wordLimit} 字以内
${isOverview ? "- 从多个维度进行综合分析，包括产品定位、增长模式、商业逻辑、功能演进等\n- 给出对产品经理的实用启示" : `- 聚焦于指定的分析视角（${perspective.label}），不需要面面俱到`}
- 每条观点要有具体事实或逻辑支撑，不空谈
- 如果对产品了解有限，只写确信的部分，不编造
- 使用 Markdown 格式组织内容，适当使用标题、列表、加粗等增强可读性`,
    messages: [
      {
        role: "user",
        content: `${questions}写一篇约 ${wordLimit} 字的产品拆解，使用 Markdown 格式。`,
      },
    ],
  });

  return result.text;
}

/* ------------------------------------------------------------------ */
/*  Route handler                                                      */
/* ------------------------------------------------------------------ */

export async function GET(req: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const productName = searchParams.get("product");
    const perspectiveSlug = searchParams.get("perspective");

    /* ------ List products ------ */

    if (action === "list-products") {
      // Get article counts per product
      const { data: articles } = await supabase
        .from("case_articles")
        .select("product_name");

      const articleCounts: Record<string, number> = {};
      articles?.forEach((a: any) => {
        const key = a.product_name.toLowerCase();
        articleCounts[key] = (articleCounts[key] || 0) + 1;
      });

      // Build product list with counts
      const products = PRESET_PRODUCTS.map((p) => ({
        name: p.name,
        enName: p.enName,
        description: p.description,
        articleCount: articleCounts[p.name.toLowerCase()] || 0,
      }));

      // Add custom products that have articles
      const allProductNames = new Set(
        PRESET_PRODUCTS.map((p) => p.name.toLowerCase())
      );
      const customProducts = new Map<string, number>();
      articles?.forEach((a: any) => {
        if (!allProductNames.has(a.product_name.toLowerCase())) {
          const count = customProducts.get(a.product_name) || 0;
          customProducts.set(a.product_name, count + 1);
        }
      });

      const customList = Array.from(customProducts.entries()).map(
        ([name, count]) => ({
          name,
          enName: "",
          description: "自定义产品",
          articleCount: count,
          isCustom: true,
        })
      );

      return NextResponse.json({
        products: [...products, ...customList],
        perspectives: PERSPECTIVES,
      });
    }

    /* ------ Get product articles ------ */

    if (action === "get-product" && productName) {
      const { data: articles } = await supabase
        .from("case_articles")
        .select("id, perspective, perspective_label, summary, created_at")
        .ilike("product_name", productName)
        .order("created_at", { ascending: false });

      // Build perspective map: which perspectives have articles
      const perspectiveMap: Record<
        string,
        { id: string; summary: string | null; created_at: string } | null
      > = {};
      PERSPECTIVES.forEach((p) => {
        perspectiveMap[p.slug] = null;
      });
      articles?.forEach((a: any) => {
        perspectiveMap[a.perspective] = {
          id: a.id,
          summary: a.summary,
          created_at: a.created_at,
        };
      });

      return NextResponse.json({
        product: productName,
        perspectives: PERSPECTIVES.map((p) => ({
          ...p,
          article: perspectiveMap[p.slug] || undefined,
        })),
      });
    }

    /* ------ Read cached or generate article ------ */

    if (productName && perspectiveSlug) {
      const perspective = PERSPECTIVES.find(
        (p) => p.slug === perspectiveSlug
      );
      if (!perspective) {
        return NextResponse.json(
          { error: "无效的分析视角" },
          { status: 400 }
        );
      }

      // Check cache
      const { data: cached } = await supabase
        .from("case_articles")
        .select("id, content, summary, created_at")
        .ilike("product_name", productName)
        .eq("perspective", perspectiveSlug)
        .maybeSingle();

      if (cached) {
        return NextResponse.json({ article: cached, cached: true });
      }

      // Generate new article
      const content = await generateArticle(productName, perspective);

      // Extract summary (first 80 chars as a rough summary)
      const summary = content.slice(0, 80).replace(/\n/g, " ");

      // Write to cache
      const { data: inserted } = await supabase
        .from("case_articles")
        .insert({
          product_name: productName,
          perspective: perspectiveSlug,
          perspective_label: perspective.label,
          content,
          summary,
        })
        .select("id, content, summary, created_at")
        .single();

      return NextResponse.json({ article: inserted, cached: false });
    }

    /* ------ Invalid request ------ */

    return NextResponse.json(
      { error: "缺少必要参数。支持: action=list-products | action=get-product&product=X | product=X&perspective=Y" },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "服务器错误" },
      { status: 500 }
    );
  }
}