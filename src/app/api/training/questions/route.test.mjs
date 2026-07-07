import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");

test("training question cache preserves mission metadata for refresh recovery", () => {
  assert.match(source, /missionId/);
  assert.match(source, /targetId/);
  assert.match(source, /targetLabel/);
  assert.match(source, /dimension:\s*String\(\s*question\?\.dimension/);
});

test("training question cache preserves prescription metadata for focused sessions", () => {
  assert.match(source, /profileFocus/);
  assert.match(source, /prescriptionId/);
});

test("training question cache can persist answer drafts inside the daily session", () => {
  assert.match(source, /draftAnswer/);
  assert.match(source, /question\?\.draftAnswer/);
  assert.match(source, /questions:\s*mergedQuestions/);
});
