import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const brandFiles = [
  "src/components/TopNav.tsx",
  "src/app/(auth)/login/page.tsx",
  "src/app/(auth)/register/page.tsx",
  "src/components/auth/AuthShowcase.tsx",
];

test("brand surfaces use BrandMark instead of GraduationCap", () => {
  for (const file of brandFiles) {
    const source = readFileSync(file, "utf8");
    assert.match(source, /BrandMark/, `${file} should render BrandMark`);
    assert.doesNotMatch(source, /GraduationCap/, `${file} should not use GraduationCap`);
  }
});

test("brand mark component and favicon use the stair platform motif", () => {
  assert.ok(existsSync("src/components/brand/BrandMark.tsx"));
  assert.ok(existsSync("src/app/icon.svg"));

  const component = readFileSync("src/components/brand/BrandMark.tsx", "utf8");
  const favicon = readFileSync("src/app/icon.svg", "utf8");

  assert.match(component, /title.*升云阶阶梯标志/s);
  assert.match(component, /d="M20 42h8v-8h8v-8h8v-8"/);
  assert.match(favicon, /d="M20 42h8v-8h8v-8h8v-8"/);
});
