import test from "node:test";
import assert from "node:assert/strict";

import { TRAINING_SESSION_ROUTE } from "./routes.ts";

test("training session route is canonical across app entry points", () => {
  assert.equal(TRAINING_SESSION_ROUTE, "/training/session");
  assert.ok(!TRAINING_SESSION_ROUTE.includes("entry="));
  assert.ok(!TRAINING_SESSION_ROUTE.includes("ui="));
});
