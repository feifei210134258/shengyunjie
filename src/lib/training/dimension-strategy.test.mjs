import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  formatTrainingDimensionStrategy,
  getTrainingDimensionStrategy,
} from "./dimension-strategy.ts";

test("strategic thinking is scoped to business judgment instead of broad strategy essays", () => {
  const strategy = getTrainingDimensionStrategy("战略思维");
  const prompt = formatTrainingDimensionStrategy(strategy);

  assert.match(prompt, /业务判断与取舍/);
  assert.match(prompt, /产品动作反推业务意图/);
  assert.match(prompt, /验证判断的关键指标/);
  assert.doesNotMatch(prompt, /机会成本分析/);
  assert.doesNotMatch(prompt, /显性机会成本|隐性机会成本|显性成本|隐性成本/);
  assert.match(prompt, /禁止题型：[\s\S]*12\/18 个月战略路线图/);
  assert.match(prompt, /禁止题型：[\s\S]*寻找第二增长曲线/);
  assert.match(prompt, /禁止题型：[\s\S]*泛泛分析市场规模/);
  assert.match(prompt, /禁止题型：[\s\S]*抽象成本计算题/);
});

test("training generation prompt limits each question to exactly two judgment prompts", () => {
  const routeSource = readFileSync(
    new URL("../../app/api/train/route.ts", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(routeSource, /2-3\s*个具体判断问题/);
  assert.match(routeSource, /严格(?:包含|回答|要求用户回答)?\s*2\s*个具体判断问题/);
  assert.match(routeSource, /一个核心判断/);
  assert.match(routeSource, /一个落地、风险或验证追问/);
});

test("training generation prompt asks for framework-level answer guidance", () => {
  const routeSource = readFileSync(
    new URL("../../app/api/train/route.ts", import.meta.url),
    "utf8"
  );

  assert.match(routeSource, /答题提点/);
  assert.match(routeSource, /框架思维引导/);
  assert.match(routeSource, /降低.*上手门槛/);
  assert.match(routeSource, /可迁移/);
  assert.match(routeSource, /问题本质/);
  assert.match(routeSource, /拆解路径/);
  assert.match(routeSource, /判断闭环/);
  assert.doesNotMatch(routeSource, /不超过\s*25\s*字/);
  assert.doesNotMatch(routeSource, /极简提示/);
  assert.doesNotMatch(routeSource, /写下你的判断/);
});

test("training answer area presents guidance as a thinking framework", () => {
  const componentSource = readFileSync(
    new URL("../../components/training/TrainingSessionClient.tsx", import.meta.url),
    "utf8"
  );

  assert.match(componentSource, /思考框架/);
  assert.match(componentSource, /text-body-sm/);
  assert.match(componentSource, /hint\.length >= 30/);
  assert.doesNotMatch(componentSource, /先拆角色边界，再补异常护栏/);
});
