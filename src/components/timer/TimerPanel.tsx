"use client";

import Link from "next/link";
import { useState } from "react";
import { formatDuration } from "@/lib/timer/format";
import type { Category, TimerMode } from "@/lib/types";
import { useTimer } from "./TimerProvider";

const PRESETS = [15, 25, 50];
const LAST_CATEGORY_KEY = "blockwise:lastCategory";

function readLastCategory(): string | null {
  try {
    return localStorage.getItem(LAST_CATEGORY_KEY);
  } catch {
    return null;
  }
}

function saveLastCategory(id: string) {
  try {
    localStorage.setItem(LAST_CATEGORY_KEY, id);
  } catch {
    // Remembering the last pick is only a convenience.
  }
}

const primaryButton =
  "rounded-full bg-accent px-6 py-3 text-base font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50";
const secondaryButton =
  "rounded-full border border-border px-6 py-3 text-base font-semibold hover:bg-background disabled:opacity-50";

export function TimerPanel({ categories }: { categories: Pick<Category, "id" | "name" | "color" | "description">[] }) {
  const timer = useTimer();
  const [selected, setSelected] = useState<string | null>(() => {
    const last = typeof window === "undefined" ? null : readLastCategory();
    return categories.find((c) => c.id === last)?.id ?? categories[0]?.id ?? null;
  });
  const [mode, setMode] = useState<TimerMode>("stopwatch");
  const [preset, setPreset] = useState<number | "custom">(25);
  const [customMinutes, setCustomMinutes] = useState("30");

  if (!timer.ready) {
    return <div className="h-72 animate-pulse rounded-2xl border border-border bg-surface" aria-label="Loading timer" />;
  }

  const active = timer.running ?? null;
  const paused = timer.paused;
  const shownCategory = active?.category ?? paused?.category;
  const shownMode = active?.entry.mode ?? paused?.mode;

  // ---- Running or paused ---------------------------------------------------
  if (shownCategory) {
    return (
      <section
        aria-label="Timer"
        className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-surface px-6 py-10 text-center"
      >
        <div className="flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium text-white" style={{ backgroundColor: shownCategory.color }}>
          {shownCategory.name}
        </div>
        <div>
          <p
            className="font-mono text-6xl font-semibold tabular-nums sm:text-7xl"
            role="timer"
            aria-live="off"
          >
            {formatDuration(timer.displayMs)}
          </p>
          <p className="mt-2 text-sm text-muted">
            {paused ? "Paused — this time is saved" : shownMode === "countdown" ? "Countdown · time left" : "Stopwatch"}
          </p>
        </div>

        {timer.progress !== null && (
          <div
            className="h-2 w-full max-w-sm overflow-hidden rounded-full bg-background"
            role="progressbar"
            aria-label="Countdown progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(timer.progress * 100)}
          >
            <div
              className="h-full rounded-full transition-[width] duration-300"
              style={{ width: `${timer.progress * 100}%`, backgroundColor: shownCategory.color }}
            />
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-3">
          {paused ? (
            <>
              <button type="button" onClick={timer.resume} disabled={timer.busy} className={primaryButton}>
                Resume
              </button>
              <button type="button" onClick={timer.dismissPaused} disabled={timer.busy} className={secondaryButton}>
                Done
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={timer.pause} disabled={timer.busy} className={secondaryButton}>
                Pause
              </button>
              <button type="button" onClick={timer.stop} disabled={timer.busy} className={primaryButton}>
                Stop
              </button>
            </>
          )}
        </div>

        {timer.error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{timer.error}</p>}
      </section>
    );
  }

  // ---- Idle: choose and start ----------------------------------------------
  if (categories.length === 0) {
    return (
      <section className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
        <p className="text-lg font-medium">Start your first block</p>
        <p className="max-w-sm text-sm text-muted">
          First, create a category for something you work on, like &ldquo;Studying&rdquo; or &ldquo;Deep work&rdquo;.
        </p>
        <Link href="/categories" className={primaryButton}>
          Create a category
        </Link>
      </section>
    );
  }

  const minutes = preset === "custom" ? Number(customMinutes) : preset;
  const customValid = Number.isFinite(minutes) && minutes >= 1 && minutes <= 720;
  const canStart = Boolean(selected) && (mode === "stopwatch" || customValid) && !timer.busy;

  const onStart = () => {
    if (!selected || !canStart) return;
    saveLastCategory(selected);
    void timer.start(selected, mode, mode === "countdown" ? Math.round(minutes * 60) : undefined);
  };

  return (
    <section aria-label="Timer" className="flex flex-col gap-6 rounded-2xl border border-border bg-surface p-6">
      <fieldset>
        <legend className="mb-3 text-sm font-medium">What are you working on?</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => {
            const isSelected = selected === c.id;
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelected(c.id)}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                  isSelected ? "border-foreground bg-background" : "border-border hover:bg-background"
                }`}
              >
                <span className="size-4 shrink-0 rounded" style={{ backgroundColor: c.color }} aria-hidden />
                <span className="truncate font-medium">{c.name}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-col gap-3">
        <div role="radiogroup" aria-label="Timer mode" className="inline-flex w-fit rounded-xl border border-border p-1">
          {(["stopwatch", "countdown"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              onClick={() => setMode(m)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize ${
                mode === m ? "bg-accent text-accent-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {mode === "countdown" && (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Countdown length">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={preset === p}
                onClick={() => setPreset(p)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                  preset === p ? "border-foreground bg-background" : "border-border hover:bg-background"
                }`}
              >
                {p} min
              </button>
            ))}
            <button
              type="button"
              aria-pressed={preset === "custom"}
              onClick={() => setPreset("custom")}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                preset === "custom" ? "border-foreground bg-background" : "border-border hover:bg-background"
              }`}
            >
              Custom
            </button>
            {preset === "custom" && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="number"
                  min={1}
                  max={720}
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  className="w-20 rounded-lg border border-border bg-background px-2 py-1.5"
                  aria-label="Custom minutes"
                />
                minutes
              </label>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col items-start gap-2">
        <button type="button" onClick={onStart} disabled={!canStart} className={primaryButton}>
          {timer.busy ? "Starting…" : "Start"}
        </button>
        {mode === "countdown" && preset === "custom" && !customValid && (
          <p className="text-sm text-red-600 dark:text-red-400">Enter between 1 and 720 minutes.</p>
        )}
        {timer.error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{timer.error}</p>}
        <p className="text-xs text-muted">Sessions shorter than 5 seconds aren&apos;t saved.</p>
      </div>
    </section>
  );
}
