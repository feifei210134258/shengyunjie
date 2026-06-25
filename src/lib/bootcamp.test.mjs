import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  calculateDayProgress,
  canAdvanceFromQuestion,
} from "./bootcamp.ts";

const evaluatedFeedback = {
  overall_score: 6,
  structure: 6,
  logic: 6,
  professionalism: 6,
  innovation: 6,
  feedback: "已基于当前题目生成反馈。",
  strengths: [],
  gaps: [],
  suggestions: [],
};

test("bootcamp progress treats persisted ai evaluation as completed even when status is stale", () => {
  const progress = calculateDayProgress([
    {
      id: "q1",
      session_id: "s1",
      day_number: 1,
      question_index: 1,
      question_text: "题目",
      question_type: "strategy",
      difficulty: 1,
      ai_evaluation: evaluatedFeedback,
      status: "answered",
      created_at: "",
      updated_at: "",
    },
  ]);

  assert.equal(progress.completed, 1);
  assert.equal(progress.allEvaluated, true);
});

test("next question button can advance when feedback is visible but status is stale", () => {
  assert.equal(
    canAdvanceFromQuestion({
      id: "q1",
      session_id: "s1",
      day_number: 1,
      question_index: 1,
      question_text: "题目",
      question_type: "strategy",
      difficulty: 1,
      ai_evaluation: evaluatedFeedback,
      status: "answered",
      created_at: "",
      updated_at: "",
    }),
    true
  );
});

test("bootcamp interview page uses shared evaluation state for next button", () => {
  const pageSource = readFileSync(
    new URL("../app/(app)/bootcamp/interview/page.tsx", import.meta.url),
    "utf8"
  );

  assert.match(pageSource, /canAdvanceFromQuestion\(currentQuestion\)/);
  assert.doesNotMatch(pageSource, /currentQuestion\?\.status !== "evaluated"/);
});
