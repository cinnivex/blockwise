"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/supabase/user";
import type { Category, TimeEntry } from "@/lib/types";

export type LogEntry = TimeEntry & {
  category: Pick<Category, "id" | "name" | "color" | "archived">;
};

export type EntryResult = { ok: true } | { ok: false; error: string };

const MAX_ENTRY_MS = 24 * 60 * 60 * 1000;
/** Allow a little clock drift when checking "not in the future". */
const FUTURE_GRACE_MS = 60 * 1000;

/** Entries that overlap [fromIso, toIso), including a running one. */
export async function listEntries(fromIso: string, toIso: string): Promise<LogEntry[]> {
  if (!(await getSessionUser())) return [];
  if (Number.isNaN(Date.parse(fromIso)) || Number.isNaN(Date.parse(toIso))) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("time_entries")
    .select("*, category:categories(id, name, color, archived)")
    .lt("started_at", toIso)
    .or(`ended_at.gt."${fromIso}",ended_at.is.null`)
    .order("started_at", { ascending: true });

  if (error) {
    console.error("listEntries failed:", error.message);
    return [];
  }
  return (data ?? []) as LogEntry[];
}

type EntryInput = {
  categoryId: string;
  startedAt: string;
  endedAt: string;
  note?: string;
};

function validate(input: EntryInput): { error: string } | { started: number; ended: number; note: string | null } {
  const started = Date.parse(input.startedAt);
  const ended = Date.parse(input.endedAt);
  const note = (input.note ?? "").trim();

  if (!input.categoryId) return { error: "Pick a category." };
  if (Number.isNaN(started) || Number.isNaN(ended)) return { error: "Enter a start and end time." };
  if (ended <= started) return { error: "The end time must be after the start time." };
  if (ended - started > MAX_ENTRY_MS) return { error: "An entry can't be longer than 24 hours." };
  if (ended > Date.now() + FUTURE_GRACE_MS) return { error: "You can't log time in the future." };
  if (note.length > 500) return { error: "Keep the note to 500 characters or fewer." };
  return { started, ended, note: note || null };
}

/** Turn database errors into plain-language messages. */
function friendlyDbError(error: { code?: string; message: string }, action: string): string {
  if (error.code === "23P01") {
    return "That time overlaps another entry. Adjust the times or edit the other entry first.";
  }
  console.error(`${action} failed:`, error.message);
  return `Couldn't ${action}. Please try again.`;
}

async function categoryIsActive(categoryId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("archived")
    .eq("id", categoryId)
    .maybeSingle();
  return Boolean(data && !data.archived);
}

export async function createEntry(input: EntryInput): Promise<EntryResult> {
  if (!(await getSessionUser())) return { ok: false, error: "Your session expired. Log in again." };

  const v = validate(input);
  if ("error" in v) return { ok: false, error: v.error };
  if (!(await categoryIsActive(input.categoryId))) {
    return { ok: false, error: "Pick one of your active categories." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("time_entries").insert({
    category_id: input.categoryId,
    started_at: new Date(v.started).toISOString(),
    ended_at: new Date(v.ended).toISOString(),
    mode: "stopwatch",
    note: v.note,
  });
  if (error) return { ok: false, error: friendlyDbError(error, "add the entry") };
  return { ok: true };
}

export async function updateEntry(input: EntryInput & { id: string }): Promise<EntryResult> {
  if (!(await getSessionUser())) return { ok: false, error: "Your session expired. Log in again." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("time_entries")
    .select("id, ended_at, category_id")
    .eq("id", input.id)
    .maybeSingle();
  if (!existing) return { ok: false, error: "That entry no longer exists." };

  // Changing to a different category requires it to be active; keeping an
  // archived one on an old entry is fine.
  if (input.categoryId !== existing.category_id && !(await categoryIsActive(input.categoryId))) {
    return { ok: false, error: "Pick one of your active categories." };
  }

  // A running entry has no end yet: only its category and note can change.
  if (existing.ended_at === null) {
    const note = (input.note ?? "").trim();
    if (note.length > 500) return { ok: false, error: "Keep the note to 500 characters or fewer." };
    const { error } = await supabase
      .from("time_entries")
      .update({ category_id: input.categoryId, note: note || null })
      .eq("id", input.id);
    if (error) return { ok: false, error: friendlyDbError(error, "save the entry") };
    return { ok: true };
  }

  const v = validate(input);
  if ("error" in v) return { ok: false, error: v.error };

  const { error } = await supabase
    .from("time_entries")
    .update({
      category_id: input.categoryId,
      started_at: new Date(v.started).toISOString(),
      ended_at: new Date(v.ended).toISOString(),
      note: v.note,
    })
    .eq("id", input.id);
  if (error) return { ok: false, error: friendlyDbError(error, "save the entry") };
  return { ok: true };
}

export async function deleteEntry(id: string): Promise<EntryResult> {
  if (!(await getSessionUser())) return { ok: false, error: "Your session expired. Log in again." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("time_entries")
    .select("ended_at")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return { ok: true };
  if (existing.ended_at === null) return { ok: false, error: "Stop the timer before deleting this entry." };

  const { error } = await supabase.from("time_entries").delete().eq("id", id);
  if (error) return { ok: false, error: friendlyDbError(error, "delete the entry") };
  return { ok: true };
}
