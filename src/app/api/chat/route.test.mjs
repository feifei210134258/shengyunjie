import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");

test("asks the AI coach to signal when interview information is sufficient", () => {
  assert.match(source, /至少 3 轮有效回答/);
  assert.match(source, /用户背景、最近负责项目、关键产品决策、业务理解、协作推进、复盘反思/);
  assert.match(source, /INTERVIEW_READY_MARKER/);
});
