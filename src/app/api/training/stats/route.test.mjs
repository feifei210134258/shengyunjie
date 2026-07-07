import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");

test("training stats exposes a review queue for records without second-pass revision", () => {
  assert.match(source, /reviewQueue/);
  assert.match(source, /__revision/);
  assert.match(source, /needsRevision/);
  assert.match(source, /revisionSavedAt/);
});
