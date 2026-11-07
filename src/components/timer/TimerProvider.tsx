"use client";

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  getTimerState,
  startTimer,
  stopTimer,
  type RunningTimer,
  type TimerResult,
} from "@/lib/timer/actions";
import { formatDuration } from "@/lib/timer/format";
import type { TimerMode } from "@/lib/types";

type CategoryInfo = RunningTimer["category"];

/** A paused session. Its time is already saved; resuming starts a new entry. */
type Paused = {
  category: CategoryInfo;
  mode: TimerMode;
  /** Stopwatch: total time so far. Countdown: time left. */
  ms: number;
  /** Countdown: the original full length, for the progress bar. */
  totalMs?: number;
};

type TimerContextValue = {
  ready: boolean;
  busy: boolean;
  error: string | null;
  running: RunningTimer | null;
  paused: Paused | null;
  /** Stopwatch: elapsed. Countdown: remaining. */
  displayMs: number;
  /** Countdown progress 0–1, else null. */
  progress: number | null;
  start: (categoryId: string, mode: TimerMode, plannedSeconds?: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  dismissPaused: () => void;
};

const TimerContext = createContext<TimerContextValue | null>(null);

export function useTimer(): TimerContextValue {
  const ctx = use(TimerContext);
  if (!ctx) throw new Error("useTimer must be used inside <TimerProvider>");
  return ctx;
}

/** A short two-tone chime, generated so no audio file is needed. */
function chime(ctx: AudioContext | null) {
  if (!ctx) return;
  try {
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime + i * 0.25;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.65);
    });
  } catch {
    // Sound is a nice-to-have.
  }
}

export function TimerProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState<RunningTimer | null>(null);
  const [paused, setPaused] = useState<Paused | null>(null);
  // Set from the real clock once loaded (reading it here would break prerendering).
  const [now, setNow] = useState(0);

  /** serverNow − clientNow, so a wrong laptop clock doesn't skew the display. */
  const [offset, setOffset] = useState(0);
  /** Stopwatch time carried over from before a pause. */
  const [carryMs, setCarryMs] = useState(0);
  /** Countdown's original length, kept across pause/resume for the progress bar. */
  const [countdownTotalMs, setCountdownTotalMs] = useState<number | null>(null);
  const finishing = useRef(false);
  const audio = useRef<AudioContext | null>(null);
  const baseTitle = useRef<string | null>(null);

  const apply = useCallback((result: TimerResult) => {
    setOffset(result.serverNow - Date.now());
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    setError(null);
    setRunning(result.running);
    setNow(Date.now());
    return true;
  }, []);

  // Load the current timer once (it may have been started before a refresh).
  useEffect(() => {
    getTimerState()
      .then(apply)
      .finally(() => setReady(true));
  }, [apply]);

  // Tick while a timer runs.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [running]);

  const serverNow = now + offset;
  const entry = running?.entry;
  const startedMs = entry ? Date.parse(entry.started_at) : 0;
  const segmentMs = entry ? Math.max(0, serverNow - startedMs) : 0;
  const plannedMs = entry?.mode === "countdown" && entry.planned_seconds ? entry.planned_seconds * 1000 : null;

  let displayMs = 0;
  let progress: number | null = null;
  if (entry) {
    if (plannedMs !== null) {
      displayMs = Math.max(0, plannedMs - segmentMs);
      const total = countdownTotalMs ?? plannedMs;
      progress = Math.min(1, (total - displayMs) / total);
    } else {
      displayMs = carryMs + segmentMs;
    }
  } else if (paused) {
    displayMs = paused.ms;
    progress = paused.totalMs ? (paused.totalMs - paused.ms) / paused.totalMs : null;
  }

  const unlockAudio = () => {
    try {
      audio.current ??= new AudioContext();
      void audio.current.resume();
    } catch {
      audio.current = null;
    }
  };

  const run = useCallback(async (fn: () => Promise<TimerResult>) => {
    setBusy(true);
    try {
      return apply(await fn());
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }, [apply]);

  const start = async (categoryId: string, mode: TimerMode, plannedSeconds?: number) => {
    unlockAudio();
    if (mode === "countdown" && typeof Notification !== "undefined" && Notification.permission === "default") {
      void Notification.requestPermission();
    }
    setCarryMs(0);
    setCountdownTotalMs(mode === "countdown" && plannedSeconds ? plannedSeconds * 1000 : null);
    finishing.current = false;
    setPaused(null);
    await run(() => startTimer({ categoryId, mode, plannedSeconds }));
  };

  const pause = async () => {
    if (!running) return;
    const snapshot: Paused = {
      category: running.category,
      mode: running.entry.mode,
      ms: displayMs,
      totalMs: plannedMs !== null ? (countdownTotalMs ?? plannedMs) : undefined,
    };
    if (await run(stopTimer)) setPaused(snapshot);
  };

  const resume = async () => {
    if (!paused) return;
    unlockAudio();
    const p = paused;
    const ok = await run(() =>
      startTimer({
        categoryId: p.category.id,
        mode: p.mode,
        plannedSeconds: p.mode === "countdown" ? Math.max(1, Math.round(p.ms / 1000)) : undefined,
      }),
    );
    if (ok) {
      setCarryMs(p.mode === "stopwatch" ? p.ms : 0);
      setCountdownTotalMs(p.totalMs ?? null);
      finishing.current = false;
      setPaused(null);
    }
  };

  const stop = async () => {
    if (await run(stopTimer)) {
      setCarryMs(0);
      setCountdownTotalMs(null);
      setPaused(null);
    }
  };

  const dismissPaused = () => {
    setCarryMs(0);
    setCountdownTotalMs(null);
    setPaused(null);
  };

  // Countdown reached zero: save it, chime, and notify.
  const countdownDone = plannedMs !== null && displayMs <= 0;
  const categoryName = running?.category.name;
  useEffect(() => {
    if (!countdownDone || finishing.current) return;
    finishing.current = true;
    chime(audio.current);
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      try {
        new Notification("Time's up!", { body: `${categoryName} block complete.` });
      } catch {
        // Some browsers only allow notifications from a service worker.
      }
    }
    void run(stopTimer).then(() => {
      setCarryMs(0);
      setCountdownTotalMs(null);
    });
  }, [countdownDone, categoryName, run]);

  // Show the timer in the browser tab title, e.g. "12:34 · Studying".
  const label = running ? running.category.name : paused ? `Paused · ${paused.category.name}` : null;
  const shown = formatDuration(displayMs);
  useEffect(() => {
    if (label) {
      if (baseTitle.current === null) baseTitle.current = document.title;
      document.title = `${shown} · ${label}`;
    } else if (baseTitle.current !== null) {
      document.title = baseTitle.current;
      baseTitle.current = null;
    }
  }, [label, shown]);

  // Rebuilt each render (the timer ticks 4×/s), so handlers never go stale.
  const value: TimerContextValue = {
    ready, busy, error, running, paused, displayMs, progress, start, pause, resume, stop, dismissPaused,
  };

  return <TimerContext value={value}>{children}</TimerContext>;
}
