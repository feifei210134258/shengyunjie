import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./card.tsx", import.meta.url), "utf8");

test("shared cards stay within the eight pixel workspace radius", () => {
  assert.match(source, /"rounded-lg transition-all/);
  assert.doesNotMatch(source, /"rounded-xl transition-all/);
  assert.doesNotMatch(source, /shadow-md/);
  assert.doesNotMatch(source, /hover:shadow-lg/);
});

test("shared loading and empty surfaces use the same radius", () => {
  const skeleton = readFileSync(new URL("./skeleton.tsx", import.meta.url), "utf8");
  const emptyState = readFileSync(new URL("./empty-state.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(skeleton, /rounded-xl/);
  assert.doesNotMatch(emptyState, /rounded-xl/);
});
