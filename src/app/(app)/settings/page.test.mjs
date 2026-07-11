import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

test("settings uses a compact form workspace", () => {
  assert.match(source, /text-\[28px\] font-bold leading-9 text-ink/);
  assert.match(source, /系统设置/);
  assert.match(source, /border-y border-line bg-white/);
  assert.doesNotMatch(source, /<PageHeader/);
  assert.doesNotMatch(source, /<Card/);
  assert.doesNotMatch(source, /rounded-xl/);
  assert.doesNotMatch(source, /shadow-sm/);
  assert.doesNotMatch(source, /配置你的 AI 模型参数/);
});

test("settings only asks for an API key for a custom provider", () => {
  assert.match(source, /provider === "custom" &&/);
  assert.match(source, /OpenAI 兼容/);
});

test("settings persists and reports save state inline", () => {
  assert.match(source, /fetch\("\/api\/settings"/);
  assert.match(source, /method: "POST"/);
  assert.match(source, /saveError/);
  assert.match(source, /role="alert"/);
  assert.match(source, /aria-pressed=\{reasoning\}/);
});
