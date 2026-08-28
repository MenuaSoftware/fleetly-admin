import { createBrowserClient } from "@supabase/ssr";

/**
 * For client components — session lives in cookies, shared with the
 * server client below. Staff sign in against Supabase Auth's own
 * hosted flow, not a custom backend endpoint; this is the SDK that
 * talks to it directly.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
