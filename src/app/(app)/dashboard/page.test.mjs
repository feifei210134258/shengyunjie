import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

test("dashboard foregrounds two product outcome paths instead of one module entry", () => {
  assert.match(source, /productPaths/);
  assert.match(source, /面试跳槽冲刺/);
  assert.match(source, /高级产品思维训练/);
  assert.match(source, /设为主线/);
});

test("dashboard first viewport is a single-action command deck instead of two large path cards", () => {
  assert.match(source, /今日主动作/);
  assert.match(source, /行动理由/);
  assert.match(source, /完成后入账/);
  assert.match(source, /资产流水线/);
  assert.match(source, /目标简报 → 今日动作 → 证据入账 → 下一步处方/);
  assert.match(source, /primary\.href/);
  assert.match(source, /primary\.cta/);
  assert.doesNotMatch(source, /min-h-\[270px\]/);
});

test("dashboard lets users persist their current outcome goal focus", () => {
  assert.match(source, /goalFocus/);
  assert.match(source, /handleSelectGoalFocus/);
  assert.match(source, /goal_focus_selected/);
  assert.match(source, /fetch\("\/api\/dashboard"\)/);
  assert.match(source, /当前主线/);
  assert.match(source, /设为主线/);
});

test("dashboard lets users save and read back a concrete outcome goal brief", () => {
  assert.match(source, /latestGoalBrief/);
  assert.match(source, /goalBriefDraft/);
  assert.match(source, /handleSaveGoalBrief/);
  assert.match(source, /goal_brief_saved/);
  assert.match(source, /目标简报/);
  assert.match(source, /目标岗位/);
  assert.match(source, /目标场景/);
  assert.match(source, /目标期限/);
});

test("dashboard renders the growth profile as an evidence ledger", () => {
  assert.match(source, /growthProfile/);
  assert.match(source, /能力证据账本/);
  assert.match(source, /面试就绪/);
  assert.match(source, /证据数/);
});

test("dashboard renders and persists a personalized training prescription", () => {
  assert.match(source, /recommendationPlan/);
  assert.match(source, /latestRecommendation/);
  assert.match(source, /训练处方/);
  assert.match(source, /设为本周处方/);
  assert.match(source, /本周处方/);
  assert.match(source, /\/api\/profile\/recommendation/);
  assert.match(source, /项目证据处方/);
  assert.match(source, /模拟追问验证/);
  assert.match(source, /抗追问结果/);
  assert.match(source, /打包面试表达/);
  assert.match(source, /终版表达入账后/);
  assert.match(source, /模拟复述/);
});

test("dashboard embeds the action dossier into the command deck instead of rendering a second card wall", () => {
  assert.match(source, /actionDossier/);
  assert.match(source, /主动作证据/);
  assert.match(source, /复制终版表达/);
  assert.match(source, /现在入账/);
  assert.match(source, /模拟复述/);
  assert.doesNotMatch(source, /<ActionDossierPanel/);
  assert.doesNotMatch(source, /function ActionDossierPanel/);
  assert.doesNotMatch(source, /已归档行动模块/);
  assert.doesNotMatch(source, /今日行动档案/);
});

test("dashboard action dossier shows the highest-priority target evidence action", () => {
  assert.match(source, /targetEvidenceAction/);
  assert.match(source, /目标证据行动/);
  assert.match(source, /当前资产/);
  assert.match(source, /目标匹配/);
  assert.match(source, /补这条证据/);
  assert.match(source, /主动作证据/);
});

test("dashboard action dossier shows repaired target evidence that needs ledger deposit", () => {
  assert.match(source, /targetEvidenceDepositAction/);
  assert.match(source, /目标证据已修好/);
  assert.match(source, /现在入账/);
  assert.match(source, /目标证据会写入画像账本/);
  assert.match(source, /目标证据已修好，等待入账/);
});

test("dashboard turns a ledgered final interview answer into an actionable ammo pack", () => {
  assert.match(source, /interviewAmmoPack/);
  assert.match(source, /面试弹药包/);
  assert.match(source, /复制终版表达/);
  assert.match(source, /模拟复述/);
  assert.match(source, /finalInterviewAnswer/);
  assert.match(source, /navigator\.clipboard\.writeText/);
});

test("dashboard can deposit repaired target evidence without leaving the page", () => {
  assert.match(source, /handleDepositTargetEvidence/);
  assert.match(source, /project_story_saved/);
  assert.match(source, /targetEvidence:\s*action\.targetEvidence/);
  assert.match(source, /targetFit:\s*action\.targetFit/);
  assert.match(source, /fetch\("\/api\/profile\/summary"/);
  assert.match(source, /const refreshed = await fetch\("\/api\/dashboard"\)/);
  assert.match(source, /入账成功/);
});

test("dashboard surfaces saved project story packs in the profile ledger", () => {
  assert.match(source, /storyAssets/);
  assert.match(source, /已入账项目资产/);
  assert.match(source, /项目故事包/);
  assert.match(source, /\/bootcamp\/story-bank/);
  assert.match(source, /目标匹配/);
  assert.match(source, /priorityLabel/);
  assert.match(source, /missingEvidence/);
  assert.match(source, /终版面试表达/);
  assert.match(source, /finalInterviewAnswer/);
});

test("dashboard surfaces saved thinking upgrade cards in the profile ledger", () => {
  assert.match(source, /thinkingAssets/);
  assert.match(source, /已入账思维升级/);
  assert.match(source, /思维升级卡/);
  assert.match(source, /judgmentQuality/);
  assert.match(source, /\/training\/history\//);
});

test("dashboard surfaces target evidence validation results in the profile ledger", () => {
  assert.match(source, /targetEvidenceValidations/);
  assert.match(source, /目标证据验证/);
  assert.match(source, /抗追问/);
  assert.match(source, /unresolvedRisks/);
  assert.match(source, /\/bootcamp\/interview\?focus=target_evidence/);
});

test("dashboard surfaces final answer rehearsal stability in the profile ledger", () => {
  assert.match(source, /finalAnswerRehearsals/);
  assert.match(source, /终版表达复述/);
  assert.match(source, /复述稳定度/);
  assert.match(source, /unstablePoints/);
  assert.match(source, /再练复述/);
});
