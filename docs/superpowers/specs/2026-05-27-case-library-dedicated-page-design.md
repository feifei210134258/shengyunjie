---
comet_change: case-library-dedicated-page
role: technical-design
canonical_spec: openspec
archived-with: 2026-05-28-case-library-dedicated-page
status: final
---

# Case Library — Dedicated Product Page (Technical Design)

## Architecture

```
src/app/(app)/training/cases/
├── page.tsx                    # Product listing (drawer removed)
└── [product]/
    └── page.tsx                # Product analysis page (NEW)
```

## Route Design

| Route | Purpose |
|-------|---------|
| `/training/cases` | Product grid + perspective filter (simplified, no drawer) |
| `/training/cases/[product]` | Dedicated product analysis page |
| `/training/cases/[product]?perspective=overview` | Default: global analysis |

## Component Tree

```
/training/cases/[product]/page.tsx (Client Component)
├── Header
│   ├── Back button (Link → /training/cases)
│   └── Product name (from params.product)
├── Layout (flex row)
│   ├── PerspectiveSidebar (left, ~220px)
│   │   └── Perspective items (from get-product API)
│   │       ├── Active: highlighted with bg-primary/10
│   │       ├── Cached: description icon + summary tooltip
│   │       └── Not cached: smart_toy icon
│   └── ArticleArea (right, flex-1)
│       ├── Loading: skeleton pulse
│       ├── Error: error message + retry button
│       └── Content: react-markdown in .markdown-content
└── Footer
    └── Generated timestamp
```

## Data Flow

```
Page mount
  │
  ├── 1. GET /api/cases?action=get-product&product={name}
  │      → Returns perspectives[] with article status per perspective
  │      → Renders sidebar
  │
  ├── 2. GET /api/cases?product={name}&perspective={searchParams.perspective || "overview"}
  │      → Returns cached article or triggers AI generation
  │      → Renders article content
  │
  └── Perspective switch (click sidebar item)
       ├── router.replace(`?perspective=${slug}`)
       └── useEffect triggers step 2 reload
```

## State Management

```typescript
// Page-level state (no global store needed)
const [perspectives, setPerspectives] = useState<Perspective[]>([]);  // sidebar items
const [perspectivesLoading, setPerspectivesLoading] = useState(true);
const [article, setArticle] = useState<ArticleData | null>(null);
const [articleLoading, setArticleLoading] = useState(false);
const [articleError, setArticleError] = useState<string | null>(null);
```

## API (unchanged)

- `GET /api/cases?action=get-product&product=X` — perspective list with cache status
- `GET /api/cases?product=X&perspective=Y` — get or generate article

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Product not found / API error | Show error message in article area |
| AI generation timeout | Show "加载失败，请重试" + retry button |
| Perspective list load fail | Show "无法加载视角列表" |

## Testing Strategy

1. TypeScript compilation (`npx tsc --noEmit`)
2. Production build (`npx next build`)
3. Kimi WebBridge e2e:
   - Navigate from product grid → dedicated page
   - Verify default "全局分析" loads
   - Switch perspectives → verify content updates
   - Back button → verify return to listing
   - Verify Markdown rendering (headings, bold, lists)
