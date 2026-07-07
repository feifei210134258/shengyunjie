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
