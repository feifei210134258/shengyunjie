# Goal Brief Steering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Make the persisted goal brief drive recommendations, training sessions, question generation, AI feedback, and the visible training frame.

**Architecture:** Reuse the existing no-schema persistence path: `growth_snapshots.dimension_scores.__goalBrief` remains the source of truth, and `training_sessions.questions` caches the brief per generated mission. API aggregation reads the latest brief once and passes a normalized object through recommendation and training flows.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, Supabase via `supabase-js`, Vercel AI SDK streaming.

---

### Task 1: Recommendation Plan Uses Goal Brief

**Files:**
- Modify: `src/lib/profile/recommendation.ts`
- Test: `src/lib/profile/recommendation.test.mjs`
- Modify: `src/app/api/profile/recommendation/route.ts`
- Test: `src/app/api/profile/recommendation/route.test.mjs`

- [x] **Step 1: Write the failing tests**

Add tests proving `buildRecommendationPlan(profile, goalBrief)` mentions target role, scenario, and deadline in the training/interview recommendations, and proving the API reads `__goalBrief`.

- [x] **Step 2: Run test to verify it fails**

Run:
```bash
node --test src/lib/profile/recommendation.test.mjs src/app/api/profile/recommendation/route.test.mjs
```

Expected: FAIL because `buildRecommendationPlan` accepts only `profile`, and the route does not expose `latestGoalBrief`.

- [x] **Step 3: Implement minimal code**

Add a `GoalBrief` type, pass it as an optional second argument to `buildRecommendationPlan`, read latest `__goalBrief` in the API, and return it with the response.

- [x] **Step 4: Run test to verify it passes**

Run:
```bash
node --test src/lib/profile/recommendation.test.mjs src/app/api/profile/recommendation/route.test.mjs
```

Expected: PASS.

### Task 2: Training Session Restores Goal Brief

**Files:**
- Modify: `src/app/api/training/sessions/route.ts`
- Test: `src/app/api/training/sessions/route.test.mjs`
- Modify: `src/app/api/training/questions/route.ts`
- Test: `src/app/api/training/questions/route.test.mjs`

- [x] **Step 1: Write the failing tests**

Add source tests proving daily session responses include `latestGoalBrief`, and question cache preserves `goalBrief`.

- [x] **Step 2: Run test to verify it fails**

Run:
```bash
node --test src/app/api/training/sessions/route.test.mjs src/app/api/training/questions/route.test.mjs
```

Expected: FAIL because session response and cached question metadata do not contain `goalBrief`.

- [x] **Step 3: Implement minimal code**

Read `__goalBrief` from the same `growthSnapshots` query, return it as `latestGoalBrief`, and sanitize/cache `question.goalBrief` in `training_sessions.questions`.

- [x] **Step 4: Run test to verify it passes**

Run:
```bash
node --test src/app/api/training/sessions/route.test.mjs src/app/api/training/questions/route.test.mjs
```

Expected: PASS.

### Task 3: Training UI and AI Prompt Use Goal Brief

**Files:**
- Modify: `src/components/training/TrainingSessionClient.tsx`
- Test: `src/components/training/TrainingSessionClient.test.mjs`
- Modify: `src/app/api/train/route.ts`
- Test: `src/app/api/train/route.test.mjs`

- [x] **Step 1: Write the failing tests**

Add source tests proving the session client displays target role/scenario/deadline, passes `goalBrief` to generation and analysis, and the train route formats goal brief into both prompts.

- [x] **Step 2: Run test to verify it fails**

Run:
```bash
node --test src/components/training/TrainingSessionClient.test.mjs src/app/api/train/route.test.mjs
```

Expected: FAIL because `goalBrief` is not part of the flow.

- [x] **Step 3: Implement minimal code**

Add `GoalBrief` normalization, include it in `prescriptionMeta`, cache it with questions, render a compact "目标简报" panel in the pre-submit frame, and include it in `/api/train` request bodies and prompt context.

- [x] **Step 4: Run test to verify it passes**

Run:
```bash
node --test src/components/training/TrainingSessionClient.test.mjs src/app/api/train/route.test.mjs
```

Expected: PASS.

### Task 4: Documentation and Full Verification

**Files:**
- Modify: `docs/2026-05-19-pm-thinking-tool-design.md`
- Modify: `progress.md`
- Modify: `feature_list.json`

- [x] **Step 1: Update docs and status**

Record that goal brief now steers recommendation, training session frame, question generation, AI analysis, and question cache.

- [x] **Step 2: Run focused regression**

Run:
```bash
node --test src/lib/profile/recommendation.test.mjs src/app/api/profile/recommendation/route.test.mjs src/app/api/training/sessions/route.test.mjs src/app/api/training/questions/route.test.mjs src/components/training/TrainingSessionClient.test.mjs src/app/api/train/route.test.mjs feature_list.test.mjs
```

Expected: PASS.

- [x] **Step 3: Run project gates**

Run:
```bash
npx tsc --noEmit
ESLINT_USE_FLAT_CONFIG=false npx eslint src/lib/profile/recommendation.ts src/lib/profile/recommendation.test.mjs src/app/api/profile/recommendation/route.ts src/app/api/profile/recommendation/route.test.mjs src/app/api/training/sessions/route.ts src/app/api/training/sessions/route.test.mjs src/app/api/training/questions/route.ts src/app/api/training/questions/route.test.mjs src/components/training/TrainingSessionClient.tsx src/components/training/TrainingSessionClient.test.mjs src/app/api/train/route.ts src/app/api/train/route.test.mjs feature_list.test.mjs --max-warnings 0
node -e "JSON.parse(require('fs').readFileSync('feature_list.json','utf8')); console.log('feature_list JSON OK')"
git diff --check
npm run build
./init.sh
```

Expected: all commands exit 0.

- [x] **Step 4: Commit**

Run:
```bash
git add docs/superpowers/plans/2026-07-08-goal-brief-steering.md src/lib/profile/recommendation.ts src/lib/profile/recommendation.test.mjs src/app/api/profile/recommendation/route.ts src/app/api/profile/recommendation/route.test.mjs src/app/api/training/sessions/route.ts src/app/api/training/sessions/route.test.mjs src/app/api/training/questions/route.ts src/app/api/training/questions/route.test.mjs src/components/training/TrainingSessionClient.tsx src/components/training/TrainingSessionClient.test.mjs src/app/api/train/route.ts src/app/api/train/route.test.mjs docs/2026-05-19-pm-thinking-tool-design.md progress.md feature_list.json
git commit -m "feat: steer training with goal brief"
```
