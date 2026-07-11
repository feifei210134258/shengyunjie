import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./page-header.tsx", import.meta.url), "utf8");

test("shared page header follows the compact workspace title scale", () => {
  assert.match(source, /text-\[28px\] font-bold leading-9 text-ink/);
  assert.match(source, /text-body-sm text-ink-muted/);
  assert.match(source, /flex-col gap-3 sm:flex-row/);
  assert.doesNotMatch(source, /text-display-lg/);
  assert.doesNotMatch(source, /text-body-lg/);
});
