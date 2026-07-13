# Training Question Diversity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将日常训练从每个维度一种固定题型，改造为可轮换子能力、题型和场景的开放诊断出题，默认给出轻提示，作答后提供题目特定的评价与参考答案。

**Architecture:** 新增纯 TypeScript 能力目录与出题核心，由服务端根据近期 `training_records.ai_feedback.question_meta` 受控选择题目规格，再让 AI 输出结构化 JSON。API 对输出进行归一化、答案泄露检查和近期文本相似度检查；评卷携带本题标准并把元数据写入现有 JSONB，不改数据库 Schema。

**Tech Stack:** Next.js 15 App Router, TypeScript, Vercel AI SDK 4, DeepSeek OpenAI-compatible provider, React, Supabase JSONB, Node test runner.

---

### Task 1: Capability Catalog

**Files:**
- Create: `src/lib/training/capability-catalog.ts`
- Create: `src/lib/training/capability-catalog.test.mjs`

- [ ] **Step 1: Write the failing catalog integrity tests**

```js
import assert from "node:assert/strict";
import test from "node:test";
import {
  TRAINING_CAPABILITY_CATALOG,
  TRAINING_DIMENSIONS,
  getCapabilitiesForDimension,
} from "./capability-catalog.ts";

test("defines at least six advanced capabilities for every dimension", () => {
  for (const dimension of TRAINING_DIMENSIONS) {
    assert.ok(getCapabilitiesForDimension(dimension).length >= 6);
  }
});

test("uses globally unique capability ids and valid archetypes", () => {
  const ids = TRAINING_CAPABILITY_CATALOG.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(TRAINING_CAPABILITY_CATALOG.every((item) => item.archetypes.length >= 2));
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --experimental-strip-types --test src/lib/training/capability-catalog.test.mjs`

Expected: FAIL because `capability-catalog.ts` does not exist.

- [ ] **Step 3: Implement the catalog types and the 30 capability definitions**

```ts
export const TRAINING_DIMENSIONS = [
  "战略思维",
  "系统设计能力",
  "数据决策能力",
  "用户洞察与需求管理",
  "商业思维",
] as const;

export type TrainingDimension = (typeof TRAINING_DIMENSIONS)[number];
export type TrainingArchetypeId =
  | "decision_memo"
  | "ambiguous_diagnosis"
  | "discovery_plan"
  | "system_boundary"
  | "metric_review"
  | "counterfactual_review"
  | "stakeholder_challenge"
  | "executive_proposal";

export interface TrainingCapabilityDefinition {
  id: string;
  dimension: TrainingDimension;
  label: string;
  advancedBehavior: string;
  executionTrap: string;
  archetypes: TrainingArchetypeId[];
  evaluationFocus: string[];
}

export function getCapabilitiesForDimension(dimension: string) {
  return TRAINING_CAPABILITY_CATALOG.filter((item) => item.dimension === dimension);
}
```

The catalog must spell out these 30 stable IDs with the Chinese behavior, trap,
two or more applicable archetypes, and evaluation focus described by the spec:

```text
strategy.problem_scope
strategy.positioning_alignment
strategy.portfolio_sequencing
strategy.competitive_response
strategy.short_long_balance
strategy.boundary_choice
system.multi_role_workflow
system.governance_efficiency
system.domain_boundary
system.consistency_recovery
system.batch_concurrency_audit
system.legacy_evolution
data.metric_system
data.attribution
data.causal_validation
data.decision_threshold
data.measurement_bias
data.insight_to_action
insight.evidence_synthesis
insight.problem_definition
insight.role_conflict
insight.segmentation
insight.mvp_validation
insight.demand_evidence
commercial.value_capture
commercial.pricing_packaging
commercial.unit_economics
commercial.gtm_adoption
commercial.retention_expansion
commercial.roi_sustainability
```

No generated empty entries are allowed, and public hints must not expose book or method names.

