import test from "node:test";
import assert from "node:assert/strict";
import {
  INTERVIEW_READY_MARKER,
  parseInterviewReadiness,
} from "./interview-readiness.ts";

test("detects the AI readiness marker and removes it from visible content", () => {
  const result = parseInterviewReadiness(
    `你的项目背景已经比较清楚了。\n${INTERVIEW_READY_MARKER}`
  );

  assert.equal(result.isReady, true);
  assert.equal(result.content, "你的项目背景已经比较清楚了。");
  assert.equal(result.content.includes(INTERVIEW_READY_MARKER), false);
});

test("keeps ordinary coach replies unchanged before the interview is ready", () => {
  const result = parseInterviewReadiness("能举一个最近推进跨团队协作的例子吗？");

  assert.equal(result.isReady, false);
  assert.equal(result.content, "能举一个最近推进跨团队协作的例子吗？");
});

test("removes readiness marker when replaceAll is unavailable", () => {
  const originalReplaceAll = String.prototype.replaceAll;
  try {
    Object.defineProperty(String.prototype, "replaceAll", {
      configurable: true,
      value: undefined,
    });

    const result = parseInterviewReadiness(
      `可以进入下一阶段了。${INTERVIEW_READY_MARKER}${INTERVIEW_READY_MARKER}`
    );

    assert.equal(result.isReady, true);
    assert.equal(result.content, "可以进入下一阶段了。");
  } finally {
    Object.defineProperty(String.prototype, "replaceAll", {
      configurable: true,
      value: originalReplaceAll,
    });
  }
});
