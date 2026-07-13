import assert from "node:assert/strict";
import test from "node:test";

import {
  TRAINING_ARCHETYPES,
  TRAINING_CAPABILITY_CATALOG,
  TRAINING_DIMENSIONS,
  getCapabilitiesForDimension,
} from "./capability-catalog.ts";

test("defines six advanced capabilities for every training dimension", () => {
  for (const dimension of TRAINING_DIMENSIONS) {
    assert.equal(getCapabilitiesForDimension(dimension).length, 6);
  }
});

test("uses globally unique capability ids and valid archetypes", () => {
  const ids = TRAINING_CAPABILITY_CATALOG.map((item) => item.id);
  const validArchetypes = new Set(TRAINING_ARCHETYPES.map((item) => item.id));

  assert.equal(new Set(ids).size, ids.length);
  assert.ok(
    TRAINING_CAPABILITY_CATALOG.every(
      (item) =>
        item.archetypes.length >= 2 &&
        item.archetypes.every((archetype) => validArchetypes.has(archetype))
    )
  );
});

test("defines observable behavior, an execution trap, and evaluation focus", () => {
  for (const capability of TRAINING_CAPABILITY_CATALOG) {
    assert.ok(capability.label.trim());
    assert.ok(capability.advancedBehavior.length >= 12);
    assert.ok(capability.executionTrap.length >= 12);
    assert.ok(capability.evaluationFocus.length >= 3);
  }
});

test("defines one positive task brief for every answer archetype", () => {
  for (const archetype of TRAINING_ARCHETYPES) {
    assert.ok(archetype.taskBrief.length >= 15);
  }
});
