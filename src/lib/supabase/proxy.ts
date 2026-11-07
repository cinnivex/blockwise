import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, supabaseKey, supabaseUrl } from "./env";

/** Pages that require a logged-in user. */
const PROTECTED_PREFIXES = ["/dashboard", "/categories", "/timeline"];
/** Pages a logged-in user doesn't need; they go to the dashboard instead. */
const GUEST_ONLY = ["/login", "/signup"];

/**
 * Refreshes the Supabase auth session cookie on each request and
 * redirects logged-out visitors away from protected pages.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Before Supabase is configured, let every page render so the app
  // still builds and previews (pages show a setup notice instead).
  if (!isSupabaseConfigured) return response;

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([key, value]) =>
          response.headers.set(key, value),
        );
      },
    },
  });

  // getClaims() verifies the JWT; don't trust getSession() on the server.
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims);

  const path = request.nextUrl.pathname;
  if (!isLoggedIn && PROTECTED_PREFIXES.some((p) => path.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (isLoggedIn && GUEST_ONLY.includes(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
