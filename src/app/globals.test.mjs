import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const globals = readFileSync(new URL("./globals.css", import.meta.url), "utf8");
const rootLayout = readFileSync(new URL("./layout.tsx", import.meta.url), "utf8");
const tailwind = readFileSync(new URL("../../tailwind.config.ts", import.meta.url), "utf8");

test("global visual tokens use one quiet light workspace system", () => {
  assert.match(tailwind, /bg: "#F6F7F5"/);
  assert.match(tailwind, /primary: "#3157D5"/);
  assert.match(tailwind, /success: "#24835B"/);
  assert.match(tailwind, /warning: "#C88624"/);
  assert.doesNotMatch(globals, /radial-gradient/);
  assert.doesNotMatch(globals, /gradient-border/);
  assert.doesNotMatch(rootLayout, /grain-overlay/);
});
