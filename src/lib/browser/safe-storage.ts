export function safeSessionStorageGet(key: string) {
  if (typeof window === "undefined") return null;

  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSessionStorageSet(key: string, value: string) {
  if (typeof window === "undefined") return false;

  try {
    window.sessionStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeSessionStorageRemove(key: string) {
  if (typeof window === "undefined") return false;

  try {
    window.sessionStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function createSafeBrowserStorage(kind: "local" | "session" = "local") {
  const memoryStore = new Map<string, string>();

  function getStorage(): Storage | null {
    if (typeof window === "undefined") return null;

    try {
      const storage = kind === "local" ? window.localStorage : window.sessionStorage;
      const testKey = `__shengyunjie_storage_test_${kind}__`;
      storage.setItem(testKey, "1");
      storage.removeItem(testKey);
      return storage;
    } catch {
      return null;
    }
  }

  return {
    getItem(key: string) {
      const storage = getStorage();
      if (!storage) return memoryStore.get(key) ?? null;

      try {
        return storage.getItem(key);
      } catch {
        return memoryStore.get(key) ?? null;
      }
    },
    setItem(key: string, value: string) {
      const storage = getStorage();
      memoryStore.set(key, value);

      if (!storage) return;

      try {
        storage.setItem(key, value);
      } catch {
        // Keep the in-memory copy for restricted-storage browsers.
      }
    },
    removeItem(key: string) {
      const storage = getStorage();
      memoryStore.delete(key);

      if (!storage) return;

      try {
        storage.removeItem(key);
      } catch {
        // The memory fallback has already been cleared.
      }
    },
  };
}

export function safeGetSearchParam(key: string, search?: string) {
  try {
    const source =
      search ?? (typeof window === "undefined" ? "" : window.location.search);
    return new URLSearchParams(source).get(key);
  } catch {
    return null;
  }
}

export function getPendingDiagnosisReportId() {
  return safeGetSearchParam("reportId") || safeSessionStorageGet("reportId");
}
