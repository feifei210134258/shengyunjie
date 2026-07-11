import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

test("resume intake uses one compact task header", () => {
  assert.match(source, /title="简历证据"/);
  assert.match(source, /上传或粘贴简历，生成项目证据和追问风险/);
  assert.doesNotMatch(source, /text-display-md/);
  assert.doesNotMatch(source, /AI 将解析你的工作经历/);
  assert.doesNotMatch(source, /rounded-xl/);
  assert.match(source, /role="alert"/);
});
