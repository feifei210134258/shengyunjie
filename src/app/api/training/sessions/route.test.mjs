import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");

test("daily training session API returns the latest persisted goal focus", () => {
  assert.match(source, /latestGoalFocus/);
  assert.match(source, /from\("growth_snapshots"\)/);
  assert.match(source, /__goalFocus/);
  assert.match(source, /completedDimensions,\s*nextIndex,\s*latestGoalFocus/);
});
