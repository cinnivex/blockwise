// Date helpers that work in the viewer's local time zone (browser only).
// A "day" is a YYYY-MM-DD string, e.g. "2026-11-07".

const pad = (n: number) => String(n).padStart(2, "0");

export function toDayString(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayString(): string {
  return toDayString(new Date());
}

export function isDayString(s: string | null | undefined): s is string {
  // Round-trip check rejects impossible dates like 2026-13-40 (JS would roll them over).
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && toDayString(parseDay(s)) === s;
}

/** Local midnight at the start of the day. */
export function parseDay(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function shiftDay(day: string, by: number): string {
  const d = parseDay(day);
  d.setDate(d.getDate() + by);
  return toDayString(d);
}

/** [start, end) of the day as ISO strings (handles daylight-saving days). */
export function dayRange(day: string): { from: string; to: string } {
  return { from: parseDay(day).toISOString(), to: parseDay(shiftDay(day, 1)).toISOString() };
}

/** "2026-11-07" + "14:30" → ISO timestamp in local time. */
export function combineDayTime(day: string, time: string): string {
  const [h, min] = time.split(":").map(Number);
  const d = parseDay(day);
  d.setHours(h, min, 0, 0);
  return d.toISOString();
}

/** ISO → "14:30" for <input type="time">. */
export function toTimeInput(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const clockFmt = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
const weekdayFmt = new Intl.DateTimeFormat(undefined, { weekday: "short" });

/** "9:05 AM", or "Mon 11:30 PM" when it falls on a different day than `day`. */
export function formatClock(iso: string, day?: string): string {
  const d = new Date(iso);
  const clock = clockFmt.format(d);
  return day && toDayString(d) !== day ? `${weekdayFmt.format(d)} ${clock}` : clock;
}

/** 4_500_000 → "1h 15m", 2_700_000 → "45m", 20_000 → "<1m". */
export function formatHoursMinutes(ms: number): string {
  const totalMin = Math.floor(Math.max(0, ms) / 60_000);
  if (totalMin === 0) return ms > 0 ? "<1m" : "0m";
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** "Today", "Yesterday", or "Wed, Nov 4". */
export function dayLabel(day: string): string {
  const today = todayString();
  if (day === today) return "Today";
  if (day === shiftDay(today, -1)) return "Yesterday";
  return new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(
    parseDay(day),
  );
}
