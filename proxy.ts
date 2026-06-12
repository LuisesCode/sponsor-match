import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/** Pfad-Präfixe des eingeloggten Bereichs (Route-Group `(app)` gemäß PLAN.md). */
const PROTECTED_PREFIXES = [
  "/onboarding",
  "/dashboard",
  "/suche",
  "/profil",
  "/listings",
  "/nachrichten",
  "/deals",
  "/analytics",
  "/einstellungen",
];

/** Auth-Seiten, die eingeloggte Nutzer nicht mehr brauchen. */
const AUTH_PATHS = ["/login", "/registrieren"];

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/** Redirect, der die (ggf. erneuerten) Auth-Cookies der Session-Response übernimmt. */
function redirectKeepingCookies(url: URL, sessionResponse: NextResponse) {
  const redirect = NextResponse.redirect(url);
  sessionResponse.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie);
  });
  return redirect;
}

export async function proxy(request: NextRequest) {
  const { supabase, response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Nicht eingeloggt → geschützte Seiten nur via /login (mit Rücksprungziel).
  if (!user && isProtected(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", pathname);
    return redirectKeepingCookies(url, response());
  }

  if (user) {
    // Eingeloggt → Login/Registrierung überspringen.
    if (AUTH_PATHS.includes(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return redirectKeepingCookies(url, response());
    }

    // Onboarding erzwingen, solange es nicht abgeschlossen ist.
    if (isProtected(pathname) && pathname !== "/onboarding") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile && !profile.onboarding_completed) {
        const url = request.nextUrl.clone();
        url.pathname = "/onboarding";
        url.search = "";
        return redirectKeepingCookies(url, response());
      }
    }
  }

  // WICHTIG: immer die Response aus updateSession zurückgeben,
  // damit erneuerte Auth-Cookies beim Browser ankommen.
  return response();
}

export const config = {
  matcher: [
    // Alles außer Statics/Assets — Auth-Cookies sollen überall frisch bleiben.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
  ],
};
