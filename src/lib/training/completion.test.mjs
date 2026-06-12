import test from "node:test";
import assert from "node:assert/strict";
import {
  calcStreakFromBeijingDates,
  getBeijingMonthUtcRange,
  getUniqueBeijingMonthDays,
} from "./completion.ts";

test("maps submitted records to Beijing month days", () => {
  const days = getUniqueBeijingMonthDays(
    [
      { created_at: "2026-06-08T15:59:00.000Z" },
      { created_at: "2026-06-08T16:01:00.000Z" },
      { created_at: "2026-06-08T16:30:00.000Z" },
    ],
    "2026-06"
  );

  assert.deepEqual(days, [8, 9]);
});

test("builds a UTC query range for a Beijing month", () => {
  const range = getBeijingMonthUtcRange("2026-06");

  assert.equal(range.startIso, "2026-05-31T16:00:00.000Z");
  assert.equal(range.endIso, "2026-06-30T16:00:00.000Z");
});

test("calculates streak from answered Beijing dates only", () => {
  const streak = calcStreakFromBeijingDates(
    ["2026-06-07", "2026-06-08", "2026-06-09"],
    "2026-06-09"
  );

  assert.equal(streak, 3);
});
