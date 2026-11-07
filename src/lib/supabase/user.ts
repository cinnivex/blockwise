import "server-only";
import { createClient } from "./server";
import { isSupabaseConfigured } from "./env";

export type SessionUser = { id: string; email: string | null };

/**
 * The logged-in user, verified from the auth cookie, or null.
 * Reads cookies, so call it from a component inside a <Suspense> boundary.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { id: claims.sub, email: (claims.email as string | undefined) ?? null };
}
