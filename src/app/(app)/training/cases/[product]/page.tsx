"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getPerspectiveLabel } from "@/lib/cases/perspectives";
import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  FileText,
  Layers3,
  RefreshCw,
  Trash2,
} from "lucide-react";

interface Perspective {
  slug: string;
  label: string;
  article?: {
    id: string;
    summary: string | null;
    created_at: string;
  } | null;
}

interface ArticleData {
  id: string;
  content: string;
  summary: string | null;
  created_at: string;
}

interface ProductOption {
  name: string;
  enName?: string;
  articleCount?: number;
}

export default function ProductCasePage() {
  const params = useParams<{ product: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const productName = decodeURIComponent(params.product);
  const activePerspective = searchParams.get("perspective") || "overview";

  const [perspectives, setPerspectives] = useState<Perspective[]>([]);
  const [perspectivesLoading, setPerspectivesLoading] = useState(true);

  const [article, setArticle] = useState<ArticleData | null>(null);
  const [articleLoading, setArticleLoading] = useState(false);
  const [articleError, setArticleError] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const activePerspectiveLabel =
    perspectives.find((p) => p.slug === activePerspective)?.label ||
    getPerspectiveLabel(activePerspective);
  const generatedCount = perspectives.filter((p) => p.article).length;

  useEffect(() => {
    fetch(
      `/api/cases?action=get-product&product=${encodeURIComponent(productName)}`
    )
      .then((r) => r.json())
      .then((data) => setPerspectives(data.perspectives || []))
      .finally(() => setPerspectivesLoading(false));
  }, [productName]);

  useEffect(() => {
    fetch("/api/cases?action=list-products")
      .then((r) => r.json())
      .then((data) => setProducts(data.products || []))
      .catch(() => setProducts([]))
      .finally(() => setProductsLoading(false));
  }, []);

  const loadArticle = useCallback(
    (perspectiveSlug: string, forceRefresh = false) => {
      setArticle(null);
      setArticleError(null);
      setArticleLoading(true);
      const refreshParam =
        forceRefresh || searchParams.get("refresh") === "true"
          ? "&refresh=true"
          : "";
      fetch(
        `/api/cases?product=${encodeURIComponent(productName)}&perspective=${perspectiveSlug}${refreshParam}`
      )
        .then(async (r) => {
          const data = await r.json();
          if (!r.ok)
            throw new Error(data.error || `请求失败 (${r.status})`);
          return data;
        })
        .then((data) => {
          if (data.article) setArticle(data.article);
        })
        .catch((err) => {
          setArticleError(err.message || "加载失败，请重试");
        })
        .finally(() => setArticleLoading(false));
    },
    [productName, searchParams]
  );

  useEffect(() => {
    loadArticle(activePerspective);
  }, [activePerspective, loadArticle]);

  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (
      !article ||
      !window.confirm("确定删除「" + productName + "」的这篇文章？")
    )
      return;
    setDeleting(true);
    try {
      const res = await fetch("/api/cases/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: productName,
          perspective: activePerspective,
        }),
      });
      if (res.ok) router.push("/training/cases");
    } catch {}
    setDeleting(false);
  }

  function switchPerspective(slug: string) {
    router.replace(
      `/training/cases/${encodeURIComponent(productName)}?perspective=${slug}`
    );
    setMobileNavOpen(false);
  }

  function switchProduct(nextProductName: string) {
    if (!nextProductName || nextProductName === productName) return;
    router.push(
      `/training/cases/${encodeURIComponent(nextProductName)}?perspective=${activePerspective}`
    );
  }

  return (
    <>
      <PageHeader
        title={productName}
        subtitle="切换视角，比较同类产品判断。"
        backHref="/training/cases"
        backLabel="返回案例库"
        actions={
          article ? (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => loadArticle(activePerspective, true)}
                disabled={articleLoading}
                icon={<RefreshCw className="w-4 h-4" />}
              >
                重新生成
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className="text-danger hover:bg-danger-soft"
                icon={<Trash2 className="w-4 h-4" />}
              >
                删除
              </Button>
            </div>
          ) : undefined
        }
      />

      <div className="mx-auto max-w-[1480px] px-4 py-5 sm:px-6 lg:px-8">
        <section className="mb-5 border-y border-line bg-white px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>案例拆解</Badge>
              <Badge variant="neutral">{activePerspectiveLabel}</Badge>
              <span className="font-mono text-label font-semibold text-ink-muted">
                {generatedCount}/{perspectives.length || 0} 个视角
              </span>
            </div>
            <div className="min-w-0 sm:w-[320px]">
              <label className="block rounded-md bg-surface px-3 py-2">
                <span className="text-label font-semibold text-ink-muted">
                  切换产品
                </span>
                <select
                  value={productName}
                  disabled={productsLoading}
                  onChange={(event) => switchProduct(event.target.value)}
                  className="mt-1 w-full bg-transparent text-body-md font-semibold text-ink outline-none disabled:opacity-50"
                >
                  <option value={productName}>
                    {productsLoading ? "加载产品中..." : productName}
                  </option>
                  {products
                    .filter((product) => product.name !== productName)
                    .map((product) => (
                      <option key={product.name} value={product.name}>
                        {product.name}
                        {product.articleCount != null
                          ? ` (${product.articleCount} 篇)`
                          : ""}
                      </option>
                    ))}
                </select>
              </label>
            </div>
          </div>
        </section>

        {/* Mobile and tablet perspective selector */}
        <div className="mb-4 lg:hidden">
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="flex w-full items-center justify-between rounded-lg border border-line bg-white px-4 py-3 text-body-md text-ink"
          >
            <span>
              {perspectives.find((p) => p.slug === activePerspective)
                ?.label || "选择视角"}
            </span>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-ink-muted transition-transform",
                mobileNavOpen && "rotate-180"
              )}
            />
          </button>
          {mobileNavOpen && (
            <div className="mt-2 animate-slide-down space-y-1 rounded-lg border border-line bg-white p-2">
              {perspectives.map((p) => {
                const isActive = p.slug === activePerspective;
                return (
                  <button
                    key={p.slug}
                    onClick={() => switchPerspective(p.slug)}
                    className={cn(
                      "w-full text-left px-4 py-2.5 rounded-lg text-body-sm transition-colors flex items-center gap-3",
                      isActive
                        ? "bg-primary-soft text-primary font-semibold"
                        : "text-ink-muted hover:bg-surface"
                    )}
                  >
                    <span className="flex-1">{p.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Desktop: reading rail + article */}
        <div className="grid min-h-[calc(100dvh-260px)] gap-7 lg:grid-cols-[300px_minmax(0,1fr)]">
          {/* Reading rail — desktop only */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-5">
              <section className="rounded-lg border border-line bg-white p-4">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Layers3 className="h-4 w-4 text-primary" strokeWidth={1.5} />
                    <p className="text-heading-sm font-semibold text-ink">
                      分析视角
                    </p>
                  </div>
                  <span className="rounded-md bg-surface px-2 py-1 font-mono text-label font-bold text-ink-muted">
                    {generatedCount}/{perspectives.length || 0}
                  </span>
                </div>

                {perspectivesLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} height="h-12" className="rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <nav className="space-y-1.5">
                    {perspectives.map((p) => {
                      const isActive = p.slug === activePerspective;
                      return (
                        <button
                          key={p.slug}
                          onClick={() => switchPerspective(p.slug)}
                          className={cn(
                            "w-full rounded-lg px-3 py-3 text-left text-body-sm transition-all duration-200",
                            isActive
                              ? "bg-primary-soft text-primary"
                              : "text-ink-muted hover:bg-surface"
                          )}
                        >
                          <span className="flex items-center gap-3">
                            <span className="flex-1 font-semibold">
                              {p.label}
                            </span>
                            <span
                              className={cn(
                                "h-2 w-2 rounded-full",
                                p.article ? "bg-secondary" : "bg-line-strong"
                              )}
                              aria-label={p.article ? "已生成" : "待生成"}
                            />
                          </span>
                          <span className="mt-1 flex items-center gap-1.5 text-label font-semibold text-ink-faint">
                            {p.article ? (
                              <>
                                <FileText
                                  className="h-3.5 w-3.5"
                                  strokeWidth={1.5}
                                />
                                已生成拆解
                              </>
                            ) : (
                              "切换后自动生成"
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </nav>
                )}
              </section>

              <section className="border-y border-line bg-white px-4 py-4">
                <div className="mb-3 flex items-center gap-2">
                  <BookOpen
                    className="h-4 w-4 text-primary"
                    strokeWidth={1.5}
                  />
                  <h3 className="text-heading-sm font-semibold text-ink">
                    阅读抓手
                  </h3>
                </div>
                <div className="space-y-3 text-body-sm leading-relaxed text-ink-muted">
                  <p>这篇重点看三个问题：</p>
                  <ol className="space-y-2">
                    <li>1. 它解决的核心 B 端约束是什么？</li>
                    <li>2. 关键取舍背后的指标和边界是什么？</li>
                    <li>3. 哪些判断可以迁移到你的产品场景？</li>
                  </ol>
                  {article && (
                    <p className="flex items-center gap-1.5 border-t border-line pt-3 text-label font-semibold text-ink-faint">
                      <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.5} />
                      生成于{" "}
                      {new Date(article.created_at).toLocaleDateString("zh-CN")}
                    </p>
                  )}
                </div>
              </section>
            </div>
          </aside>

          {/* Article Content */}
          <main className="min-w-0 rounded-lg border border-line bg-white">
            {articleLoading ? (
              <div className="mx-auto max-w-[920px] space-y-3 px-5 py-10 sm:px-10">
                <Skeleton width="w-1/2" height="h-7" />
                <Skeleton height="h-4" className="w-11/12" />
                <Skeleton height="h-4" />
                <Skeleton height="h-4" className="w-5/6" />
                <Skeleton height="h-4" />
                <Skeleton height="h-4" className="w-2/3" />
                <div className="mt-5 rounded-lg border border-primary/15 bg-primary-soft px-4 py-3 text-body-sm text-primary">
                  AI 正在生成 {activePerspectiveLabel} 拆解...
                </div>
              </div>
            ) : articleError ? (
              <div className="mx-auto max-w-[620px] px-5 py-16 text-center">
                <p className="text-heading-sm font-semibold text-ink">
                  这篇拆解暂时没加载出来
                </p>
                <p className="mt-2 text-body-md text-danger">{articleError}</p>
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={() => loadArticle(activePerspective)}
                >
                  重试
                </Button>
              </div>
            ) : article ? (
              <article className="px-5 py-10 sm:px-10 lg:py-12">
                <div className="mx-auto max-w-[920px]">
                  <div className="markdown-content">
                    <ReactMarkdown>{article.content}</ReactMarkdown>
                  </div>
                  <p className="text-body-sm text-ink-faint mt-8 pt-4 border-t border-line">
                    生成时间:{" "}
                    {new Date(article.created_at).toLocaleDateString("zh-CN")}
                  </p>
                </div>
              </article>
            ) : null}
          </main>
        </div>
      </div>
    </>
  );
}
