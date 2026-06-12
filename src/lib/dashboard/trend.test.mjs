import test from "node:test";
import assert from "node:assert/strict";

import { getLatestTrendScore } from "./trend.ts";

test("gets latest trend score without requiring Array.prototype.at", () => {
  const originalAt = Array.prototype.at;
  try {
    Object.defineProperty(Array.prototype, "at", {
      configurable: true,
      value: undefined,
    });

    assert.equal(
      getLatestTrendScore([
        { date: "06-10", avgScore: 3 },
        { date: "06-11", avgScore: 4.5 },
      ]),
      4.5
    );
  } finally {
    Object.defineProperty(Array.prototype, "at", {
      configurable: true,
      value: originalAt,
    });
  }
});

test("returns null for empty trend data", () => {
  assert.equal(getLatestTrendScore([]), null);
});
