# Product Workspace Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the core authenticated product surfaces as a quiet, list-first senior-PM workspace while preserving all existing data and workflow behavior.

**Architecture:** Keep the current Next.js pages and API contracts. Introduce a responsive application shell and a small set of shared workspace primitives, then replace each page's presentation layer while retaining its existing fetch, save, deposit, copy, and navigation handlers. Tests remain source-level regression guards but will assert the new information architecture and prohibit the old black panels, giant hero copy, and duplicated conceptual labels.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS 3, lucide-react, existing Supabase APIs.

---

### Task 1: Register the redesign feature and lock the visual contract

**Files:**
- Modify: `feature_list.json`
- Modify: `feature_list.test.mjs`
- Test: `feature_list.test.mjs`

- [ ] **Step 1: Write the failing feature-list assertion**

Add an assertion that `ux-003` exists, is `in-progress`, covers the four core surfaces, and forbids schema changes.

- [ ] **Step 2: Run the test and confirm RED**

Run: `node --test feature_list.test.mjs`

Expected: failure because `ux-003` does not exist.

- [ ] **Step 3: Add the feature entry**

Add `ux-003` with dependencies `ux-001`, `training-001`, and `bootcamp-004`; set `current_feature` to `ux-003` and describe the research-informed workspace redesign.

- [ ] **Step 4: Run the test and confirm GREEN**

Run: `node --test feature_list.test.mjs`

Expected: all feature-list tests pass.

### Task 2: Build the responsive application shell

**Files:**
- Modify: `src/components/TopNav.test.mjs`
- Modify: `src/components/TopNav.tsx`
- Modify: `src/app/(app)/layout.tsx`
- Modify: `src/app/globals.css`
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Write failing navigation and token tests**

Assert that desktop navigation is an `aside`, labels are `今日`, `训练复盘`, `面试证据`, `能力画像`, mobile navigation remains available, and the source no longer uses a profile gradient or page-level gradient helpers.

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `node --test src/components/TopNav.test.mjs`

Expected: failure on the new labels and desktop shell structure.

- [ ] **Step 3: Implement the shell and visual tokens**

Refactor `TopNav` into a desktop sidebar plus mobile header. Change `AppLayout` to a responsive flex shell. Replace body gradients and grain with the warm neutral background, update primary/success/warning/danger colors, reduce radii, and add shared focus/pressed transitions.

- [ ] **Step 4: Run the focused test and confirm GREEN**

Run: `node --test src/components/TopNav.test.mjs`

Expected: navigation tests pass.

### Task 3: Replace the dashboard command deck with a focused queue

