import test from "node:test";
import assert from "node:assert/strict";
import {
  CASE_PERSPECTIVES,
  getPerspectiveLabel,
} from "./perspectives.ts";

test("uses the same label for overview everywhere", () => {
  assert.equal(getPerspectiveLabel("overview"), "全局分析");
  assert.equal(CASE_PERSPECTIVES[0]?.label, "全局分析");
});

test("falls back to overview label for unknown perspective slugs", () => {
  assert.equal(getPerspectiveLabel("not-a-perspective"), "全局分析");
});
