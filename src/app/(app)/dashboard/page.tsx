import { Suspense } from "react";
import { Placeholder } from "@/components/Placeholder";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/supabase/user";

/** "Welcome back, Sam" — read from the profiles table to prove the DB link works. */
async function Greeting() {
  const user = await getSessionUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const name = profile?.display_name ?? user.email?.split("@")[0] ?? "there";
  return <p className="text-lg">Welcome back, {name}.</p>;
}

export default function DashboardPage() {
  return (
    <>
      <Suspense fallback={<p className="text-lg text-muted">Welcome back…</p>}>
        <Greeting />
      </Suspense>
      <Placeholder
        title="Timer"
        milestone="milestone 4 (Timer)"
        items={[
          "Pick a category and start a stopwatch in one click",
          "Countdown presets: 15, 25, 50 minutes, or custom",
          "Running timer survives a refresh (saved as an open time entry)",
          "Only one timer runs at a time",
        ]}
      />
    </>
  );
}
