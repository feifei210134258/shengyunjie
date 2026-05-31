"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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



export default function CasesPage() {
  const router = useRouter();

  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customProduct, setCustomProduct] = useState("");

  // Load product list
  useEffect(() => {
    fetch("/api/cases?action=list-products")
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.products || []);
      })
      .finally(() => setLoading(false));
  }, []);

  /* ------ Custom product ------ */

  function handleCustomSubmit() {
    const name = customProduct.trim();
    if (!name) return;
    router.push(`/training/cases/${encodeURIComponent(name)}`);
    setShowCustomInput(false);
    setCustomProduct("");
  }

  /* ------ Render ------ */

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-10 px-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-surface-container-high rounded w-48" />
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

      {/* Product cards */}
      {products.length === 0 ? (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-3 block">
            menu_book
          </span>
          <p className="text-body-lg text-on-surface-variant">
            暂无案例
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
          {products.map((product) => (
            <button
              key={product.name}
              onClick={() =>
                router.push(
                  `/training/cases/${encodeURIComponent(product.name)}`
                )
              }
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

      </div>
  );
}