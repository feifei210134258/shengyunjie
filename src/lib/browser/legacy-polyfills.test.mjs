import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";

import { LEGACY_BROWSER_POLYFILLS } from "./legacy-polyfills.ts";

test("legacy browser polyfills install missing at and replaceAll methods", () => {
  const context = vm.createContext({});

  vm.runInContext(
    `
    Array.prototype.at = undefined;
    Array.prototype.flat = undefined;
    Array.prototype.flatMap = undefined;
    String.prototype.at = undefined;
    String.prototype.replaceAll = undefined;
    `,
    context,
  );

  vm.runInContext(LEGACY_BROWSER_POLYFILLS, context);

  assert.equal(vm.runInContext("[1, 2, 3].at(-1)", context), 3);
  assert.deepEqual(
    Array.from(vm.runInContext("[1, [2, [3]], 4].flat(2)", context)),
    [1, 2, 3, 4],
  );
  assert.deepEqual(
    Array.from(
      vm.runInContext("[1, 2, 3].flatMap((item) => [item, item * 2])", context),
    ),
    [1, 2, 2, 4, 3, 6],
  );
  assert.equal(vm.runInContext("'abc'.at(-1)", context), "c");
  assert.equal(vm.runInContext("'a-b-a'.replaceAll('a', 'x')", context), "x-b-x");
});

test("replaceAll polyfill rejects non-global regular expressions", () => {
  const context = vm.createContext({});

  vm.runInContext("String.prototype.replaceAll = undefined;", context);
  vm.runInContext(LEGACY_BROWSER_POLYFILLS, context);

  assert.throws(
    () => vm.runInContext("'a-b-a'.replaceAll(/a/, 'x')", context),
    { name: "TypeError" },
  );
});
