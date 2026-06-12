import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./types";

/** Supabase-Client für Client Components (Browser, Cookies via document.cookie). */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
