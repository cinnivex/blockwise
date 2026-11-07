import Link from "next/link";
import { SetupNotice } from "@/components/SetupNotice";

// Sample blocks for the hero illustration (hour offsets from 8:00).
const SAMPLE_DAY = [
  { label: "Deep work", start: 1, hours: 2, color: "#4f46e5" },
  { label: "Email", start: 3.25, hours: 0.5, color: "#b45309" },
  { label: "Studying", start: 5, hours: 1.5, color: "#15803d" },
  { label: "Side project", start: 7, hours: 1, color: "#be185d" },
];
const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? "AM" : "PM"}`;

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-12 sm:px-6 sm:py-20">
      <SetupNotice />

      <div className="grid items-center gap-12 md:grid-cols-2">
        <section className="flex flex-col gap-6">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            See where your day actually went.
          </h1>
          <p className="text-lg text-muted">
            Pick a category, hit start, and Blockwise turns your focus time
            into a color-coded picture of your day.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="rounded-lg bg-accent px-5 py-2.5 font-medium text-accent-foreground hover:opacity-90"
            >
              Start your first block
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-border px-5 py-2.5 font-medium hover:bg-surface"
            >
              Log in
            </Link>
          </div>
        </section>

        <section
          aria-label="Example day timeline"
          className="rounded-2xl border border-border bg-surface p-5"
        >
          <p className="mb-3 text-sm font-medium text-muted">Example day</p>
          <div className="relative h-80">
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={i}
                className="absolute inset-x-0 flex items-start gap-3 border-t border-border text-xs text-muted"
                style={{ top: `${(i / 9) * 100}%` }}
              >
                <span className="-mt-2 w-12 bg-surface">{hourLabel(8 + i)}</span>
              </div>
            ))}
            {SAMPLE_DAY.map((b) => (
              <div
                key={b.label}
                className="absolute left-16 right-1 overflow-hidden rounded-md px-2 py-1 text-xs font-medium text-white"
                style={{
                  top: `${(b.start / 9) * 100}%`,
                  height: `${(b.hours / 9) * 100}%`,
                  backgroundColor: b.color,
                }}
              >
                {b.label}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