- [ ] **Step 4: Run the catalog tests and verify GREEN**

Run: `node --experimental-strip-types --test src/lib/training/capability-catalog.test.mjs`

Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/training/capability-catalog.ts src/lib/training/capability-catalog.test.mjs
git commit -m "feat: define advanced product capability catalog"
```

### Task 2: Controlled Target Selection and Similarity

**Files:**
- Create: `src/lib/training/question-generation.ts`
- Create: `src/lib/training/question-generation.test.mjs`

- [ ] **Step 1: Write failing tests for rotation, exclusions, and trigram similarity**

```js
test("rotates capability and archetype combinations within a dimension", () => {
  const selected = [];
  for (let index = 0; index < 5; index += 1) {
    const target = selectTrainingTarget({
      dimension: "战略思维",
      recentMeta: selected.map((item) => item.meta),
      random: () => 0,
    });
    selected.push(target);
  }
  assert.equal(new Set(selected.map((item) => `${item.meta.subSkillId}|${item.meta.archetypeId}`)).size, 5);
});

test("excludes signatures generated earlier in the current round", () => {
  const first = selectTrainingTarget({ dimension: "数据决策能力", random: () => 0 });
  const second = selectTrainingTarget({
    dimension: "数据决策能力",
    excludedSignatures: [first.meta.signature],
    random: () => 0,
  });
  assert.notEqual(second.meta.signature, first.meta.signature);
});

