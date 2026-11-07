import type { Metadata } from "next";
import { Suspense } from "react";
import { DayView } from "@/components/log/DayView";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Timeline · Blockwise" };

async function Day() {
  const supabase = await createClient();
  // Archived categories are included so old entries keep their name and color.
  const { data } = await supabase
    .from("categories")
    .select("id, name, color, archived")
    .order("created_at", { ascending: true });

  return <DayView categories={data ?? []} />;
}

export default function TimelinePage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-xl border border-border bg-surface" aria-label="Loading" />}>
      <Day />
    </Suspense>
  );
}
