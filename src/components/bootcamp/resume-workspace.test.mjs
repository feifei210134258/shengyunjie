import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const uploader = readFileSync(new URL("./ResumeUploader.tsx", import.meta.url), "utf8");
const preview = readFileSync(new URL("./ResumePreview.tsx", import.meta.url), "utf8");
const weaknesses = readFileSync(new URL("./WeaknessReport.tsx", import.meta.url), "utf8");

test("resume uploader is a compact segmented tool", () => {
  assert.doesNotMatch(uploader, /rounded-xl/);
  assert.doesNotMatch(uploader, /p-12/);
  assert.doesNotMatch(uploader, /这通常需要几十秒/);
  assert.match(uploader, /role="alert"/);
});

test("parsed resume and risks use continuous rows", () => {
  assert.match(preview, /divide-y divide-line border-y border-line/);
  assert.doesNotMatch(preview, /rounded-xl/);
  assert.match(weaknesses, /divide-y divide-line border-y border-line/);
  assert.doesNotMatch(weaknesses, /rounded-xl/);
  assert.doesNotMatch(weaknesses, /<Card key=/);
});
