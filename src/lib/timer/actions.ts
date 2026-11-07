"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/supabase/user";
import type { Category, TimeEntry, TimerMode } from "@/lib/types";

/** Sessions shorter than this are treated as accidental clicks and not kept. */
const MIN_SESSION_MS = 5_000;
/** Longest countdown we accept: 12 hours. */
const MAX_COUNTDOWN_S = 12 * 60 * 60;

export type RunningTimer = {
  entry: TimeEntry;
  category: Pick<Category, "id" | "name" | "color">;
};

export type TimerResult =
  | { ok: true; running: RunningTimer | null; serverNow: number }
  | { ok: false; error: string; serverNow: number };

const fail = (error: string): TimerResult => ({ ok: false, error, serverNow: Date.now() });

/** When a countdown entry should end, or null for a stopwatch. */
function plannedEnd(entry: Pick<TimeEntry, "started_at" | "planned_seconds" | "mode">): number | null {
  if (entry.mode !== "countdown" || !entry.planned_seconds) return null;
  return Date.parse(entry.started_at) + entry.planned_seconds * 1000;
}

/**
 * Close the user's open entry (if any). Countdowns end at their planned time at
 * the latest; entries under 5 seconds are deleted instead of saved.
 */
async function closeOpenEntry(at: number): Promise<void> {
  const supabase = await createClient();
  const { data: open } = await supabase
    .from("time_entries")
    .select("id, started_at, mode, planned_seconds")
    .is("ended_at", null)
    .maybeSingle();
  if (!open) return;

  const end = Math.min(at, plannedEnd(open) ?? Infinity);
  if (end - Date.parse(open.started_at) < MIN_SESSION_MS) {
    await supabase.from("time_entries").delete().eq("id", open.id).is("ended_at", null);
  } else {
    await supabase
      .from("time_entries")
      .update({ ended_at: new Date(end).toISOString() })
      .eq("id", open.id)
      .is("ended_at", null);
  }
}

async function loadRunning(): Promise<RunningTimer | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("time_entries")
    .select("*, category:categories(id, name, color)")
    .is("ended_at", null)
    .maybeSingle();
  if (!data) return null;
  const { category, ...entry } = data as TimeEntry & { category: RunningTimer["category"] };
  return { entry, category };
}

/** Current timer, after closing any countdown that ran out while the tab was closed. */
export async function getTimerState(): Promise<TimerResult> {
  if (!(await getSessionUser())) return fail("Your session expired. Log in again.");

  const running = await loadRunning();
  if (running) {
    const end = plannedEnd(running.entry);
    if (end !== null && end <= Date.now()) {
      await closeOpenEntry(end);
      return { ok: true, running: null, serverNow: Date.now() };
    }
  }
  return { ok: true, running, serverNow: Date.now() };
}

export async function startTimer(input: {
  categoryId: string;
  mode: TimerMode;
  plannedSeconds?: number;
}): Promise<TimerResult> {
  if (!(await getSessionUser())) return fail("Your session expired. Log in again.");

  const { categoryId, mode } = input;
  const plannedSeconds = mode === "countdown" ? Math.round(input.plannedSeconds ?? 0) : null;
  if (mode !== "stopwatch" && mode !== "countdown") return fail("Unknown timer mode.");
  if (mode === "countdown" && (!plannedSeconds || plannedSeconds < 1 || plannedSeconds > MAX_COUNTDOWN_S)) {
    return fail("Countdown length must be between 1 minute and 12 hours.");
  }

  const supabase = await createClient();
  const { data: category } = await supabase
    .from("categories")
    .select("id, archived")
    .eq("id", categoryId)
    .maybeSingle();
  if (!category || category.archived) return fail("Pick one of your active categories.");

  // Only one timer at a time: starting a new one stops the current one first.
  const now = Date.now();
  await closeOpenEntry(now);

  const { error } = await supabase.from("time_entries").insert({
    category_id: categoryId,
    started_at: new Date(now).toISOString(),
    mode,
    planned_seconds: plannedSeconds,
  });
  if (error) {
    console.error("startTimer insert failed:", error.message);
    return fail("Couldn't start the timer. Please try again.");
  }

  return { ok: true, running: await loadRunning(), serverNow: Date.now() };
}

/** Stop (or pause) the running timer, saving it as a time entry. */
export async function stopTimer(): Promise<TimerResult> {
  if (!(await getSessionUser())) return fail("Your session expired. Log in again.");
  await closeOpenEntry(Date.now());
  return { ok: true, running: null, serverNow: Date.now() };
}
