import type { Metadata } from "next";
import { Suspense } from "react";
import { TimerPanel } from "@/components/timer/TimerPanel";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/supabase/user";

export const metadata: Metadata = { title: "Timer · Blockwise" };

/** "Welcome back, Sam" — read from the profiles table. */
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
  return <h1 className="text-2xl font-semibold">Welcome back, {name}.</h1>;
}

async function Timer() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, color, description")
    .eq("archived", false)
    .order("created_at", { ascending: true });

  return <TimerPanel categories={data ?? []} />;
}

export default function DashboardPage() {
  return (
    <>
      <Suspense fallback={<h1 className="text-2xl font-semibold text-muted">Welcome back…</h1>}>
        <Greeting />
      </Suspense>
      <Suspense
        fallback={<div className="h-72 animate-pulse rounded-2xl border border-border bg-surface" aria-label="Loading timer" />}
      >
        <Timer />
      </Suspense>
    </>
  );
}
