# Brand Stair Icon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the education-style brand cap with the approved “阶梯 + 平台” mark and ship the same identity as the browser favicon.

**Architecture:** Add one reusable `BrandMark` React component for all in-app brand placements, and add a Next App Router `src/app/icon.svg` asset for browser tabs. Keep the change purely presentational: no database, API, auth, or prompt behavior changes.

**Tech Stack:** Next.js App Router, TypeScript, React SVG, Tailwind CSS, Node built-in test runner for source checks.

---

### Task 1: Brand Icon Regression Check

**Files:**
- Create: `src/components/brand/brand-mark.test.mjs`

- [ ] **Step 1: Write the failing test**

Create a Node source check that asserts the intended component and favicon exist, and that brand surfaces no longer import `GraduationCap`.

```js
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { test } from "node:test";

const brandFiles = [
  "src/components/TopNav.tsx",
  "src/app/(auth)/login/page.tsx",
  "src/app/(auth)/register/page.tsx",
  "src/components/auth/AuthShowcase.tsx",
];

test("brand surfaces use BrandMark instead of GraduationCap", () => {
  for (const file of brandFiles) {
    const source = readFileSync(file, "utf8");
    assert.match(source, /BrandMark/, `${file} should render BrandMark`);
    assert.doesNotMatch(source, /GraduationCap/, `${file} should not use GraduationCap`);
  }
});

test("brand mark component and favicon use the stair platform motif", () => {
  assert.ok(existsSync("src/components/brand/BrandMark.tsx"));
  assert.ok(existsSync("src/app/icon.svg"));

  const component = readFileSync("src/components/brand/BrandMark.tsx", "utf8");
  const favicon = readFileSync("src/app/icon.svg", "utf8");

  assert.match(component, /title.*升云阶阶梯标志/s);
  assert.match(component, /path d="M20 42h8v-8h8v-8h8v-8"/);
  assert.match(favicon, /path d="M20 42h8v-8h8v-8h8v-8"/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/components/brand/brand-mark.test.mjs`

Expected: FAIL because `BrandMark.tsx` and `src/app/icon.svg` do not exist yet and current brand surfaces still contain `GraduationCap`.

### Task 2: BrandMark Component and Favicon

**Files:**
- Create: `src/components/brand/BrandMark.tsx`
- Create: `src/app/icon.svg`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Add `BrandMark`**

Create a small reusable component with fixed internal SVG coordinates and configurable outer class names.

- [ ] **Step 2: Add App Router favicon**

Create `src/app/icon.svg` with the same deep teal rounded square, white platform stair path, and cyan top platform line.

- [ ] **Step 3: Add metadata icons**

Update `src/app/layout.tsx` metadata with `icons: { icon: "/icon.svg" }`.

### Task 3: Replace Brand Surfaces

**Files:**
- Modify: `src/components/TopNav.tsx`
- Modify: `src/app/(auth)/login/page.tsx`
- Modify: `src/app/(auth)/register/page.tsx`
- Modify: `src/components/auth/AuthShowcase.tsx`

- [ ] **Step 1: Replace imports**

Remove `GraduationCap` imports from brand surfaces and import `BrandMark`.

- [ ] **Step 2: Replace rendered icon wrappers**

Use `BrandMark` in TopNav, mobile login/register headers, and AuthShowcase. Preserve existing sizing and spacing by passing `className` values that match the old wrapper dimensions.

- [ ] **Step 3: Run regression check**

Run: `node --test src/components/brand/brand-mark.test.mjs`

Expected: PASS.

### Task 4: Verify, Record, Deploy

**Files:**
- Modify: `progress.md`
- Modify: `feature_list.json`

- [ ] **Step 1: Run local verification**

Run:

```bash
node --test src/components/brand/brand-mark.test.mjs
npx tsc --noEmit
npx eslint src/components/brand/BrandMark.tsx src/components/TopNav.tsx 'src/app/(auth)/login/page.tsx' 'src/app/(auth)/register/page.tsx' src/components/auth/AuthShowcase.tsx src/app/layout.tsx --max-warnings 0
npm run build
./init.sh
```

- [ ] **Step 2: Update project state**

Record verification evidence in `progress.md` and append the icon replacement evidence to `feature_list.json` under `ux-001`.

- [ ] **Step 3: Commit and push**

Commit the implementation and docs, then push `deploy/pm`.

- [ ] **Step 4: Deploy production**

Run:

```bash
ssh root@159.75.213.142 'cd /www/wwwroot/shengyunjie && bash scripts/deploy-production.sh'
```

- [ ] **Step 5: Production smoke check**

Verify the deployed page references the new icon asset and that the deployment script reports success.
