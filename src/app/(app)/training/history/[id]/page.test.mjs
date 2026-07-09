import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

test("training history reads back the saved second-pass revision", () => {
  assert.match(source, /__revision/);
  assert.match(source, /二次修正/);
  assert.match(source, /修正版/);
  assert.match(source, /revisedAnswer/);
  assert.match(source, /record\.ai_feedback\?\.__revision/);
});

test("training history can save a second-pass revision from the review queue", () => {
  assert.match(source, /useSearchParams/);
  assert.match(source, /searchParams\.get\("revise"\) === "1"/);
  assert.match(source, /revisionText/);
  assert.match(source, /handleSaveRevision/);
  assert.match(source, /method: "PATCH"/);
  assert.match(source, /\/api\/training\/record/);
  assert.match(source, /保存二次修正/);
});

test("training history presents a single review processing workspace", () => {
  assert.match(source, /ReviewProcessingDesk/);
  assert.match(source, /historyPrimaryAction/);
  assert.match(source, /复盘处理台/);
  assert.match(source, /本轮处理顺序/);
  assert.match(source, /原答与修正版/);
  assert.match(source, /入账动作台/);
  assert.match(source, /回到训练流水线/);
  assert.match(source, /先保存修正版/);
  assert.doesNotMatch(source, /grid gap-3 sm:grid-cols-3/);
});

test("training history saves a profile snapshot after revision", () => {
  assert.match(source, /\/api\/profile\/summary/);
  assert.match(source, /revision_saved/);
  assert.match(source, /二次修正已进入能力证据账本/);
});

test("training history renders an interview expression card from the record", () => {
  assert.match(source, /interviewExpressionCard/);
  assert.match(source, /面试表达卡/);
  assert.match(source, /开场判断/);
  assert.match(source, /追问风险/);
  assert.match(source, /copyScript/);
});

test("training history can save the interview expression card into the profile ledger", () => {
  assert.match(source, /handleSaveExpressionCard/);
  assert.match(source, /expression_card_saved/);
  assert.match(source, /\/api\/profile\/summary/);
  assert.match(source, /沉淀到画像账本/);
  assert.match(source, /表达卡已入账/);
});

test("training history elevates goal-aware feedback assets in the review workspace", () => {
  assert.match(source, /interviewExpressionAsset/);
  assert.match(source, /thinkingUpgradeAsset/);
  assert.match(source, /主线资产复盘/);
  assert.match(source, /面试表达资产/);
  assert.match(source, /思维升级卡/);
  assert.match(source, /迁移验证/);
  assert.match(source, /evidence_hooks/);
  assert.match(source, /landing_rigor/);
  assert.match(source, /migration_check/);
});

test("training history can save the thinking upgrade card into the profile ledger", () => {
  assert.match(source, /handleSaveThinkingUpgrade/);
  assert.match(source, /thinking_upgrade_saved/);
  assert.match(source, /thinkingUpgradeStatus/);
  assert.match(source, /\/api\/profile\/summary/);
  assert.match(source, /migration_check: thinkingUpgrade\.migration_check/);
  assert.match(source, /沉淀思维升级/);
  assert.match(source, /思维升级已入账/);
});
