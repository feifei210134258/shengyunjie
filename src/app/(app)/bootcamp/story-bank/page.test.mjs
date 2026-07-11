import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

test("story bank page loads API data and renders interview evidence concepts", () => {
  assert.match(source, /\/api\/bootcamp\/story-bank/);
  assert.match(source, /项目故事库/);
  assert.match(source, /面试证据/);
  assert.match(source, /可讲版本/);
  assert.match(source, /高风险项目/);
  assert.match(source, /\/bootcamp\/interview/);
});

test("story bank page lets users edit and persist project evidence", () => {
  assert.match(source, /保存证据/);
  assert.match(source, /method: "PATCH"/);
  assert.match(source, /结果指标/);
  assert.match(source, /onSaveProjectEvidence/);
});

test("story bank page renders a copy-ready two minute interview script", () => {
  assert.match(source, /2 分钟讲述稿/);
  assert.match(source, /复制讲述稿/);
  assert.match(source, /interviewScript/);
  assert.match(source, /navigator\.clipboard\.writeText/);
});

test("story bank page surfaces daily training expression assets", () => {
  assert.match(source, /trainingExpressionAssets/);
  assert.match(source, /日常训练表达资产/);
  assert.match(source, /训练回答/);
  assert.match(source, /查看训练复盘/);
});

test("story bank page ranks projects against the saved target brief", () => {
  assert.match(source, /latestGoalBrief/);
  assert.match(source, /目标项目优先级/);
  assert.match(source, /目标匹配度/);
  assert.match(source, /优先讲/);
  assert.match(source, /补齐目标证据/);
});

test("story bank page can save a project story pack into the profile ledger", () => {
  assert.match(source, /handleSaveProjectStoryPack/);
  assert.match(source, /project_story_saved/);
  assert.match(source, /\/api\/profile\/summary/);
  assert.match(source, /沉淀到画像账本/);
  assert.match(source, /故事包已入账/);
});

test("story bank page saves target fit with the project story pack", () => {
  assert.match(source, /targetFit/);
  assert.match(source, /priorityLabel/);
  assert.match(source, /missingEvidence/);
  assert.match(source, /targetFit:\s*story\.targetFit/);
});

test("story bank page lets users repair the exact target evidence gap", () => {
  assert.match(source, /目标证据修补台/);
  assert.match(source, /targetEvidenceText/);
  assert.match(source, /targetEvidenceRepair/);
  assert.match(source, /补这条目标证据/);
  assert.match(source, /savedEvidence/);
});

test("story bank page shows when target evidence has already been repaired", () => {
  assert.match(source, /目标证据已补/);
  assert.match(source, /下一步沉淀到画像账本/);
});

test("story bank page persists repaired target evidence into the profile ledger", () => {
  assert.match(source, /targetEvidence:\s*story\.targetEvidenceRepair\.savedEvidence/);
});

test("story bank page lets users package and persist a final interview answer", () => {
  assert.match(source, /终版面试表达/);
  assert.match(source, /finalInterviewPackage/);
  assert.match(source, /finalInterviewAnswerText/);
  assert.match(source, /复制终版表达/);
  assert.match(source, /保存终版表达/);
});

test("story bank page deposits the final interview answer with the project story pack", () => {
  assert.match(source, /finalInterviewAnswer:\s*story\.finalInterviewPackage\.savedAnswer/);
});

test("story bank uses the quiet list-first workspace system", () => {
  assert.match(source, /text-\[28px\] font-bold leading-9 text-ink/);
  assert.match(source, /选择项目，补齐证据，保存可讲版本/);
  assert.doesNotMatch(source, /sm:text-\[44px\]/);
  assert.doesNotMatch(source, /text-display-md/);
  assert.doesNotMatch(source, /bg-ink/);
  assert.doesNotMatch(source, /目标不是保存资料/);
  assert.doesNotMatch(source, /shadow-xs/);
});

test("story bank flattens project evidence into divided rows", () => {
  assert.match(source, /divide-y divide-line border-y border-line/);
  assert.match(source, /TargetPriorityPanel/);
  assert.match(source, /bg-primary-soft\/40/);
  assert.doesNotMatch(source, /rounded-xl border border-line bg-white/);
});
