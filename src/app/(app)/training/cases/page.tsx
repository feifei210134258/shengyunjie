"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Product {
  name: string;
  enName: string;
  description: string;
  articleCount: number;
  isCustom?: boolean;
}

interface Perspective {
  slug: string;
  label: string;
  article?: { id: string; summary: string | null; created_at: string } | null;
}

interface ArticleData {
  id: string;
  content: string;
  summary: string | null;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CasesPage() {
  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [perspectives, setPerspectives] = useState<Perspective[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [selectedPerspective, setSelectedPerspective] = useState<
    string | null
  >(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerProduct, setDrawerProduct] = useState<string | null>(null);
  const [productPerspectives, setProductPerspectives] = useState<
    Perspective[]
  >([]);
  const [articleView, setArticleView] = useState<{
    perspective: string;
    label: string;
  } | null>(null);
  const [articleData, setArticleData] = useState<ArticleData | null>(null);
  const [articleLoading, setArticleLoading] = useState(false);
  const [articleError, setArticleError] = useState<string | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customProduct, setCustomProduct] = useState("");

  // Load product list
  useEffect(() => {
    fetch("/api/cases?action=list-products")
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.products || []);
        setPerspectives(data.perspectives || []);
      })
      .finally(() => setLoading(false));
  }, []);

  // Filter products by selected perspective
  const filteredProducts =
    selectedPerspective === null
      ? products
      : products.filter((p) => p.articleCount > 0); // approximate: if perspective selected, only show products with articles

  const activePerspectiveLabel =
    selectedPerspective === null
      ? "全部"
      : perspectives.find((p) => p.slug === selectedPerspective)?.label || "";

  /* ------ Drawer handlers ------ */

  function openProductDrawer(productName: string) {
    setDrawerProduct(productName);
    setArticleView(null);
    setArticleData(null);
    setDrawerOpen(true);
    // Fetch product perspectives
    fetch(`/api/cases?action=get-product&product=${encodeURIComponent(productName)}`)
      .then((r) => r.json())
      .then((data) => setProductPerspectives(data.perspectives || []));
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setDrawerProduct(null);
    setArticleView(null);
    setArticleData(null);
    setProductPerspectives([]);
  }

  function loadArticle(perspectiveSlug: string, perspectiveLabel: string) {
    setArticleView({ perspective: perspectiveSlug, label: perspectiveLabel });
    setArticleData(null);
    setArticleError(null);
    setArticleLoading(true);
    fetch(
      `/api/cases?product=${encodeURIComponent(drawerProduct || "")}&perspective=${perspectiveSlug}`
    )
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || `请求失败 (${r.status})`);
        return data;
      })
      .then((data) => {
        if (data.article) setArticleData(data.article);
      })
      .catch((err) => {
        setArticleError(err.message || "加载失败，请重试");
      })
      .finally(() => setArticleLoading(false));
  }

  function backToProductList() {
    setArticleView(null);
    setArticleData(null);
  }

  /* ------ Custom product ------ */

  function handleCustomSubmit() {
    const name = customProduct.trim();
    if (!name) return;
    setDrawerProduct(name);
    setArticleView(null);
    setArticleData(null);
    setProductPerspectives(
      perspectives.map((p) => ({ ...p, article: undefined }))
    );
    setDrawerOpen(true);
    setShowCustomInput(false);
    setCustomProduct("");
  }

  /* ------ Render ------ */

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-10 px-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-surface-container-high rounded w-48" />
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-9 w-20 bg-surface-container-high rounded-full"
              />
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-32 bg-surface-container-high rounded-2xl"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-headline-lg font-bold text-on-surface">案例库</h1>
        <p className="text-body-md text-on-surface-variant mt-1">
          拆解经典 B 端产品，理解产品思维框架
        </p>
      </div>

      {/* Perspective tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
        <button
          onClick={() => setSelectedPerspective(null)}
          className={`shrink-0 px-4 py-2 rounded-full text-body-sm transition-colors ${
            selectedPerspective === null
              ? "bg-primary text-white"
              : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container"
          }`}
        >
          全部
        </button>
        {perspectives.map((p) => (
          <button
            key={p.slug}
            onClick={() => setSelectedPerspective(p.slug)}
            className={`shrink-0 px-4 py-2 rounded-full text-body-sm transition-colors ${
              selectedPerspective === p.slug
                ? "bg-primary text-white"
                : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Product cards */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-3 block">
            menu_book
          </span>
          <p className="text-body-lg text-on-surface-variant">
            该视角下暂无案例
          </p>
          <p className="text-body-sm text-on-surface-variant mt-1">
            尝试自定义生成你感兴趣的产品分析
          </p>
          <button
            onClick={() => setShowCustomInput(true)}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-full text-body-sm"
          >
            自定义生成
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <button
              key={product.name}
              onClick={() => openProductDrawer(product.name)}
              className="text-left p-5 bg-surface-container-low hover:bg-surface-container rounded-2xl border border-outline-variant transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-headline-md text-on-surface">
                    {product.name}
                  </h3>
                  {product.enName && (
                    <p className="text-body-sm text-on-surface-variant">
                      {product.enName}
                    </p>
                  )}
                </div>
                {product.isCustom && (
                  <span className="material-symbols-outlined text-on-surface-variant text-lg">
                    edit
                  </span>
                )}
              </div>
              <p className="text-body-sm text-on-surface-variant mt-2 line-clamp-2">
                {product.description}
              </p>
              <div className="mt-3 flex items-center gap-1 text-body-sm text-secondary">
                <span className="material-symbols-outlined text-base">
                  article
                </span>
                <span>
                  {product.articleCount > 0
                    ? `${product.articleCount} 篇拆解`
                    : "点击探索"}
                </span>
              </div>
            </button>
          ))}

          {/* Custom product card */}
          {showCustomInput ? (
            <div className="p-5 bg-surface-container-low rounded-2xl border-2 border-dashed border-primary">
              <input
                type="text"
                value={customProduct}
                onChange={(e) => setCustomProduct(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
                placeholder="输入产品名称..."
                className="w-full bg-transparent text-body-md text-on-surface placeholder:text-on-surface-variant outline-none mb-3"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCustomSubmit}
                  disabled={!customProduct.trim()}
                  className="px-3 py-1.5 bg-primary text-white rounded-full text-label-bold disabled:opacity-40"
                >
                  开始分析
                </button>
                <button
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomProduct("");
                  }}
                  className="px-3 py-1.5 text-on-surface-variant text-label-bold"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCustomInput(true)}
              className="flex flex-col items-center justify-center gap-2 p-5 bg-surface-container-low hover:bg-surface-container rounded-2xl border border-dashed border-outline-variant transition-colors min-h-[140px]"
            >
              <span className="material-symbols-outlined text-3xl text-on-surface-variant">
                add_circle
              </span>
              <span className="text-body-sm text-on-surface-variant">
                自定义产品
              </span>
            </button>
          )}
        </div>
      )}

      {/* Article Drawer (Sheet) */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={closeDrawer}
          />

          {/* Drawer */}
          <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-surface-container-lowest z-50 shadow-xl overflow-y-auto">
            {/* Drawer header */}
            <div className="sticky top-0 bg-surface-container-lowest border-b border-outline-variant px-6 py-4 flex items-center gap-3 z-10">
              {articleView ? (
                <button
                  onClick={backToProductList}
                  className="material-symbols-outlined text-on-surface-variant hover:text-on-surface"
                >
                  arrow_back
                </button>
              ) : (
                <button
                  onClick={closeDrawer}
                  className="material-symbols-outlined text-on-surface-variant hover:text-on-surface"
                >
                  close
                </button>
              )}
              <h2 className="font-headline-md text-on-surface flex-1">
                {articleView
                  ? `${drawerProduct} · ${articleView.label}`
                  : drawerProduct}
              </h2>
            </div>

            {/* Drawer content */}
            <div className="px-6 py-4">
              {articleView ? (
                /* Article reading view */
                articleLoading ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-4 bg-surface-container-high rounded w-3/4" />
                    <div className="h-4 bg-surface-container-high rounded" />
                    <div className="h-4 bg-surface-container-high rounded" />
                    <div className="h-4 bg-surface-container-high rounded w-5/6" />
                    <div className="h-4 bg-surface-container-high rounded" />
                    <div className="h-4 bg-surface-container-high rounded w-2/3" />
                    <p className="text-body-sm text-on-surface-variant mt-4">
                      AI 正在分析...
                    </p>
                  </div>
                ) : articleData ? (
                  <article className="max-w-none">
                    <div className="markdown-content text-body-md leading-relaxed text-on-surface">
                      <ReactMarkdown>{articleData.content}</ReactMarkdown>
                    </div>
                    <p className="text-body-sm text-on-surface-variant mt-6 pt-4 border-t border-outline-variant">
                      生成时间:{" "}
                      {new Date(articleData.created_at).toLocaleDateString(
                        "zh-CN"
                      )}
                    </p>
                  </article>
                ) : (
                  <div className="text-center">
                    <p className="text-body-md text-error">
                      {articleError || "加载失败，请重试"}
                    </p>
                    <button
                      onClick={() =>
                        loadArticle(articleView.perspective, articleView.label)
                      }
                      className="mt-3 px-4 py-2 bg-primary text-white rounded-full text-body-sm"
                    >
                      重试
                    </button>
                  </div>
                )
              ) : (
                /* Perspective list */
                <div className="space-y-1">
                  <p className="text-body-sm text-on-surface-variant mb-4">
                    选择分析视角，AI 将为你生成产品拆解
                  </p>
                  {productPerspectives.map((p) => (
                    <button
                      key={p.slug}
                      onClick={() => loadArticle(p.slug, p.label)}
                      className="w-full text-left px-4 py-3 rounded-xl hover:bg-surface-container transition-colors flex items-center justify-between"
                    >
                      <div>
                        <span className="text-body-md text-on-surface">
                          {p.label}
                        </span>
                        {p.article?.summary && (
                          <p className="text-body-sm text-on-surface-variant mt-0.5 line-clamp-1">
                            {p.article.summary}
                          </p>
                        )}
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant">
                        {p.article ? "description" : "smart_toy"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}