// Pure layout math for the day timeline, kept separate so it's easy to test.

export type TimelineInput = {
  id: string;
  startMs: number;
  /** null while running */
  endMs: number | null;
};

export type Placed = {
  id: string;
  /** Hours from local midnight, clipped to the day. */
  startH: number;
  endH: number;
  running: boolean;
};

export const DEFAULT_START_H = 7;
export const DEFAULT_END_H = 22;

/** Clip entries to the day and convert to fractional hours from local midnight. */
export function placeEntries(entries: TimelineInput[], dayStartMs: number, dayEndMs: number, nowMs: number): Placed[] {
  const hour = 3_600_000;
  return entries
    .map((e) => {
      const end = e.endMs ?? Math.min(nowMs, dayEndMs);
      const s = Math.max(e.startMs, dayStartMs);
      const t = Math.min(end, dayEndMs);
      const startH = (s - dayStartMs) / hour;
      // Never let a block end before it starts (e.g. a slightly-off device clock).
      const endH = Math.max(startH, (t - dayStartMs) / hour);
      return { id: e.id, startH, endH, running: e.endMs === null };
    })
    .filter((p) => p.endH > p.startH || p.running);
}

/**
 * Visible hour range: 7:00–22:00 by default, widened to whole hours so every
 * block (and the "now" line, if shown) fits. The day can be 23–25 hours long
 * on daylight-saving changes.
 */
export function visibleRange(placed: Placed[], dayLengthH: number, nowH: number | null): { from: number; to: number } {
  let from = DEFAULT_START_H;
  let to = DEFAULT_END_H;
  for (const p of placed) {
    from = Math.min(from, Math.floor(p.startH));
    to = Math.max(to, Math.ceil(p.endH));
  }
  if (nowH !== null) {
    from = Math.min(from, Math.floor(nowH));
    to = Math.max(to, Math.ceil(nowH + 0.01));
  }
  return { from: Math.max(0, from), to: Math.min(Math.ceil(dayLengthH), to) };
}
