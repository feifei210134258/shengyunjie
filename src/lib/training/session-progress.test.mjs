import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  getCompletedTrainingDimensions,
  getNextTrainingIndexFromCompleted,
  getRotatedTrainingDimensions,
  TRAINING_DIMENSIONS,
} from "./session-progress.ts";

test("continues from the next unanswered daily training dimension", () => {
  const completed = getCompletedTrainingDimensions([
    { dimension: "战略思维" },
  ]);

  assert.deepEqual(completed, ["战略思维"]);
  assert.equal(getNextTrainingIndexFromCompleted(completed), 1);
  assert.equal(TRAINING_DIMENSIONS[1], "系统设计能力");
});

test("skips duplicate submitted dimensions and keeps canonical order", () => {
  const completed = getCompletedTrainingDimensions([
    { dimension: "数据决策能力" },
    { dimension: "战略思维" },
    { dimension: "战略思维" },
    { dimension: "案例推演" },
  ]);

  assert.deepEqual(completed, ["战略思维", "数据决策能力"]);
  assert.equal(getNextTrainingIndexFromCompleted(completed), 1);
});

test("starts a new round from the first dimension after all dimensions are complete", () => {
  assert.equal(getNextTrainingIndexFromCompleted(TRAINING_DIMENSIONS), 0);
});

test("daily training order rotates so the first question is not always strategic thinking", () => {
  const firstDay = getRotatedTrainingDimensions(
    new Date("2026-06-22T00:00:00Z")
  );
  const nextDay = getRotatedTrainingDimensions(
    new Date("2026-06-23T00:00:00Z")
  );

  assert.deepEqual(new Set(firstDay), new Set(TRAINING_DIMENSIONS));
  assert.deepEqual(new Set(nextDay), new Set(TRAINING_DIMENSIONS));
  assert.notEqual(firstDay[0], nextDay[0]);
});

function extractFunctionBody(source, functionName) {
  const marker =
    source.includes(`const ${functionName} = async () => {`)
      ? `const ${functionName} = async () => {`
      : `const ${functionName} = () => {`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${functionName} should exist`);

  let depth = 0;
  for (let index = start + marker.indexOf("{"); index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) {
      return source.slice(start, index + 1);
    }
  }

  assert.fail(`Could not extract ${functionName}`);
}

test("restart and next round reuse cached daily questions", () => {
  const source = readFileSync(
    new URL("../../components/training/TrainingSessionClient.tsx", import.meta.url),
    "utf8"
  );
  const restartBody = extractFunctionBody(source, "handleRestart");
  const nextBody = extractFunctionBody(source, "handleNext");

  assert.doesNotMatch(restartBody, /setQuestions\(\s*\{\s*\}\s*\)/);
  assert.doesNotMatch(restartBody, /generateQuestion/);
  assert.doesNotMatch(nextBody, /setQuestions\(\s*\{\s*\}\s*\)/);
});

test("manual question replacement remains the only explicit regeneration path", () => {
  const source = readFileSync(
    new URL("../../components/training/TrainingSessionClient.tsx", import.meta.url),
    "utf8"
  );
  const regenerateBody = extractFunctionBody(source, "handleRegenerate");

  assert.match(regenerateBody, /getNextTrainingMission/);
  assert.match(regenerateBody, /setActiveMissions/);
  assert.match(regenerateBody, /generateQuestion\(nextMission,\s*targetState\)/);
  assert.doesNotMatch(regenerateBody, /getNextTrainingTarget/);
});

test("training session can start from dashboard prescription focus", () => {
  const source = readFileSync(
    new URL("../../components/training/TrainingSessionClient.tsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /useSearchParams/);
  assert.match(source, /searchParams\.get\("focus"\)/);
  assert.match(source, /getTrainingMissionForProfileFocus/);
  assert.match(source, /处方训练/);
  assert.match(source, /profileFocus/);
});

test("failed session recovery does not auto-generate over a persisted draft", () => {
  const source = readFileSync(
    new URL("../../components/training/TrainingSessionClient.tsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /if \(!res\.ok\) throw new Error\("今日训练恢复失败"\)/);
  assert.match(source, /今日训练恢复失败，请刷新页面重试/);
  assert.doesNotMatch(source, /res\.ok \? res\.json\(\) : null/);
});

test("training feedback persists a growth snapshot for the profile loop", () => {
  const source = readFileSync(
    new URL("../../components/training/TrainingSessionClient.tsx", import.meta.url),
    "utf8"
  );
  const submitBody = extractFunctionBody(source, "handleSubmit");

  assert.match(submitBody, /\/api\/training\/record/);
  assert.match(submitBody, /\/api\/profile\/summary/);
  assert.match(submitBody, /training_feedback/);
  assert.match(submitBody, /trainingRecordId/);
  assert.match(source, /反馈已入账/);
  assert.match(source, /本题反馈已进入画像/);
});

test("training feedback fetches and can persist the next recommendation prescription", () => {
  const source = readFileSync(
    new URL("../../components/training/TrainingSessionClient.tsx", import.meta.url),
    "utf8"
  );
  const submitBody = extractFunctionBody(source, "handleSubmit");
  const selectBody = extractFunctionBody(source, "handleSelectNextPrescription");

  assert.match(submitBody, /\/api\/profile\/recommendation/);
  assert.match(submitBody, /nextPrescription/);
  assert.match(selectBody, /\/api\/profile\/recommendation/);
  assert.match(selectBody, /recommendationId/);
  assert.match(source, /下一轮处方/);
  assert.match(source, /设为本周处方/);
});

test("training answer drafts are restored and saved to the daily question cache", () => {
  const source = readFileSync(
    new URL("../../components/training/TrainingSessionClient.tsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /draftAnswer/);
  assert.match(source, /setAnswers/);
  assert.match(source, /作答质检/);
  assert.match(source, /自动保存/);
  assert.match(source, /draftStatus:\s*"saving"/);
  assert.match(source, /\/api\/training\/questions/);
});

test("training feedback supports saving a second-pass revised answer", () => {
  const source = readFileSync(
    new URL("../../components/training/TrainingSessionClient.tsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /二次修正/);
  assert.match(source, /revision/);
  assert.match(source, /handleSaveRevision/);
  assert.match(source, /method:\s*"PATCH"/);
  assert.match(source, /\/api\/training\/record/);
});

test("saving a second-pass revision updates the growth profile evidence ledger", () => {
  const source = readFileSync(
    new URL("../../components/training/TrainingSessionClient.tsx", import.meta.url),
    "utf8"
  );
  const revisionBody = extractFunctionBody(source, "handleSaveRevision");

  assert.match(revisionBody, /\/api\/profile\/summary/);
  assert.match(revisionBody, /revision_saved/);
  assert.match(revisionBody, /revisedAnswer/);
  assert.match(source, /二次修正已进入能力证据账本/);
});