test("detects a near rewrite with character trigram similarity", () => {
  const left = "续费率下降，需要判断新功能是否导致客户流失";
  const right = "客户续费率下滑，请判断是否由新上线功能造成流失";
  assert.ok(calculateChineseTrigramSimilarity(left, right) >= 0.35);
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `node --experimental-strip-types --test src/lib/training/question-generation.test.mjs`

Expected: FAIL because selection and similarity functions do not exist.

- [ ] **Step 3: Implement public types and deterministic weighted selection**

```ts
export interface TrainingQuestionMeta {
  dimension: TrainingDimension;
  subSkillId: string;
  archetypeId: TrainingArchetypeId;
  contextFamily: string;
  productStage: string;
  tensionId: string;
  answerFormat: string;
  signature: string;
}

export function selectTrainingTarget(input: {
  dimension: string;
  recentMeta?: TrainingQuestionMeta[];
  excludedSignatures?: string[];
  random?: () => number;
}): SelectedTrainingTarget {
  // Build only catalog-approved combinations, remove excluded signatures,
  // score recent subskill/archetype/context/tension frequency, and select
  // randomly among candidates with the lowest score.
}

export function calculateChineseTrigramSimilarity(left: string, right: string) {
  // Normalize punctuation/whitespace, build character trigrams, and return Jaccard.
}
```

- [ ] **Step 4: Run selection tests and verify GREEN**

Run: `node --experimental-strip-types --test src/lib/training/question-generation.test.mjs`

Expected: all selection and similarity tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/training/question-generation.ts src/lib/training/question-generation.test.mjs
git commit -m "feat: rotate training question targets"
```

### Task 3: Generated Question Normalization and Validation

**Files:**
- Modify: `src/lib/training/question-generation.ts`
- Modify: `src/lib/training/question-generation.test.mjs`

- [ ] **Step 1: Add failing normalization and quality-gate tests**

```js
test("normalizes a structured generated question", () => {
  const result = normalizeGeneratedTrainingQuestion({
    title: "该不该继续做大客户定制",
    scenario: "题设已知条件为……",
    task: "请做出判断，并说明哪些新证据会改变你的结论。",
    default_hint: "先区分一次性收入与可复用能力。",
    secondary_hint: "注意评估定制对之后客户的边际成本。",
    evaluation_criteria: [],
  }, selectedTarget);
  assert.equal(result.defaultHint, "先区分一次性收入与可复用能力。");
  assert.equal(result.questionMeta.signature, selectedTarget.meta.signature);
});

test("rejects questions that expose a named framework or answer steps", () => {
  const issues = validateGeneratedTrainingQuestion({
    ...validQuestion,
    task: "请使用 JTBD 框架，按目标、证据、取舍、验证四步回答。",
  }, []);
  assert.ok(issues.some((issue) => issue.code === "answer_leak"));
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `node --experimental-strip-types --test src/lib/training/question-generation.test.mjs`

Expected: FAIL because normalization and validation functions do not exist.

- [ ] **Step 3: Implement normalization and hard/soft validation issues**

```ts
export interface GeneratedTrainingQuestion {
  title: string;
  scenario: string;
  task: string;
  defaultHint: string;
  secondaryHint: string;
  evaluationCriteria: TrainingEvaluationCriterion[];
  questionMeta: TrainingQuestionMeta;
}

export function validateGeneratedTrainingQuestion(
  question: GeneratedTrainingQuestion,
  recentQuestionTexts: string[]
): QuestionValidationIssue[] {
  // Hard: missing fields, named methods/sources, explicit answer steps.
  // Soft: text similarity above calibrated threshold or excessive length.
}
```

- [ ] **Step 4: Run the tests and verify GREEN**

Run: `node --experimental-strip-types --test src/lib/training/question-generation.test.mjs`

Expected: all question-generation tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/training/question-generation.ts src/lib/training/question-generation.test.mjs
git commit -m "feat: validate generated training questions"
```

### Task 4: Structured Generate API

**Files:**
- Modify: `src/app/api/train/route.ts`
- Modify: `src/lib/training/personalization.ts`
- Create: `src/lib/training/personalization.test.mjs`

- [ ] **Step 1: Write failing tests for personalization metadata extraction**

```js
test("extracts recent question metadata from structured feedback", () => {
  const result = buildTrainingPersonalization({
    requestedDimension: "战略思维",
    recentRecords: [{
      question_scenario: "旧题",
      score: 60,
      ai_feedback: { question_meta: sampleMeta },
    }],
  });
  assert.deepEqual(result.recentQuestionMeta, [sampleMeta]);
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `node --experimental-strip-types --test src/lib/training/personalization.test.mjs`

Expected: FAIL because `recentQuestionMeta` is absent.

- [ ] **Step 3: Extend personalization and replace generate streaming with structured JSON**

Generate flow:

```ts
const target = selectTrainingTarget({
  dimension,
  recentMeta: personalization.recentQuestionMeta,
  excludedSignatures,
});

const { text } = await generateText({
  model: chatModel,
  system: buildQuestionGenerationPrompt(target, personalization),
  messages: [{ role: "user", content: "根据题目规格生成一道开放诊断题，只返回 JSON。" }],
});

const question = normalizeGeneratedTrainingQuestion(parseJsonFromAiText(text), target);
const issues = validateGeneratedTrainingQuestion(question, personalization.recentQuestions);
```

Hard validation failure retries once with issue descriptions. Soft similarity retries once and keeps the lower-similarity parseable candidate. Return `NextResponse.json({ question })`; preserve the existing `analyze` action until Task 5.

- [ ] **Step 4: Run targeted typecheck, tests, and ESLint**

Run:

```bash
node --experimental-strip-types --test src/lib/training/capability-catalog.test.mjs src/lib/training/question-generation.test.mjs src/lib/training/personalization.test.mjs
npx tsc --noEmit
npx eslint src/app/api/train/route.ts src/lib/training/capability-catalog.ts src/lib/training/question-generation.ts src/lib/training/personalization.ts --max-warnings 0
```

Expected: all tests pass, TypeScript exits 0, ESLint exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/train/route.ts src/lib/training/personalization.ts src/lib/training/personalization.test.mjs
git commit -m "feat: generate structured open-diagnosis questions"
```

### Task 5: Question-Specific Evaluation and Reference Answer

**Files:**
- Modify: `src/app/api/train/route.ts`
- Modify: `src/lib/training/personalization.ts`
- Modify: `src/lib/training/personalization.test.mjs`

- [ ] **Step 1: Write a failing evaluation normalization test**

```js
test("preserves question-specific criteria and reference answer", () => {
  const evaluation = normalizeTrainingEvaluation({
    overall_score: 7,
    criterion_scores: [{ id: "decision_boundary", score: 8, evidence: "…", gap: "…" }],
    reference_answer: "一份独立求解的决策备忘录",
    alternative_path: "若合规红线提前，另一路径更优。",
    ...minimumEvaluationFields,
  });
  assert.equal(evaluation.criterion_scores[0].id, "decision_boundary");
  assert.match(evaluation.reference_answer, /决策备忘录/);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --experimental-strip-types --test src/lib/training/personalization.test.mjs`

Expected: FAIL because new evaluation fields are absent.

- [ ] **Step 3: Extend analysis prompt and normalized evaluation**

The analyze request accepts `questionData`, `usedSecondaryHint`, and the user answer. The prompt must require independent solution before critique and return:

```ts
interface TrainingEvaluation {
  overall_score: number;
  scores: ExistingCommonScores;
  criterion_scores: Array<{
    id: string;
    label: string;
    score: number;
    evidence: string;
    gap: string;
  }>;
  feedback: string;
  strengths: string[];
  gaps: string[];
  suggestions: string[];
  thinking_framework: string[];
  reference_answer: string;
  improved_answer: string;
  alternative_path: string;
  next_practice: string;
  question_meta?: TrainingQuestionMeta;
  used_secondary_hint?: boolean;
}
```

Do not request or expose a methodology/book/source name. Keep `example_answer` as a compatibility alias derived from `reference_answer` for existing history views.

- [ ] **Step 4: Run targeted tests and typecheck**

Run:

```bash
node --experimental-strip-types --test src/lib/training/personalization.test.mjs
npx tsc --noEmit
```

Expected: tests pass and TypeScript exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/train/route.ts src/lib/training/personalization.ts src/lib/training/personalization.test.mjs
git commit -m "feat: evaluate question-specific product judgment"
```

### Task 6: Training Session UI and Persistence Payload

**Files:**
- Modify: `src/components/training/TrainingSessionClient.tsx`
- Modify: `src/components/training/TrainingEvaluationPanel.tsx`

- [ ] **Step 1: Add a failing pure rendering contract test**

Extract and test `getTrainingQuestionText(question)` and `getExcludedQuestionSignatures(questions)` in `question-generation.ts` so the client state contract is proven without a DOM test framework:

```js
test("collects generated signatures for regenerate exclusions", () => {
  const signatures = getExcludedQuestionSignatures({
    "战略思维": { questionMeta: { ...sampleMeta, signature: "a" } },
    "数据决策能力": { questionMeta: { ...sampleMeta, signature: "b" } },
  });
  assert.deepEqual(signatures.sort(), ["a", "b"]);
});
```

- [ ] **Step 2: Run test and verify RED**

Run: `node --experimental-strip-types --test src/lib/training/question-generation.test.mjs`

Expected: FAIL because the helper is absent.

- [ ] **Step 3: Update client state and UI**

`QuestionState` stores the full `GeneratedTrainingQuestion`. `generateQuestion` reads JSON instead of parsing AI stream lines and sends `excludedSignatures`. The question card:

- displays `defaultHint` by default under a neutral label such as `思考提示`;
- contains a `再给我一个提示` disclosure for `secondaryHint`;
- does not display framework or method names;
- keeps dimension and progress visible;
- submits the full question data and `usedSecondaryHint` for evaluation.

`TrainingEvaluationPanel` labels `reference_answer` as `参考答案`, renders criterion-specific feedback, and shows `alternative_path` as `另一种成立路径`. Existing historical `example_answer` continues to render.

The record payload stores:

```ts
ai_feedback: {
  ...evaluation,
  question_meta: question.questionMeta,
  used_secondary_hint: usedSecondaryHint,
}
```

- [ ] **Step 4: Run tests, typecheck, and targeted ESLint**

Run:

```bash
node --experimental-strip-types --test src/lib/training/question-generation.test.mjs src/lib/training/personalization.test.mjs
npx tsc --noEmit
npx eslint src/components/training/TrainingSessionClient.tsx src/components/training/TrainingEvaluationPanel.tsx --max-warnings 0
```

Expected: all commands exit 0 without warnings.

- [ ] **Step 5: Commit**

```bash
git add src/components/training/TrainingSessionClient.tsx src/components/training/TrainingEvaluationPanel.tsx src/lib/training/question-generation.ts src/lib/training/question-generation.test.mjs
git commit -m "feat: guide open-diagnosis training answers"
```

### Task 7: Batch Quality Audit

**Files:**
- Create: `scripts/audit-training-questions.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write a failing CLI smoke assertion**

The script supports a no-network fixture mode:

```bash
node scripts/audit-training-questions.mjs --fixture
```

Expected before implementation: command fails because the script does not exist.

- [ ] **Step 2: Implement fixture and live modes**

Fixture mode loads representative questions embedded in the script and prints JSON metrics. Live mode posts five generation requests per dimension to a running local app and reports:

```json
{
  "total": 25,
  "uniqueSignatures": 25,
  "coverageByDimension": {},
  "maxTextSimilarity": 0.0,
  "methodLeakCount": 0,
  "contextConcentration": {}
}
```

Add `"audit:training-questions": "node scripts/audit-training-questions.mjs"` to package scripts.

- [ ] **Step 3: Run fixture mode and verify GREEN**

Run: `node scripts/audit-training-questions.mjs --fixture`

Expected: exit 0 and JSON contains `methodLeakCount: 0`.

- [ ] **Step 4: Commit**

```bash
git add scripts/audit-training-questions.mjs package.json package-lock.json
git commit -m "test: add training question quality audit"
```

### Task 8: Runtime Audit, Documentation, and Full Verification

**Files:**
- Modify: `feature_list.json`
- Modify: `progress.md`

- [ ] **Step 1: Start the app and run the 25-question live audit**

Run in one terminal: `npm run dev -- --hostname 127.0.0.1 --port 3000`

Run in another: `npm run audit:training-questions -- --base-url http://127.0.0.1:3000`

Expected:

- 25 parseable questions;
- no repeated full signature;
- at least five subskills represented per dimension;
- no public method/source names;
- no same subskill + archetype pair repeated within each five-question sequence;
- report the highest text-similarity pairs for manual review.

- [ ] **Step 2: Exercise evaluation and persistence with a real authenticated session**

Submit one answer through `/training/session`, confirm the default hint is visible, reveal the optional second hint, and confirm the post-answer panel shows criterion feedback, a reference answer, and an alternative defensible path. Verify the resulting `training_records.ai_feedback` readback contains `question_meta` and `used_secondary_hint`.

- [ ] **Step 3: Update project state artifacts**

Record the exact test/audit results in `feature_list.json` under `training-001` and append a dated section to `progress.md` with decisions, verification evidence, and residual risks.

- [ ] **Step 4: Run complete verification**

Run:

```bash
node --experimental-strip-types --test src/lib/training/capability-catalog.test.mjs src/lib/training/question-generation.test.mjs src/lib/training/personalization.test.mjs
npx tsc --noEmit
npx eslint src/ --max-warnings 0
npx next build
./init.sh
git diff --check
```

Expected: every command exits 0 with no ignored warnings.

- [ ] **Step 5: Commit final artifacts**

```bash
git add feature_list.json progress.md
git commit -m "docs: record training question diversity verification"
```
