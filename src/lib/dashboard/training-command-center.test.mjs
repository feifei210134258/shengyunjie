import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCommandCenter,
  getMissionActionLabel,
} from "./training-command-center.ts";

test("builds a mission-first command center without foregrounding old dimensions", () => {
  const result = buildCommandCenter({
    todayCount: 0,
    recentRecords: [],
    dimAverages: { strategic_thinking: 6.2 },
    profileWeaknesses: ["strategic_thinking"],
    latestReport: { id: "report-1" },
    date: new Date("2026-06-27T10:00:00+08:00"),
  });

  assert.equal(result.primary.kind, "training");
  assert.match(result.primary.title, /今日任务/);
  assert.doesNotMatch(result.primary.title, /战略思维|商业思维|数据决策/);
  assert.ok(result.primary.missionId);
  assert.equal(result.primary.missionId, "delivery-resource-conflict");
  assert.ok(result.primary.missionLabel);
  assert.notEqual(result.primary.missionLabel, result.primary.actionLabel);
  assert.ok(result.missionMap.length >= 8);
  assert.ok(result.missionMap.every((item) => item.missionLabel && item.actionLabel));
});

test("mission action labels stay distinct from task labels", () => {
  assert.equal(getMissionActionLabel("growth-funnel-diagnosis"), "分层归因");
  assert.equal(getMissionActionLabel("platform-abstraction"), "边界治理");
  assert.equal(getMissionActionLabel("ai-data-automation"), "采纳验证");
});

test("summarizes recent answer blind spots from feedback text", () => {
  const result = buildCommandCenter({
    todayCount: 2,
    recentRecords: [
      {
        id: "r1",
        dimension: "data_decision",
        score: 58,
        ai_feedback: {
          weakness: "你的回答指标拆解停在总转化率，没有分层归因，也没有验证闭环。",
        },
      },
      {
        id: "r2",
        dimension: "system_design",
        score: 64,
        ai_feedback: {
          improvement: "建议先明确约束边界和取舍标准，再设计灰度验证。",
        },
      },
    ],
    dimAverages: {},
    profileWeaknesses: [],
    latestReport: { id: "report-1" },
    date: new Date("2026-06-27T10:00:00+08:00"),
  });

  assert.ok(result.blindSpots.some((item) => item.label === "指标拆解停在表层"));
  assert.ok(result.blindSpots.some((item) => item.label === "缺少约束和取舍标准"));
  assert.equal(result.nextPractice.actionLabel, "分层归因");
});

test("builds two outcome paths for interview sprint and long-term thinking training", () => {
  const result = buildCommandCenter({
    todayCount: 1,
    recentRecords: [
      {
        id: "r1",
        dimension: "commercial_thinking",
        score: 72,
        ai_feedback: {
          improvement: "建议把商业影响、付费边界和续费风险讲成项目证据。",
        },
      },
    ],
    dimAverages: { commercial_thinking: 7.2 },
    profileWeaknesses: ["commercial_thinking"],
    latestReport: { id: "report-1" },
    hasCaseSimulation: true,
    bootcampSession: {
      status: "in_progress",
      currentDay: 2,
      hasResume: true,
      weaknessCount: 3,
    },
    date: new Date("2026-07-07T10:00:00+08:00"),
  });

  assert.equal(result.productPaths.length, 2);
  assert.deepEqual(
    result.productPaths.map((path) => path.id),
    ["interview_sprint", "thinking_training"]
  );

  const interviewPath = result.productPaths[0];
  assert.equal(interviewPath.label, "面试跳槽冲刺");
  assert.equal(interviewPath.href, "/bootcamp/story-bank");
  assert.match(interviewPath.promise, /项目经历|面试/);
  assert.match(interviewPath.statusLabel, /Day 2/);

  const trainingPath = result.productPaths[1];
  assert.equal(trainingPath.label, "高级产品思维训练");
  assert.equal(trainingPath.href, "/training/session");
  assert.match(trainingPath.promise, /真实任务|判断/);
  assert.equal(trainingPath.evidenceLabel, "今日 1 题 / 累计 1 条证据");
});
