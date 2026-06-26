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

test("training seed selection escapes the SaaS pricing and rollout skeleton when today is crowded", () => {
  const crowdedTodayQuestions = [
    "你负责一款B2B文档协作SaaS，当前付费版与免费版都支持在线编辑。近期你将免费版用户打开付费版用户分享的文档默认权限从可编辑改为只读。",
    "你负责一款B2B在线表单SaaS，免费版支持50份表单/月。你计划隐藏高级设置到二级菜单，默认只展示基础字段。",
    "你负责一款B2B企业报销SaaS。近期将报销单提交后自动生成会计凭证草稿功能，从管理员手动开启改为默认开启。",
    "你负责一款B2B项目管理SaaS，免费版支持任务看板，付费版支持甘特图。近期产品团队计划在免费版中增加一键试用付费版3天入口，并要求说明验证和回滚方案。",
  ];

  const seed = pickTrainingQuestionSeed({
    dimension: "战略思维",
    targetId: "tradeoff",
    todayQuestionTexts: crowdedTodayQuestions,
    recentQuestionTexts: crowdedTodayQuestions,
  });

  assert.notEqual(seed.family, "risk-release");
  assert.notEqual(seed.actionType, "上线判断");
  assert.doesNotMatch(
    `${seed.scenarioType} ${seed.actionType} ${seed.shell} ${seed.promptAngle}`,
    /免费|付费|SaaS|权限|试用|上线|灰度|回滚/
  );
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
