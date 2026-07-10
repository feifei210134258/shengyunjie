import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const featureList = JSON.parse(readFileSync("feature_list.json", "utf8"));

test("profile-001 tracks the persisted growth profile engine", () => {
  const feature = featureList.features.find((item) => item.id === "profile-001");
  assert.equal(feature.status, "completed");
  assert.match(feature.evidence, /\/api\/profile\/summary/);
  assert.match(feature.evidence, /growth_snapshots/);
  assert.match(feature.evidence, /Dashboard/);
});

test("profile-002 tracks the personalized recommendation engine", () => {
  const feature = featureList.features.find((item) => item.id === "profile-002");
  assert.equal(feature.status, "completed");
  assert.match(feature.evidence, /\/api\/profile\/recommendation/);
  assert.match(feature.evidence, /训练处方/);
  assert.match(feature.evidence, /growth_snapshots/);
});

test("ux-003 tracks the research-informed core workspace redesign", () => {
  const feature = featureList.features.find((item) => item.id === "ux-003");
  assert.ok(feature);
  assert.equal(feature.status, "in-progress");
  assert.deepEqual(feature.dependencies, ["ux-001", "training-001", "bootcamp-004"]);
  assert.match(feature.description, /Dashboard/);
  assert.match(feature.description, /训练首页/);
  assert.match(feature.description, /训练复盘/);
  assert.match(feature.description, /面试冲刺/);
  assert.match(feature.description, /不改数据库 schema/);
});