**Files:**
- Modify: `src/app/(app)/dashboard/page.test.mjs`
- Modify: `src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Write failing dashboard IA tests**

Assert the presence of `今日`, `优先 1`, `原回答`, `修正版`, `表达资产`, `进度`, and `最近证据`. Assert the absence of `资产流水线`, `今日主动作`, page-level `bg-ink`, and heading sizes above 32px.

- [ ] **Step 2: Run the dashboard test and confirm RED**

Run: `node --test 'src/app/(app)/dashboard/page.test.mjs'`

Expected: failure because the old command deck remains.

- [ ] **Step 3: Implement the focused queue**

Rewrite `PathFirstHero` as the 68/32 focused workspace. Preserve goal focus selection, target brief editing, target evidence deposit, final-answer copy, and primary-action routing. Convert secondary paths and evidence to rows and compact progress metrics. Restyle lower sections as continuous bands with dividers instead of floating card groups.

- [ ] **Step 4: Run the dashboard test and confirm GREEN**

Run: `node --test 'src/app/(app)/dashboard/page.test.mjs'`

Expected: all dashboard source tests pass.

### Task 4: Turn the training overview into a review-first queue

**Files:**
- Modify: `src/components/training/TrainingOverviewClient.test.mjs`
- Modify: `src/components/training/TrainingOverviewClient.tsx`

- [ ] **Step 1: Write failing training IA tests**

Assert `待处理`, `训练队列`, `目标与处方`, and `最近资产`; retain assertions for `reviewQueue`, `evidenceAssets`, goal focus, and recommendation APIs. Assert the absence of `今日作战台`, `作战顺序`, `行动证据带`, `训练资产流水线`, and `系统只推一个动作`.

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `node --test src/components/training/TrainingOverviewClient.test.mjs`

Expected: failure on the new labels and old-concept prohibitions.

- [ ] **Step 3: Implement the review-first workspace**

Keep all existing fetch and recommendation resolution logic. Replace the top composition with one review-first action, a row-based queue that merges revision and evidence assets, a narrow target/prescription aside, and a lower compact rhythm/archive section.

- [ ] **Step 4: Run the focused test and confirm GREEN**

Run: `node --test src/components/training/TrainingOverviewClient.test.mjs`

Expected: training overview tests pass.

### Task 5: Simplify the training history processing flow

**Files:**
- Modify: `src/app/(app)/training/history/[id]/page.test.mjs`
- Modify: `src/app/(app)/training/history/[id]/page.tsx`

- [ ] **Step 1: Write failing review-workspace tests**

Assert `原回答`, `AI 反馈`, `修正版`, `保存并入账`, and `返回训练队列`. Retain behavior checks for revision, expression-card deposit, thinking-upgrade deposit, and profile snapshots. Assert the absence of `复盘处理台`, `本轮处理顺序`, `入账动作台`, and page-level `bg-ink`.

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `node --test 'src/app/(app)/training/history/[id]/page.test.mjs'`

Expected: failure because the old processing-desk copy remains.

- [ ] **Step 3: Implement the three-stage review flow**

Restyle `ReviewProcessingDesk` and the page body into a light three-stage workspace. Keep the editable revision, save handler, expression card, thinking upgrade, migration check, clipboard behavior, and profile-ledger writebacks.

- [ ] **Step 4: Run the focused test and confirm GREEN**

Run: `node --test 'src/app/(app)/training/history/[id]/page.test.mjs'`

Expected: history page tests pass.

### Task 6: Rebuild bootcamp as an evidence queue

**Files:**
- Modify: `src/app/(app)/bootcamp/page.test.mjs`
- Modify: `src/app/(app)/bootcamp/page.tsx`

- [ ] **Step 1: Write failing bootcamp IA tests**

Assert `目标岗位`, `面试就绪`, `证据缺口`, `下一步`, and `证据工具`; retain API and story-bank assertions. Assert the absence of `目标证据令`, `下一步只做这件事`, page-level `bg-ink`, and four equal evidence cards.

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `node --test 'src/app/(app)/bootcamp/page.test.mjs'`

Expected: failure on the new structure.

- [ ] **Step 3: Implement the evidence queue**

Preserve `/api/bootcamp/hub`, evidence-bank metrics, goal brief, asset pipeline, and action routes. Present the main evidence gap as the single primary action, metrics as one summary row, gaps as ordered rows, and story/interview/report as compact tool links.

- [ ] **Step 4: Run the focused test and confirm GREEN**

Run: `node --test 'src/app/(app)/bootcamp/page.test.mjs'`

Expected: bootcamp tests pass.

### Task 7: Verify behavior, visual quality, and project artifacts

**Files:**
- Modify: `feature_list.json`
- Modify: `progress.md`
- Modify: `session-handoff.md` only if a residual risk remains

- [ ] **Step 1: Run all source and domain tests**

Run: `node --test $(rg --files -g '*.test.mjs')`

Expected: zero failed tests.

- [ ] **Step 2: Run static verification**

Run: `npx tsc --noEmit`

Run: `ESLINT_USE_FLAT_CONFIG=false npx eslint src/ --max-warnings 0`

Run: `npm run build`

Run: `git diff --check`

Expected: every command exits 0 with no warnings.

- [ ] **Step 3: Run local visual QA**

Start the production build on an unused port. Capture `/dashboard`, `/training`, one `/training/history/[id]`, and `/bootcamp` at 1440x1024 and 390x844. Verify no black panels, oversized headings, nested cards, clipped text, overlap, or horizontal scroll; verify the single-primary-action hierarchy.

- [ ] **Step 4: Update artifacts and final verification**

Set `ux-003` to `completed` only after visual and functional checks. Record commands and screenshot paths in `feature_list.json` and `progress.md`, then run `./init.sh`.

- [ ] **Step 5: Commit, push, and deploy**

Commit the redesign with a message describing the new work-focused UI. Push the current branch and deploy through the existing production workflow. Recheck `https://pm.imfly.site` with the user's browser session before marking the goal complete.
