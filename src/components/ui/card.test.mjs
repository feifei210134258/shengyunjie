import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./card.tsx", import.meta.url), "utf8");

test("shared cards stay within the eight pixel workspace radius", () => {
  assert.match(source, /"rounded-lg transition-all/);
  assert.doesNotMatch(source, /"rounded-xl transition-all/);
});
