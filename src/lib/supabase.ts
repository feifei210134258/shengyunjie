import {
  createBrowserClient,
  parseCookieHeader,
  serializeCookieHeader,
} from "@supabase/ssr";
import { createSafeBrowserStorage } from "@/lib/browser/safe-storage";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      userStorage: createSafeBrowserStorage("local"),
    },
    cookies: {
      getAll() {
        try {
          if (typeof document === "undefined") return [];
          return parseCookieHeader(document.cookie).map(({ name, value }) => ({
            name,
            value: value ?? "",
          }));
        } catch {
          return [];
        }
      },
      setAll(cookiesToSet) {
        try {
          if (typeof document === "undefined") return;
          cookiesToSet.forEach(({ name, value, options }) => {
            document.cookie = serializeCookieHeader(name, value, options);
          });
        } catch {
          // Restricted-cookie browsers should not crash the app shell.
        }
      },
    },
  }
);
