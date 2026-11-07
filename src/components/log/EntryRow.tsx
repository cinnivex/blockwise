"use client";

import { useState } from "react";
import { deleteEntry, type LogEntry } from "@/lib/entries/actions";
import { formatClock, formatHoursMinutes } from "@/lib/time";
import type { Category } from "@/lib/types";
import { EntryForm } from "./EntryForm";

const smallButton = "rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-background";

type Props = {
  entry: LogEntry;
  day: string;
  categories: Pick<Category, "id" | "name" | "color" | "archived">[];
  onChanged: () => void;
};

export function EntryRow({ entry, day, categories, onChanged }: Props) {
  const [mode, setMode] = useState<"view" | "edit" | "confirm-delete">("view");
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const running = entry.ended_at === null;

  if (mode === "edit") {
    return (
      <li className="rounded-xl border border-border bg-surface p-4">
        <EntryForm
          day={day}
          categories={categories}
          entry={entry}
          onSaved={() => {
            setMode("view");
            onChanged();
          }}
          onCancel={() => setMode("view")}
        />
      </li>
    );
  }

  const onDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const result = await deleteEntry(entry.id);
      if (result.ok) onChanged();
      else {
        setError(result.error);
        setMode("view");
      }
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setDeleting(false);
    }
  };

  const durationMs = running ? null : Date.parse(entry.ended_at!) - Date.parse(entry.started_at);
  const range = `${formatClock(entry.started_at, day)} – ${running ? "now" : formatClock(entry.ended_at!, day)}`;

  return (
    <li className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="h-10 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: entry.category.color }} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 font-medium">
            <span className="truncate">{entry.category.name}</span>
            {running && (
              <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                Running
              </span>
            )}
          </p>
          <p className="text-sm text-muted">
            {range}
            {durationMs !== null && <> · {formatHoursMinutes(durationMs)}</>}
          </p>
          {entry.note && <p className="mt-1 text-sm">{entry.note}</p>}
        </div>

        {mode === "confirm-delete" ? (
          <div className="flex items-center gap-2" role="group" aria-label="Confirm delete">
            <span className="text-sm">Delete this entry?</span>
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
            <button type="button" onClick={() => setMode("view")} className={smallButton}>
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button type="button" onClick={() => setMode("edit")} className={smallButton}>
              Edit<span className="sr-only"> {entry.category.name} entry</span>
            </button>
            {!running && (
              <button type="button" onClick={() => setMode("confirm-delete")} className={smallButton}>
                Delete<span className="sr-only"> {entry.category.name} entry</span>
              </button>
            )}
          </div>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </li>
  );
}
