import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

test("bootcamp interview page accepts target evidence focus from recommendations", () => {
  assert.match(source, /<Suspense fallback=\{<PageSpinner \/>}/);
  assert.match(source, /useSearchParams/);
  assert.match(source, /searchParams\.get\("focus"\)/);
  assert.match(source, /"target_evidence"/);
  assert.match(source, /interviewFocus/);
  assert.match(source, /targetEvidenceFocus/);
});

test("bootcamp interview page shows the ledgered target evidence being challenged", () => {
  assert.match(source, /目标证据追问/);
  assert.match(source, /高压追问/);
  assert.match(source, /projectName/);
  assert.match(source, /targetEvidence/);
});

test("bootcamp interview page shows final interview answer rehearsal context", () => {
  assert.match(source, /finalInterviewAnswer/);
  assert.match(source, /终版表达复述/);
  assert.match(source, /模拟复述/);
  assert.match(source, /临场稳定度/);
});

test("bootcamp interview page passes target evidence focus into question generation", () => {
  assert.match(source, /body:\s*JSON\.stringify\(\{\s*day_number:\s*nextDay,\s*interviewFocus/s);
});

test("bootcamp interview page passes target evidence focus into answer evaluation", () => {
  assert.match(source, /\/api\/bootcamp\/interview\/answer/);
  assert.match(source, /body:\s*JSON\.stringify\(\{\s*interview_id:\s*question\.id,\s*answer,\s*interviewFocus/s);
  assert.match(source, /validationSnapshot/);
});
