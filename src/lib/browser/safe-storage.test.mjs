import assert from "node:assert/strict";
import test from "node:test";

import {
  getPendingDiagnosisReportId,
  safeGetSearchParam,
  createSafeBrowserStorage,
  safeSessionStorageGet,
  safeSessionStorageRemove,
  safeSessionStorageSet,
} from "./safe-storage.ts";

test("safe storage helpers tolerate unavailable browser storage", () => {
  const originalWindow = globalThis.window;
  globalThis.window = {
    location: { search: "" },
    sessionStorage: {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("blocked");
      },
      removeItem() {
        throw new Error("blocked");
      },
    },
  };

  try {
    assert.equal(safeSessionStorageGet("reportId"), null);
    assert.equal(safeSessionStorageSet("reportId", "r1"), false);
    assert.equal(safeSessionStorageRemove("reportId"), false);
  } finally {
    globalThis.window = originalWindow;
  }
});

test("prefers report id from URL before session storage", () => {
  const originalWindow = globalThis.window;
  globalThis.window = {
    location: { search: "?reportId=url-report" },
    sessionStorage: {
      getItem() {
        return "stored-report";
      },
      setItem() {},
      removeItem() {},
    },
  };

  try {
    assert.equal(safeGetSearchParam("reportId"), "url-report");
    assert.equal(getPendingDiagnosisReportId(), "url-report");
  } finally {
    globalThis.window = originalWindow;
  }
});

test("safe browser storage falls back to memory when local storage is blocked", () => {
  const originalWindow = globalThis.window;
  globalThis.window = {};
  Object.defineProperty(globalThis.window, "localStorage", {
    configurable: true,
    get() {
      throw new Error("SecurityError");
    },
  });

  try {
    const storage = createSafeBrowserStorage("local");
    storage.setItem("auth", "value");
    assert.equal(storage.getItem("auth"), "value");
    storage.removeItem("auth");
    assert.equal(storage.getItem("auth"), null);
  } finally {
    globalThis.window = originalWindow;
  }
});
