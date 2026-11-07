"use client";

import { useState } from "react";
import { createEntry, updateEntry, type LogEntry } from "@/lib/entries/actions";
import { combineDayTime, toTimeInput } from "@/lib/time";
import type { Category } from "@/lib/types";

type CategoryOption = Pick<Category, "id" | "name" | "color" | "archived">;

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-2 focus:outline-accent";

type Props = {
  day: string;
  categories: CategoryOption[];
  entry?: LogEntry;
  onSaved: () => void;
  onCancel: () => void;
};

/** Add a forgotten session, or edit an existing one. */
export function EntryForm({ day, categories, entry, onSaved, onCancel }: Props) {
  const isRunning = entry ? entry.ended_at === null : false;
  const [categoryId, setCategoryId] = useState(entry?.category_id ?? categories[0]?.id ?? "");
  const [start, setStart] = useState(entry ? toTimeInput(entry.started_at) : "09:00");
  const [end, setEnd] = useState(entry?.ended_at ? toTimeInput(entry.ended_at) : "10:00");
  const [note, setNote] = useState(entry?.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // An entry that started on another day keeps its own date when edited.
  const startDay = entry ? entry.started_at : null;
  const endDay = entry?.ended_at ?? null;

  // Archived categories can stay on old entries but can't be picked for new ones.
  const options = categories.filter((c) => !c.archived || c.id === entry?.category_id);

  const toIso = (time: string, sourceIso: string | null) => {
    if (!sourceIso) return combineDayTime(day, time);
    const d = new Date(sourceIso);
    const [h, m] = time.split(":").map(Number);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      categoryId,
      startedAt: toIso(start, startDay),
      endedAt: isRunning ? "" : toIso(end, endDay),
      note,
    };
    try {
      const result = entry ? await updateEntry({ ...payload, id: entry.id }) : await createEntry(payload);
      if (result.ok) onSaved();
      else setError(result.error);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const idBase = entry ? `entry-${entry.id}` : "entry-new";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr]">
        <label className="flex flex-col gap-1 text-sm font-medium" htmlFor={`${idBase}-cat`}>
          Category
          <select
            id={`${idBase}-cat`}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            className={inputClass}
          >
            {options.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.archived ? " (archived)" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Start
          <input
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            required
            disabled={isRunning}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          End
          {isRunning ? (
            <span className={`${inputClass} text-muted`}>Running</span>
          ) : (
            <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} required className={inputClass} />
          )}
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm font-medium">
        <span>
          Note <span className="font-normal text-muted">(optional)</span>
        </span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          placeholder="What did you get done?"
          className={inputClass}
        />
      </label>

      {isRunning && (
        <p className="text-xs text-muted">This session is still running, so only its category and note can change.</p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || options.length === 0}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : entry ? "Save changes" : "Add entry"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-background"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
