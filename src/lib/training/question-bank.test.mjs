import test from "node:test";
import assert from "node:assert/strict";
import {
  formatTrainingQuestionSeed,
  getTrainingQuestionSeeds,
  getTrainingQuestionSeedById,
  getRecentQuestionFamiliesFromSeeds,
  pickTrainingQuestionSeed,
} from "./question-bank.ts";

test("training question bank covers the core dimensions with enough seed variety", () => {
  const seeds = getTrainingQuestionSeeds();
  const dimensions = new Set(seeds.map((seed) => seed.dimension));

  assert.ok(seeds.length >= 30);
  assert.ok(dimensions.has("战略思维"));
  assert.ok(dimensions.has("系统设计能力"));
  assert.ok(dimensions.has("数据决策能力"));
  assert.ok(dimensions.has("用户洞察与需求管理"));
  assert.ok(dimensions.has("商业思维"));
});

test("training seed selection avoids repeating the same family when history is crowded", () => {
  const seed = pickTrainingQuestionSeed({
    dimension: "战略思维",
    targetId: "business-outcome",
    recentFamilies: ["growth-gating", "growth-gating", "growth-gating"],
    recentQuestionTexts: [
      "免费试用缩短后是否要增加预约顾问开通",
      "免费试用缩短后是否要增加预约顾问开通",
    ],
  });

  assert.notEqual(seed.family, "growth-gating");
  assert.match(seed.title, /取舍|验证|优先级|套餐|商业化|指标/);
});

test("training seed selection also avoids today already asked questions", () => {
  const seed = pickTrainingQuestionSeed({
    dimension: "战略思维",
    targetId: "business-outcome",
    todayQuestionTexts: [
      "企业协作工具把免费试用从无限期改为 7 天，并把完整功能改为预约开通。",
    ],
  });

  assert.notEqual(seed.id, "seed-business-outcome-01");
});

test("training seed prompt block exposes source and variation metadata", () => {
  const seed = pickTrainingQuestionSeed({
    dimension: "系统设计能力",
    targetId: "system-boundary",
  });

  const block = formatTrainingQuestionSeed(seed);

  assert.match(block, /题库种子/);
  assert.match(block, /来源/);
  assert.match(block, /训练家族/);
  assert.match(block, /可用变化轴/);
  assert.match(block, /靶点禁区/);
});

test("training seed lookup and family extraction stay stable for prompt orchestration", () => {
  const seed = getTrainingQuestionSeedById("seed-data-causality-02");
  const families = getRecentQuestionFamiliesFromSeeds([
    "某实验把首页改版后转化率提升，但客服工单也同步上升。",
  ]);

  assert.equal(seed?.family, "experiment-guardrail");
  assert.ok(families.length <= 1);
});
