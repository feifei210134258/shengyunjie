"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PERSPECTIVE_ICONS: Record<string, string> = {
  overview: "dashboard",
  positioning: "gps_fixed",
  growth: "trending_up",
  "business-model": "account_balance",
  pricing: "sell",
  architecture: "account_tree",
  competition: "strategy",
  retention: "rocket_launch",
  ecosystem: "hub",
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ProductCasePage() {
  const params = useParams<{ product: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const productName = decodeURIComponent(params.product);
  const activePerspective = searchParams.get("perspective") || "overview";

  // Perspective sidebar
  const [perspectives, setPerspectives] = useState<Perspective[]>([]);
  const [perspectivesLoading, setPerspectivesLoading] = useState(true);

  // Article
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [articleLoading, setArticleLoading] = useState(false);
  const [articleError, setArticleError] = useState<string | null>(null);

  // Load perspective list
  useEffect(() => {
    fetch(
      `/api/cases?action=get-product&product=${encodeURIComponent(productName)}`
    )
      .then((r) => r.json())
      .then((data) => setPerspectives(data.perspectives || []))
      .finally(() => setPerspectivesLoading(false));
  }, [productName]);

  // Load article
  const loadArticle = useCallback(
    (perspectiveSlug: string) => {
      setArticle(null);
      setArticleError(null);
      setArticleLoading(true);
      fetch(
        `/api/cases?product=${encodeURIComponent(productName)}&perspective=${perspectiveSlug}`
      )
        .then(async (r) => {
          const data = await r.json();
          if (!r.ok) throw new Error(data.error || `请求失败 (${r.status})`);
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
    [productName]
  );

  useEffect(() => {
    loadArticle(activePerspective);
  }, [activePerspective, loadArticle]);

  // Switch perspective
  function switchPerspective(slug: string) {
    loadArticle(slug);
    router.replace(
      `/training/cases/${encodeURIComponent(productName)}?perspective=${slug}`
    );
  }

  /* ------ Render ------ */

  return (
    <div className="max-w-6xl mx-auto py-10 px-6">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/training/cases"
          className="inline-flex items-center gap-1.5 text-body-md text-on-surface-variant hover:text-on-surface transition-colors mb-3"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          返回案例库
        </Link>
        <h1 className="text-headline-lg font-bold text-on-surface">
          {productName}
        </h1>
      </div>

      {/* Content: sidebar + article */}
      <div className="flex gap-8">
        {/* Perspective Sidebar */}
        <aside className="w-[220px] shrink-0">
          {perspectivesLoading ? (
            <div className="space-y-2 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 bg-surface-container-high rounded-2xl"
                />
              ))}
            </div>
          ) : (
            <nav className="space-y-1.5">
              {perspectives.map((p) => {
                const icon = PERSPECTIVE_ICONS[p.slug] || "chevron_right";
                const isActive = p.slug === activePerspective;
                return (
                  <button
                    key={p.slug}
                    onClick={() => switchPerspective(p.slug)}
                    className={`w-full text-left px-4 py-3 rounded-2xl text-body-sm transition-colors flex items-center gap-3 ${
                      isActive
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    <span className={`material-symbols-outlined text-xl ${isActive ? "" : "opacity-50"}`}>
                      {icon}
                    </span>
                    <span className="flex-1">{p.label}</span>
                    {p.article && (
                      <span className="material-symbols-outlined text-sm opacity-40">
                        description
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          )}
        </aside>

        {/* Article Content */}
        <div className="flex-1 min-w-0">
          {articleLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-6 bg-surface-container-high rounded w-1/3" />
              <div className="h-4 bg-surface-container-high rounded" />
              <div className="h-4 bg-surface-container-high rounded" />
              <div className="h-4 bg-surface-container-high rounded w-5/6" />
              <div className="h-4 bg-surface-container-high rounded" />
              <div className="h-4 bg-surface-container-high rounded w-2/3" />
              <p className="text-body-sm text-on-surface-variant mt-4">
                AI 正在分析...
              </p>
            </div>
          ) : articleError ? (
            <div className="text-center py-16">
              <p className="text-body-md text-error">{articleError}</p>
              <button
                onClick={() => loadArticle(activePerspective)}
                className="mt-3 px-4 py-2 bg-primary text-white rounded-full text-body-sm"
              >
                重试
              </button>
            </div>
          ) : article ? (
            <article className="max-w-none">
              <div className="markdown-content text-body-md leading-relaxed text-on-surface">
                <ReactMarkdown>{article.content}</ReactMarkdown>
              </div>
              <p className="text-body-sm text-on-surface-variant mt-8 pt-4 border-t border-outline-variant">
                生成时间:{" "}
                {new Date(article.created_at).toLocaleDateString("zh-CN")}
              </p>
            </article>
          ) : null}
        </div>
      </div>
    </div>
  );
}