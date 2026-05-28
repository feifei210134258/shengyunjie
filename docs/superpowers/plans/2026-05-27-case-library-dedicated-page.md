---
change: case-library-dedicated-page
design-doc: docs/superpowers/specs/2026-05-27-case-library-dedicated-page-design.md
base-ref: 72cd87e274033de882e4e23a3c6a48da33572d32
archived-with: 2026-05-28-case-library-dedicated-page
---

# Case Library Dedicated Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace case library drawer with a dedicated `/training/cases/[product]` page with left sidebar perspective switcher.

**Architecture:** Next.js App Router dynamic route with client component. Left sidebar (~220px) loads perspective list from `get-product` API, right content area renders AI-generated article via react-markdown. Perspective switching updates URL query param and reloads article.

**Tech Stack:** Next.js 15, React 19, TypeScript, react-markdown, Tailwind CSS (Material Design 3 tokens)

archived-with: 2026-05-28-case-library-dedicated-page
---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/app/(app)/training/cases/[product]/page.tsx` | **Create** | Product analysis page: sidebar + article |
| `src/app/(app)/training/cases/page.tsx` | **Modify** | Remove drawer, add router.push navigation |

### Task 1: Create `/training/cases/[product]/page.tsx`

**Files:**
- Create: `src/app/(app)/training/cases/[product]/page.tsx`

- [ ] **Step 1: Create the directory and page shell**

```bash
mkdir -p src/app/\(app\)/training/cases/\[product\]
```

- [ ] **Step 2: Write the full page component**

Create `src/app/(app)/training/cases/[product]/page.tsx`:

```tsx
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
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ProductCasePage() {
  const params = useParams<{ product: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const productName = decodeURIComponent(params.product);
  const activePerspective = searchParams.get("perspective") || "overview";

  // Perspective sidebar state
  const [perspectives, setPerspectives] = useState<Perspective[]>([]);
  const [perspectivesLoading, setPerspectivesLoading] = useState(true);

  // Article state
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [articleLoading, setArticleLoading] = useState(false);
  const [articleError, setArticleError] = useState<string | null>(null);

  // Load perspective list for this product
  useEffect(() => {
    fetch(
      `/api/cases?action=get-product&product=${encodeURIComponent(productName)}`
    )
      .then((r) => r.json())
      .then((data) => setPerspectives(data.perspectives || []))
      .finally(() => setPerspectivesLoading(false));
  }, [productName]);

  // Load article for current perspective
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
    router.replace(`/training/cases/${encodeURIComponent(productName)}?perspective=${slug}`);
  }

  // Find active perspective label
  const activeLabel =
    perspectives.find((p) => p.slug === activePerspective)?.label || "分析";

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
        <aside className="w-[200px] shrink-0">
          {perspectivesLoading ? (
            <div className="space-y-2 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-9 bg-surface-container-high rounded-xl"
                />
              ))}
            </div>
          ) : (
            <nav className="space-y-1">
              {perspectives.map((p) => (
                <button
                  key={p.slug}
                  onClick={() => switchPerspective(p.slug)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-body-sm transition-colors flex items-center justify-between ${
                    p.slug === activePerspective
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span>{p.label}</span>
                  {p.article && (
                    <span className="material-symbols-outlined text-base opacity-60">
                      description
                    </span>
                  )}
                </button>
              ))}
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
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors related to the new file.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(app\)/training/cases/\[product\]/page.tsx
git commit -m "feat: add dedicated product case page with sidebar perspective switcher"
```

### Task 2: Simplify product listing page (remove drawer)

**Files:**
- Modify: `src/app/(app)/training/cases/page.tsx`

- [ ] **Step 1: Remove drawer-related code and simplify page**

In `src/app/(app)/training/cases/page.tsx`:

**Remove state variables (lines 46-59):**
- Remove: `drawerOpen`, `drawerProduct`, `productPerspectives`, `articleView`, `articleData`, `articleLoading`, `articleError`
- Remove: `showCustomInput`, `customProduct`

**Remove handler functions (lines 84-145):**
- Remove: `openProductDrawer`, `closeDrawer`, `loadArticle`, `backToProductList`
- Remove: `handleCustomSubmit`

**Remove imports:**
- Remove: `import ReactMarkdown from "react-markdown"` (line 5)

**Remove types:**
- Remove: `ArticleData` interface (lines 25-29)

**Add router import:**
```typescript
import { useRouter } from "next/navigation";
```
Add `const router = useRouter();` at start of component.

**Change product card onClick:**
Replace `onClick={() => openProductDrawer(product.name)}` with:
```tsx
onClick={() => router.push(`/training/cases/${encodeURIComponent(product.name)}`)}
```

**Handle custom product:**
Replace the custom product input card onClick logic to navigate instead:
```tsx
onClick={() => {
  const name = customProduct.trim();
  if (!name) return;
  router.push(`/training/cases/${encodeURIComponent(name)}`);
}}
```

**Remove entire drawer block (lines 319-429):**
Remove everything from `{/* Article Drawer (Sheet) */}` comment to the closing `)` before the final `</div>`.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/training/cases/page.tsx
git commit -m "refactor: remove drawer from case listing, navigate to dedicated page instead"
```

### Task 3: Build verification

**Files:**
- None (verification only)

- [ ] **Step 1: Full production build**

Run: `npx next build`
Expected: Successful build with no errors.

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit any fixes**

If build or type check required changes, commit them:
```bash
git add -A
git commit -m "fix: build and type check fixes"
```
