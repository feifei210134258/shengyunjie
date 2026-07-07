import test from "node:test";
import assert from "node:assert/strict";
import {
  getMissionPlanWithCachedQuestions,
  getDailyTrainingMissionPlan,
  getNextTrainingMission,
  getTrainingMissionForProfileFocus,
  getTrainingMissions,
} from "./training-missions.ts";

test("domestic senior product missions cover real work tasks instead of abstract dimensions", () => {
  const missions = getTrainingMissions();
  const taskTypes = new Set(missions.map((mission) => mission.taskType));
  const domains = new Set(missions.flatMap((mission) => mission.productDomains));
  const displayLabels = new Set(missions.map((mission) => mission.displayLabel));

  assert.ok(missions.length >= 12);
  assert.ok(taskTypes.has("业务增长判断"));
  assert.ok(taskTypes.has("商业化取舍"));
  assert.ok(taskTypes.has("项目推进与资源冲突"));
  assert.ok(taskTypes.has("平台/中台/系统抽象"));
  assert.ok(taskTypes.has("数据经营分析"));
  assert.ok(taskTypes.has("组织影响与协同推进"));
  assert.ok(domains.has("供应链协同"));
  assert.ok(domains.has("本地生活"));
  assert.ok(domains.has("数据产品"));
  assert.ok(displayLabels.has("质量发布"));
  assert.ok(displayLabels.has("流程自动化"));
  assert.ok(displayLabels.has("生态规则"));
});

test("mission display labels do not expose the old five-dimension framework", () => {
  const oldDimensions = new Set([
    "战略思维",
    "系统设计能力",
    "数据决策能力",
    "用户洞察与需求管理",
    "商业思维",
  ]);

  for (const mission of getTrainingMissions()) {
    assert.ok(mission.displayLabel);
    assert.ok(!oldDimensions.has(mission.displayLabel));
  }
});

test("mission action labels are more specific than task display labels", () => {
  for (const mission of getTrainingMissions()) {
    assert.ok(mission.label);
    assert.notEqual(mission.displayLabel, mission.label);
  }
});

test("daily mission plan starts from work missions and is not the old five-dimension order", () => {
  const plan = getDailyTrainingMissionPlan(new Date("2026-06-26T00:00:00Z"));

  assert.equal(plan.length, 5);
  assert.notEqual(plan[0].primaryDimension, "战略思维");
  assert.notDeepEqual(
    plan.map((mission) => mission.primaryDimension),
    ["战略思维", "系统设计能力", "数据决策能力", "用户洞察与需求管理", "商业思维"]
  );
});

test("manual replacement can move across mission task types", () => {
  const plan = getDailyTrainingMissionPlan(new Date("2026-06-26T00:00:00Z"));
  const next = getNextTrainingMission(plan[0].id);

  assert.ok(next);
  assert.notEqual(next.id, plan[0].id);
  assert.notEqual(next.taskType, plan[0].taskType);
});

test("cached replacement missions are restored into the active daily plan", () => {
  const fallbackPlan = getDailyTrainingMissionPlan(
    new Date("2026-06-26T00:00:00Z")
  );
  const restoredPlan = getMissionPlanWithCachedQuestions(
    ["platform-abstraction"],
    fallbackPlan
  );

  assert.equal(restoredPlan.length, fallbackPlan.length);
  assert.equal(restoredPlan[0].id, "platform-abstraction");
  assert.equal(
    restoredPlan.filter((mission) => mission.id === "platform-abstraction").length,
    1
  );
});

test("profile focus ids resolve to concrete senior PM missions", () => {
  assert.equal(
    getTrainingMissionForProfileFocus("strategic_thinking")?.id,
    "delivery-resource-conflict"
  );
  assert.equal(
    getTrainingMissionForProfileFocus("system_design")?.primaryDimension,
    "系统设计能力"
  );
  assert.equal(
    getTrainingMissionForProfileFocus("data_decision")?.id,
    "growth-funnel-diagnosis"
  );
  assert.equal(
    getTrainingMissionForProfileFocus("user_insight")?.id,
    "demand-problem-framing"
  );
  assert.equal(
    getTrainingMissionForProfileFocus("commercial_thinking")?.id,
    "commercial-packaging"
  );
});
