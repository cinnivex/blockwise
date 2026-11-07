"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useTimer } from "@/components/timer/TimerProvider";
import { listEntries, type LogEntry } from "@/lib/entries/actions";
import { dayLabel, dayRange, formatHoursMinutes, isDayString, shiftDay, todayString } from "@/lib/time";
import type { Category } from "@/lib/types";
import { EntryForm } from "./EntryForm";
import { EntryRow } from "./EntryRow";

type CategoryOption = Pick<Category, "id" | "name" | "color" | "archived">;

const noopSubscribe = () => () => {};

const navButton =
  "rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-background disabled:opacity-40";

/** One day's time log, with date navigation. The day timeline joins it in milestone 6. */
export function DayView({ categories }: { categories: CategoryOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const timer = useTimer();

  const paramDay = params.get("date");
  const today = todayString();
  const day = isDayString(paramDay) ? paramDay : today;

  const [reloadCount, setReloadCount] = useState(0);
  const [data, setData] = useState<{ key: string; entries: LogEntry[] } | null>(null);
  const [adding, setAdding] = useState(false);

  // Refetch when the day changes, after edits, and when the timer starts/stops.
  const runningId = timer.running?.entry.id ?? null;
  const key = `${day}|${reloadCount}|${runningId}`;
  useEffect(() => {
    let cancelled = false;
    const { from, to } = dayRange(day);
    listEntries(from, to).then((entries) => {
      if (!cancelled) setData({ key, entries });
    });
    return () => {
      cancelled = true;
    };
  }, [day, key]);

  const loading = data?.key !== key;
  const entries = data?.entries ?? [];

  const goTo = (next: string) => {
    setAdding(false);
    const q = next === todayString() ? "" : `?date=${next}`;
    router.replace(`${pathname}${q}`, { scroll: false });
  };

  const { reload: reloadTimer } = timer;
  const onChanged = useCallback(() => {
    setReloadCount((n) => n + 1);
    void reloadTimer();
  }, [reloadTimer]);

  // Total of finished entries, counting only the part inside this day.
  const { from, to } = dayRange(day);
  const dayStart = Date.parse(from);
  const dayEnd = Date.parse(to);
  const totalMs = entries.reduce((sum, e) => {
    if (!e.ended_at) return sum;
    const s = Math.max(Date.parse(e.started_at), dayStart);
    const t = Math.min(Date.parse(e.ended_at), dayEnd);
    return sum + Math.max(0, t - s);
  }, 0);
  const hasRunning = entries.some((e) => e.ended_at === null);
  const activeCategories = categories.filter((c) => !c.archived);

  // "Today" and clock times depend on the viewer's time zone, which the server
  // doesn't know, so this view renders only in the browser.
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);
  if (!isClient) {
    return <div className="h-64 animate-pulse rounded-xl border border-border bg-surface" aria-label="Loading" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{dayLabel(day)}</h1>
          <p className="text-sm text-muted" aria-live="polite">
            {loading ? "Loading…" : `${formatHoursMinutes(totalMs)} tracked${hasRunning ? " (plus the running timer)" : ""}`}
          </p>
        </div>
        <nav aria-label="Choose day" className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => goTo(shiftDay(day, -1))} className={navButton}>
            <span aria-hidden>&larr;</span> <span className="sr-only">Previous day</span>
          </button>
          <input
            type="date"
            value={day}
            max={today}
            onChange={(e) => isDayString(e.target.value) && goTo(e.target.value)}
            aria-label="Date"
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={() => goTo(shiftDay(day, 1))}
            disabled={day >= today}
            className={navButton}
          >
            <span aria-hidden>&rarr;</span> <span className="sr-only">Next day</span>
          </button>
          {day !== today && (
            <button type="button" onClick={() => goTo(today)} className={navButton}>
              Today
            </button>
          )}
        </nav>
      </div>

      <section aria-labelledby="log-heading" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 id="log-heading" className="font-medium">
            Time log
          </h2>
          {!adding && activeCategories.length > 0 && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:opacity-90"
            >
              + Add entry
            </button>
          )}
        </div>

        {adding && (
          <div className="rounded-xl border border-border bg-surface p-4">
            <h3 className="mb-3 text-sm font-medium">Add a session you forgot to time</h3>
            <EntryForm
              day={day}
              categories={categories}
              onSaved={() => {
                setAdding(false);
                onChanged();
              }}
              onCancel={() => setAdding(false)}
            />
          </div>
        )}

        {loading && !data ? (
          <div className="h-24 animate-pulse rounded-xl border border-border bg-surface" aria-hidden />
        ) : entries.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
            {day === today
              ? "Nothing tracked yet today. Start a timer, or add a session you forgot."
              : "Nothing tracked on this day."}
          </p>
        ) : (
          <ul className={`flex flex-col gap-2 ${loading ? "opacity-60" : ""}`}>
            {entries.map((e) => (
              <EntryRow key={e.id} entry={e} day={day} categories={categories} onChanged={onChanged} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
