"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/supabase/user";
import { PALETTE_HEXES } from "@/lib/palette";

export type CategoryValues = { name: string; description: string; color: string };
export type CategoryFormState = {
  error?: string;
  ok?: boolean;
  savedAt?: number;
  /** What the user typed, sent back on errors so the form isn't wiped. */
  values?: CategoryValues;
};

function valuesOf(formData: FormData): CategoryValues {
  return {
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    color: String(formData.get("color") ?? ""),
  };
}

type Parsed = { name: string; description: string | null; color: string };

function parse(formData: FormData): Parsed | { error: string } {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const color = String(formData.get("color") ?? "").toLowerCase();

  if (!name) return { error: "Give your category a name." };
  if (name.length > 40) return { error: "Keep the name to 40 characters or fewer." };
  if (description.length > 200) return { error: "Keep the description to 200 characters or fewer." };
  if (!PALETTE_HEXES.includes(color)) return { error: "Pick a color." };

  return { name, description: description || null, color };
}

/** True if another active category already uses this name (case-insensitive). */
async function nameTaken(name: string, exceptId?: string): Promise<boolean> {
  const supabase = await createClient();
  let query = supabase
    .from("categories")
    .select("id")
    .eq("archived", false)
    .ilike("name", name.replace(/[%_\\]/g, (c) => `\\${c}`))
    .limit(1);
  if (exceptId) query = query.neq("id", exceptId);
  const { data } = await query;
  return Boolean(data?.length);
}

export async function createCategory(
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  if (!(await getSessionUser())) return { error: "Your session expired. Log in again." };

  const values = valuesOf(formData);
  const parsed = parse(formData);
  if ("error" in parsed) return { ...parsed, values };
  if (await nameTaken(parsed.name)) {
    return { error: `You already have a category called "${parsed.name}".`, values };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert(parsed);
  if (error) return { error: "Couldn't save the category. Please try again.", values };

  refresh();
  return { ok: true, savedAt: Date.now() };
}

export async function updateCategory(
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  if (!(await getSessionUser())) return { error: "Your session expired. Log in again." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing category." };

  const values = valuesOf(formData);
  const parsed = parse(formData);
  if ("error" in parsed) return { ...parsed, values };
  if (await nameTaken(parsed.name, id)) {
    return { error: `You already have a category called "${parsed.name}".`, values };
  }

  const supabase = await createClient();
  // Row-level security limits this to the user's own rows.
  const { error } = await supabase.from("categories").update(parsed).eq("id", id);
  if (error) return { error: "Couldn't save your changes. Please try again.", values };

  refresh();
  return { ok: true, savedAt: Date.now() };
}

/** Archive hides a category from the timer but keeps its history and color. */
export async function setArchived(formData: FormData): Promise<void> {
  if (!(await getSessionUser())) return;

  const id = String(formData.get("id") ?? "");
  const archived = formData.get("archived") === "true";
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("categories").update({ archived }).eq("id", id);
  refresh();
}
