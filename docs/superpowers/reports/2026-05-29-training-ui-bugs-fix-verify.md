# Training UI Bug Fixes — Verification Report

**Change:** 0529-training-ui-bugs
**Date:** 2026-05-29
**Verify Mode:** full

## Scale Assessment

| Metric | Value | Threshold |
|--------|-------|-----------|
| Tasks | 4 | ≤3 → light |
| Delta specs | 0 | ≤1 |
| Changed files | 8 | ≤4 |

**Result:** full 验证

## Verification Results

| # | Check | Result | Details |
|---|-------|--------|---------|
| 1 | tasks.md all completed | ✅ PASS | 4/4 tasks checked `[x]` |
| 2 | Changed files match tasks | ✅ PASS | 8 files across 4 tasks |
| 3 | Build (tsc + next build) | ✅ PASS | `npx tsc --noEmit` 0 errors, `npx next build` successful |
| 4 | Tests | ⏭️ N/A | No test framework configured |
| 5 | Security | ✅ PASS | No hardcoded keys, no unsafe operations |

## Bug Fix Verification

| Bug | Fix | Verification |
|-----|-----|-------------|
| 1. Regex edge case | Two-step cleanup (strip `**` then `题目：`) | Regex correctly handles `**题目：**` |
| 2. Double fetch | Removed direct `loadArticle()` in `switchPerspective` | Only `router.replace` triggers one load |
| 3. Case sensitivity | `productName.toLowerCase()` at API entry | All queries and INSERTs use lowercase |
| 4. Streak/tz | Local date strings + remove dead code | Streak calc uses `Asia/Shanghai` dates |

## Summary

**Result: ALL PASS** — 4 bugs fixed, build clean.

## Branch Status

Committed to branch `0529-training-ui-bugs` (5 commits). Pending merge to master.
