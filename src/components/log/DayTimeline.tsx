"use client";

import { useEffect, useState } from "react";
import type { LogEntry } from "@/lib/entries/actions";
import { dayRange, formatClock, formatHoursMinutes, todayString } from "@/lib/time";
import { placeEntries, visibleRange } from "@/lib/timeline";

/** Height of one hour on the timeline, in pixels. */
const HOUR_PX = 48;
/** A just-started timer is still big enough to see and label. */
const RUNNING_MIN_PX = 24;

const hourLabel = new Intl.DateTimeFormat(undefined, { hour: "numeric" });

type Props = { day: string; entries: LogEntry[] };

export function DayTimeline({ day, entries }: Props) {
  const isToday = day === todayString();
  const hasRunning = entries.some((e) => e.ended_at === null);
  const [now, setNow] = useState(() => Date.now());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Keep the "now" line and a running block moving.
  useEffect(() => {
    if (!isToday) return;
    const id = setInterval(() => setNow(Date.now()), hasRunning ? 5_000 : 30_000);
    return () => clearInterval(id);
  }, [isToday, hasRunning]);

  const { from, to } = dayRange(day);
  const dayStart = Date.parse(from);
  const dayEnd = Date.parse(to);
  const dayLengthH = (dayEnd - dayStart) / 3_600_000;
  const nowH = isToday ? (now - dayStart) / 3_600_000 : null;

  const placed = placeEntries(
    entries.map((e) => ({
      id: e.id,
      startMs: Date.parse(e.started_at),
      endMs: e.ended_at ? Date.parse(e.ended_at) : null,
    })),
    dayStart,
    dayEnd,
    now,
  );
  const range = visibleRange(placed, dayLengthH, nowH);
  const hours = Array.from({ length: range.to - range.from + 1 }, (_, i) => range.from + i);
  const byId = new Map(entries.map((e) => [e.id, e]));

  // Per-category totals for this day (running time counts so far).
  const totals = new Map<string, { id: string; name: string; color: string; ms: number }>();
  for (const p of placed) {
    const e = byId.get(p.id)!;
    const t = totals.get(e.category.id) ?? { id: e.category.id, name: e.category.name, color: e.category.color, ms: 0 };
    t.ms += (p.endH - p.startH) * 3_600_000;
    totals.set(e.category.id, t);
  }
  const breakdown = [...totals.values()].sort((a, b) => b.ms - a.ms);
  const totalMs = breakdown.reduce((s, b) => s + b.ms, 0);

  const selected = selectedId ? byId.get(selectedId) : undefined;
  const selectedPlaced = placed.find((p) => p.id === selectedId);

  const y = (h: number) => (h - range.from) * HOUR_PX;

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_17rem]">
      {/* ---- Timeline ---- */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="relative" style={{ height: (range.to - range.from) * HOUR_PX }}>
          {hours.map((h) => (
            <div key={h} className="absolute inset-x-0 flex items-start" style={{ top: y(h) }} aria-hidden>
              <span className="-mt-2 w-14 shrink-0 pr-2 text-right text-xs text-muted tabular-nums">
                {hourLabel.format(new Date(dayStart + h * 3_600_000))}
              </span>
              <span className="flex-1 border-t border-border" />
            </div>
          ))}

          <ol aria-label="Time blocks" className="absolute inset-y-0 left-14 right-0 z-10">
            {placed.map((p) => {
              const e = byId.get(p.id)!;
              const height = Math.max(p.running ? RUNNING_MIN_PX : 3, (p.endH - p.startH) * HOUR_PX);
              const isSelected = p.id === selectedId;
              const timeRange = `${formatClock(e.started_at, day)} – ${p.running ? "now" : formatClock(e.ended_at!, day)}`;
              const duration = formatHoursMinutes((p.endH - p.startH) * 3_600_000);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(isSelected ? null : p.id)}
                    aria-pressed={isSelected}
                    aria-label={`${e.category.name}, ${timeRange}, ${duration}${p.running ? ", running" : ""}${e.note ? `. ${e.note}` : ""}`}
                    title={`${e.category.name} · ${timeRange} · ${duration}`}
                    className={`absolute left-1 right-1 overflow-hidden rounded-md px-2 text-left text-xs text-white shadow-sm transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground ${
                      isSelected ? "ring-2 ring-foreground ring-offset-2 ring-offset-surface" : ""
                    } ${p.running ? "animate-pulse outline-2 -outline-offset-2 outline-dashed outline-white/70" : ""}`}
                    style={{ top: y(p.startH), height, backgroundColor: e.category.color }}
                  >
                    {height >= 20 && (
                      <span className="flex items-baseline gap-2 py-1 leading-tight">
                        <span className="truncate font-semibold">{e.category.name}</span>
                        <span className="shrink-0 opacity-90">{p.running ? `Running · ${duration}` : duration}</span>
                      </span>
                    )}
                    {height >= 40 && <span className="block truncate opacity-90">{timeRange}</span>}
                    {height >= 58 && e.note && <span className="block truncate opacity-90">{e.note}</span>}
                  </button>
                </li>
              );
            })}
          </ol>

          {nowH !== null && nowH >= range.from && nowH <= range.to && (
            <div className="pointer-events-none absolute left-12 right-0 flex items-center" style={{ top: y(nowH) }} aria-hidden>
              <span className="size-2 -ml-1 rounded-full bg-red-500" />
              <span className="flex-1 border-t-2 border-red-500" />
            </div>
          )}

          {placed.length === 0 && (
            <div className="absolute inset-0 left-14 flex items-center justify-center">
              <p className="rounded-lg bg-surface px-4 py-2 text-center text-sm text-muted">
                {isToday ? "Your day is a blank canvas. Start a timer to add a block." : "No blocks on this day."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ---- Summary ---- */}
      <aside className="flex flex-col gap-4" aria-label="Day summary">
        {selected && selectedPlaced && (
          <div className="rounded-xl border border-border bg-surface p-4" aria-live="polite">
            <div className="flex items-start justify-between gap-2">
              <p className="flex items-center gap-2 font-medium">
                <span className="size-3 rounded-sm" style={{ backgroundColor: selected.category.color }} aria-hidden />
                {selected.category.name}
              </p>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="text-sm text-muted hover:text-foreground"
                aria-label="Close details"
              >
                ×
              </button>
            </div>
            <p className="mt-1 text-sm text-muted">
              {formatClock(selected.started_at, day)} – {selected.ended_at ? formatClock(selected.ended_at, day) : "now"} ·{" "}
              {formatHoursMinutes((selectedPlaced.endH - selectedPlaced.startH) * 3_600_000)}
            </p>
            {selected.note && <p className="mt-2 text-sm">{selected.note}</p>}
          </div>
        )}

        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm text-muted">Total</p>
          <p className="text-2xl font-semibold tabular-nums">{formatHoursMinutes(totalMs)}</p>
          {breakdown.length > 0 && (
            <ul className="mt-4 flex flex-col gap-3">
              {breakdown.map((b) => (
                <li key={b.id} className="text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="size-3 shrink-0 rounded-sm" style={{ backgroundColor: b.color }} aria-hidden />
                      <span className="truncate">{b.name}</span>
                    </span>
                    <span className="shrink-0 tabular-nums text-muted">
                      {formatHoursMinutes(b.ms)} · {Math.round((b.ms / totalMs) * 100)}%
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-background" aria-hidden>
                    <div className="h-full rounded-full" style={{ width: `${(b.ms / totalMs) * 100}%`, backgroundColor: b.color }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
