import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { supabaseKey, supabaseUrl } from "./env";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * Create a new one per request; never share it across requests.
 */
export async function createClient() {
  // Supabase checks token expiry with the clock (Date.now), so mark this as
  // request-time work; otherwise Cache Components flags it during prerender.
  await connection();
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // Safe to ignore: src/proxy.ts refreshes the session on every request.
        }
      },
    },
  });
}
