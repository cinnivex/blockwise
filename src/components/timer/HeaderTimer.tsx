"use client";

import Link from "next/link";
import { formatDuration } from "@/lib/timer/format";
import { useTimer } from "./TimerProvider";

/** Small running-timer pill shown in the header on every logged-in page. */
export function HeaderTimer() {
  const { running, paused, displayMs } = useTimer();
  const category = running?.category ?? paused?.category;
  if (!category) return null;

  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-sm hover:bg-background"
      aria-label={`${paused ? "Paused" : "Running"}: ${category.name}, ${formatDuration(displayMs)}. Open timer.`}
    >
      <span
        className={`size-2.5 rounded-full ${running ? "animate-pulse" : ""}`}
        style={{ backgroundColor: category.color }}
        aria-hidden
      />
      <span className="max-w-28 truncate">{category.name}</span>
      <span className="font-mono tabular-nums">{paused ? "Paused" : formatDuration(displayMs)}</span>
    </Link>
  );
}
