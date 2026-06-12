import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "./types";

/**
 * Hält die Supabase-Session im Proxy (Next-16-Middleware) aktuell:
 * erneuert abgelaufene Access-Tokens und synchronisiert die Cookies
 * zwischen Request und Response.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
          // Antworten mit frischen Auth-Cookies dürfen nicht gecacht werden.
          Object.entries(headers).forEach(([key, value]) =>
            response.headers.set(key, value)
          );
        },
      },
    }
  );

  // Kein Code zwischen createServerClient und getUser() — sonst drohen
  // schwer auffindbare Logout-Bugs (siehe Supabase-SSR-Doku).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, response: () => response, user };
}
