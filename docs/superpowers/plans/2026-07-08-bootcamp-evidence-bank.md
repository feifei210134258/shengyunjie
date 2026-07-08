# Bootcamp Evidence Bank Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reframe `/bootcamp` from a generic interview sprint cockpit into an interview evidence bank that tells the user which proof assets are usable, missing, risky, and ready to rehearse.

**Architecture:** Keep the current no-schema path. Extend `src/lib/bootcamp/hub.ts` to derive an `evidenceBank` object from existing `bootcamp_sessions`, `bootcamp_interviews`, and `training_records`, expose it through `GET /api/bootcamp/hub`, and render it on the client page as the first-screen decision surface.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, Supabase via existing API route, Node test runner.

---

### Task 1: Domain Model

**Files:**
- Modify: `src/lib/bootcamp/hub.test.mjs`
- Modify: `src/lib/bootcamp/hub.ts`

- [ ] **Step 1: Write the failing test**

```js
test("derives an interview evidence bank with gaps, risks, and expression assets", () => {
  const result = buildBootcampHub({
    session: {
      status: "in_progress",
      current_day: 1,
      parsed_profile: {
        projects: [
          { name: "客户健康度评分系统" },
          { name: "审批流重构" },
        ],
      },
      weakness_prediction: {
        likely_gaps: [
          { area: "结果指标不清晰" },
          { area: "系统边界讲不透" },
        ],
      },
    },
    interviews: [
      { id: "i1", status: "evaluated", user_answer: "回答", ai_evaluation: {} },
    ],
    trainingRecords: [
      {
        id: "t1",
        ai_feedback: {
          interview_expression: {
            reusable_version: "我会先定义客户分层，再说明取舍。",
          },
        },
      },
    ],
  });

  assert.equal(result.evidenceBank.tellableProjects.count, 2);
  assert.equal(result.evidenceBank.proofGaps.count, 2);
  assert.equal(result.evidenceBank.followupRisks.count, 1);
  assert.equal(result.evidenceBank.expressionAssets.count, 1);
  assert.match(result.evidenceBank.primaryNextAction.label, /补证据|整理/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/lib/bootcamp/hub.test.mjs`
Expected: FAIL because `evidenceBank` is not returned.

- [ ] **Step 3: Write minimal implementation**

Add `evidenceBank` to `BootcampHub`, count tellable projects from `parsed_profile.projects`, proof gaps from `weakness_prediction`, follow-up risks from evaluated interviews, expression assets from revised answers or `interview_expression`, and choose a primary next action that points to `/bootcamp/story-bank` when gaps exist.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/lib/bootcamp/hub.test.mjs`
Expected: PASS.

### Task 2: API Contract

**Files:**
- Modify: `src/app/api/bootcamp/hub/route.test.mjs`
- Modify: `src/app/api/bootcamp/hub/route.ts`

- [ ] **Step 1: Write the failing source test**

Add assertions that `route.ts` returns `evidenceBank` and keeps selecting `parsed_profile`, `weakness_prediction`, `ai_evaluation`, and `ai_feedback`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/app/api/bootcamp/hub/route.test.mjs`
Expected: FAIL because the response does not include `evidenceBank`.

- [ ] **Step 3: Return evidenceBank**

Destructure `evidenceBank` from `buildBootcampHub` and include it in `NextResponse.json`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/app/api/bootcamp/hub/route.test.mjs`
Expected: PASS.

### Task 3: Page Reframe

**Files:**
- Modify: `src/app/(app)/bootcamp/page.test.mjs`
- Modify: `src/app/(app)/bootcamp/page.tsx`

- [ ] **Step 1: Write the failing source test**

Assert that the page fetches `evidenceBank`, displays `面试证据库`, `证据缺口`, `可讲项目`, `追问风险`, `表达资产`, and `下一步只做这件事`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test 'src/app/(app)/bootcamp/page.test.mjs'`
Expected: FAIL on missing evidence-bank text.

- [ ] **Step 3: Update UI**

Replace the first-screen heading and right rail with the evidence-bank framing while preserving existing links to story bank, interview, resume, and report. Use existing Tailwind/shadcn patterns, no new dependency, no schema change.

- [ ] **Step 4: Run focused tests**

Run: `node --test src/lib/bootcamp/hub.test.mjs src/app/api/bootcamp/hub/route.test.mjs 'src/app/(app)/bootcamp/page.test.mjs'`
Expected: PASS.

### Task 4: Documentation And Verification

**Files:**
- Modify: `docs/2026-05-19-pm-thinking-tool-design.md`
- Modify: `progress.md`
- Modify: `feature_list.json`

- [ ] **Step 1: Update docs and status**

Record that `/bootcamp` is now an interview evidence bank powered by existing persisted resume, interview, and training records.

- [ ] **Step 2: Run verification**

Run:
```bash
node --test src/lib/bootcamp/hub.test.mjs src/app/api/bootcamp/hub/route.test.mjs 'src/app/(app)/bootcamp/page.test.mjs' feature_list.test.mjs
npx tsc --noEmit
ESLINT_USE_FLAT_CONFIG=false npx eslint src/lib/bootcamp/hub.ts src/lib/bootcamp/hub.test.mjs src/app/api/bootcamp/hub/route.ts src/app/api/bootcamp/hub/route.test.mjs 'src/app/(app)/bootcamp/page.tsx' 'src/app/(app)/bootcamp/page.test.mjs' feature_list.test.mjs --max-warnings 0
node -e "JSON.parse(require('fs').readFileSync('feature_list.json','utf8')); console.log('feature_list JSON OK')"
git diff --check
npm run build
./init.sh
```

Expected: all commands exit 0.

- [ ] **Step 3: Commit**

Run:
```bash
git add src/lib/bootcamp/hub.ts src/lib/bootcamp/hub.test.mjs src/app/api/bootcamp/hub/route.ts src/app/api/bootcamp/hub/route.test.mjs 'src/app/(app)/bootcamp/page.tsx' 'src/app/(app)/bootcamp/page.test.mjs' docs/2026-05-19-pm-thinking-tool-design.md progress.md feature_list.json docs/superpowers/plans/2026-07-08-bootcamp-evidence-bank.md
git commit -m "feat: reframe bootcamp as evidence bank"
```
