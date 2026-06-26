import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");

test("training question cache preserves mission metadata for refresh recovery", () => {
  assert.match(source, /missionId/);
  assert.match(source, /targetId/);
  assert.match(source, /targetLabel/);
  assert.match(source, /dimension:\s*String\(question\?\.dimension/);
});
