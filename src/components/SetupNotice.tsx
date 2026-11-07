import { isSupabaseConfigured } from "@/lib/supabase/env";

/** Shown until Supabase env vars are set, so a fresh clone explains itself. */
export function SetupNotice() {
  if (isSupabaseConfigured) return null;

  return (
    <div
      role="status"
      className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
    >
      <strong>Supabase isn&apos;t connected yet.</strong> Copy{" "}
      <code className="font-mono">.env.example</code> to{" "}
      <code className="font-mono">.env.local</code>, add your project URL and
      key, and restart the dev server. See the README for full steps.
    </div>
  );
}
