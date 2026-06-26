import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  formatTrainingTarget,
  formatTrainingDimensionStrategy,
  getTrainingTarget,
  getTrainingTargetsForDimension,
  getTrainingDimensionStrategy,
} from "./dimension-strategy.ts";
import { getNextTrainingMission } from "./training-missions.ts";

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
  assert.match(componentSource, /return null/);
  assert.doesNotMatch(componentSource, /const DIM_HINTS/);
  assert.doesNotMatch(componentSource, /业务判断问题：先识别目标与约束/);
  assert.doesNotMatch(componentSource, /先拆角色边界，再补异常护栏/);
});

test("cached generated question text is reparsed for framework guidance", () => {
  const componentSource = readFileSync(
    new URL("../../components/training/TrainingSessionClient.tsx", import.meta.url),
    "utf8"
  );

  assert.match(componentSource, /const parsed = parseGeneratedQuestionText\(text\)/);
  assert.match(componentSource, /parsed\.question/);
  assert.match(componentSource, /parsed\.hint/);
});

test("high-level product manager targets expand each base dimension into trainable capabilities", () => {
  const strategicTargets = getTrainingTargetsForDimension("战略思维");
  const dataTargets = getTrainingTargetsForDimension("数据决策能力");
  const systemTargets = getTrainingTargetsForDimension("系统设计能力");

  assert.ok(strategicTargets.some((target) => target.label === "业务结果判断"));
  assert.ok(strategicTargets.some((target) => target.label === "复杂取舍"));
  assert.ok(dataTargets.some((target) => target.label === "指标与因果"));
  assert.ok(systemTargets.some((target) => target.label === "系统边界"));

  const prompt = formatTrainingTarget(
    getTrainingTarget("战略思维", new Date("2026-06-22T00:00:00Z"))
  );

  assert.match(prompt, /高阶能力/);
  assert.match(prompt, /思考框架/);
  assert.match(prompt, /可用变化轴/);
  assert.match(prompt, /靶点禁区/);
});

test("training generation prompt uses target labels instead of only broad dimension tags", () => {
  const routeSource = readFileSync(
    new URL("../../app/api/train/route.ts", import.meta.url),
    "utf8"
  );

  assert.match(routeSource, /getTrainingTarget/);
  assert.match(routeSource, /本题靶点/);
  assert.match(routeSource, /训练靶点/);
  assert.match(routeSource, /targetId/);
  assert.match(routeSource, /getTrainingTargetById/);
  assert.match(routeSource, /产品类型、业务动作、冲突角色、指标组合和问题结构/);
});

test("answer status stays in the title row instead of aligning with framework guidance", () => {
  const componentSource = readFileSync(
    new URL("../../components/training/TrainingSessionClient.tsx", import.meta.url),
    "utf8"
  );

  assert.match(componentSource, /我的回答[\s\S]*未提交/);
  assert.match(componentSource, /未提交[\s\S]*思考框架/);
  assert.doesNotMatch(
    componentSource,
    /min-w-0 flex-1[\s\S]*思考框架[\s\S]*未提交/
  );
});

test("manual question replacement rotates mission instead of target inside one dimension", () => {
  const next = getNextTrainingMission("platform-abstraction");

  assert.ok(next);
  assert.equal(next.id, "data-product-governance");
  assert.notEqual(next.taskType, "平台/中台/系统抽象");

  const componentSource = readFileSync(
    new URL("../../components/training/TrainingSessionClient.tsx", import.meta.url),
    "utf8"
  );

  assert.match(componentSource, /getNextTrainingMission/);
  assert.match(componentSource, /setActiveMissions/);
  assert.match(componentSource, /targetState/);
  assert.match(componentSource, /targetId: targetState\.targetId/);
  assert.match(componentSource, /question\?\.targetLabel/);
  assert.doesNotMatch(componentSource, /getNextTrainingTarget/);
});
