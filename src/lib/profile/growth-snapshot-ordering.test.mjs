import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const routeFiles = [
  "../../app/api/dashboard/route.ts",
  "../../app/api/profile/summary/route.ts",
  "../../app/api/profile/recommendation/route.ts",
  "../../app/api/training/sessions/route.ts",
  "../../app/api/bootcamp/hub/route.ts",
  "../../app/api/bootcamp/story-bank/route.ts",
  "../../app/api/bootcamp/interview/route.ts",
  "../../app/api/bootcamp/interview/answer/route.ts",
];

for (const routeFile of routeFiles) {
  test(`${routeFile} resolves same-day growth snapshots by creation time`, () => {
    const source = readFileSync(new URL(routeFile, import.meta.url), "utf8");
    const growthSnapshotQuery = source.match(
      /\.from\("growth_snapshots"\)[\s\S]*?\.limit\(\d+\)/
    )?.[0];

    assert.ok(growthSnapshotQuery, "growth snapshot query should be present");
    assert.match(growthSnapshotQuery, /\.select\("[^"]*created_at[^"]*"\)/);
    assert.match(
      growthSnapshotQuery,
      /\.order\("snapshot_date", \{ ascending: false \}\)[\s\S]*\.order\("created_at", \{ ascending: false \}\)/
    );
  });
}
