# Training Question Quality Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不增加模型调用和过多 Prompt 限制的前提下，降低训练题答案形式集中、题型错配、过度提示与伪精确数据问题。

**Architecture:** 由纯 TypeScript 选择器承担跨维度题型轮换，能力目录为模型提供一句正向题型语义，质量校验器只识别四类明确坏题并复用现有单次重生成。API 和客户端协议保持不变。

**Tech Stack:** TypeScript, Node test runner, Next.js 15, Vercel AI SDK 4.

---

### Task 1: Cross-Dimension Archetype Rotation

**Files:**
- Modify: `src/lib/training/question-generation.test.mjs`
- Modify: `src/lib/training/question-generation.ts`

- [ ] **Step 1: Write the failing cross-dimension rotation test**

Add a test that selects one target for each of the five dimensions, appends every signature to `excludedSignatures`, and asserts five unique `archetypeId` values.

- [ ] **Step 2: Run the test and verify RED**

Run: `node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test src/lib/training/question-generation.test.mjs`

Expected: the new test fails because current-round metadata is filtered to the requested dimension.

- [ ] **Step 3: Implement global archetype scoring**

Parse all valid excluded signatures. Count subskills only for the requested dimension, but count archetypes, contexts and tensions across the whole round. Apply a strong current-round archetype penalty before the existing recent-history weights.

- [ ] **Step 4: Run the test and verify GREEN**

Run the Task 1 command and confirm all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/training/question-generation.ts src/lib/training/question-generation.test.mjs
git commit -m "feat: diversify answer formats across training round"
```

### Task 2: Positive Archetype Semantics and Lean Prompt

**Files:**
- Modify: `src/lib/training/capability-catalog.ts`
- Modify: `src/lib/training/capability-catalog.test.mjs`
- Modify: `src/lib/training/question-generation.ts`
- Modify: `src/lib/training/question-generation.test.mjs`

- [ ] **Step 1: Write failing tests**

Assert every archetype has a non-empty `taskBrief`, and assert a counterfactual target prompt contains the phrase “已经发生的决策和结果”.

- [ ] **Step 2: Run tests and verify RED**

Run both training catalog and question-generation test files. Expected: `taskBrief` is absent.

- [ ] **Step 3: Add the eight positive task briefs**

Extend `TRAINING_ARCHETYPES`, export `getArchetypeTaskBrief`, and include the selected brief in `buildQuestionGenerationPrompt` as `题型任务`.

- [ ] **Step 4: Simplify the generation principles**

Replace the eight detailed rules with five concise principles from the approved design. Keep the JSON schema, method/source confidentiality, hint layering and total-length contract.

- [ ] **Step 5: Run tests and commit**

```bash
node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test src/lib/training/capability-catalog.test.mjs src/lib/training/question-generation.test.mjs
git add src/lib/training/capability-catalog.ts src/lib/training/capability-catalog.test.mjs src/lib/training/question-generation.ts src/lib/training/question-generation.test.mjs
git commit -m "feat: guide training archetypes with lean prompts"
```

### Task 3: Narrow Quality Gates

**Files:**
- Modify: `src/lib/training/question-generation.ts`
- Modify: `src/lib/training/question-generation.test.mjs`
- Modify: `scripts/audit-training-questions.mjs`

- [ ] **Step 1: Write failing validation tests**

Create representative questions for `task_in_scenario`, `over_guided`, `hint_too_long`, and `pseudo_precision`; assert their issue codes and hard/soft severities.

- [ ] **Step 2: Run and verify RED**

Run the question-generation test file. Expected: the four new issue codes are missing.

- [ ] **Step 3: Implement the narrow validators**

Use small explicit patterns and length checks. Do not add general semantic scoring. Update the audit script so `hardIssueCount` continues to include all hard issues while method leak reporting remains unchanged.

- [ ] **Step 4: Run targeted verification and commit**

```bash
node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test src/lib/training/capability-catalog.test.mjs src/lib/training/question-generation.test.mjs src/lib/training/personalization.test.mjs src/lib/training/personalization.test.ts
npx tsc --noEmit
ESLINT_USE_FLAT_CONFIG=false npx eslint src/lib/training/capability-catalog.ts src/lib/training/question-generation.ts scripts/audit-training-questions.mjs --max-warnings 0
git add src/lib/training/question-generation.ts src/lib/training/question-generation.test.mjs scripts/audit-training-questions.mjs
git commit -m "feat: reject clearly malformed training questions"
```

### Task 4: Live Sample Review and Project Artifacts

**Files:**
- Modify: `feature_list.json`
- Modify: `progress.md`

- [ ] **Step 1: Start the development server and generate ten questions**

Generate two questions per dimension while preserving round exclusions. Record titles, archetypes, hints and validation results.

- [ ] **Step 2: Review the ten-question sample**

Confirm decision memos are no more than three, no task/archetype mismatch is visible, and no question contains a task duplicated in its scenario or macro pseudo-precision.

- [ ] **Step 3: Update project artifacts**

Append the implementation and sample evidence to `feature_list.json` and `progress.md`.

- [ ] **Step 4: Run full verification**

```bash
node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test src/lib/training/capability-catalog.test.mjs src/lib/training/question-generation.test.mjs src/lib/training/personalization.test.mjs src/lib/training/personalization.test.ts
npx tsc --noEmit
ESLINT_USE_FLAT_CONFIG=false npx eslint src/ --max-warnings 0
npx next build
./init.sh
git diff --check
```

- [ ] **Step 5: Commit final evidence**

```bash
git add feature_list.json progress.md
git commit -m "docs: record refined training question audit"
```
