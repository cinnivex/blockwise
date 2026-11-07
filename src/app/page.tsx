import Link from "next/link";
import { Logo } from "@/components/Logo";
import { SetupNotice } from "@/components/SetupNotice";
import { ThemeSwitch } from "@/components/ThemeSwitch";

// Sample blocks for the hero illustration (hour offsets from 8 AM).
const SAMPLE_DAY = [
  { label: "Reading", start: 1, hours: 2, color: "#4f7a55" },
  { label: "Email", start: 3.25, hours: 0.5, color: "#a2512f" },
  { label: "Studying", start: 5, hours: 1.5, color: "#6c5d9c" },
  { label: "Side project", start: 7, hours: 1, color: "#3b6c8c" },
];
const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? "AM" : "PM"}`;

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <div className="flex items-center gap-4">
          <ThemeSwitch />
          <Link href="/login" className="text-sm font-medium text-muted hover:text-foreground">
            Log in
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-8 sm:px-6 sm:py-16">
        <SetupNotice />

        <div className="grid items-center gap-12 md:grid-cols-2">
          <section className="flex flex-col gap-6">
            <h1 className="text-4xl font-medium leading-tight sm:text-5xl">Small blocks add up.</h1>
            <p className="text-lg text-muted">
              Pick what you&apos;re working on, start a timer, and watch your day fill in with calm,
              colorful blocks. No streak pressure, just a clear picture of where your time went.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="rounded-full bg-accent px-6 py-3 font-medium text-accent-foreground hover:opacity-90"
              >
                Start your first block
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-border bg-surface px-6 py-3 font-medium hover:bg-background"
              >
                Log in
              </Link>
            </div>
          </section>

          <section aria-label="Example day timeline" className="rounded-2xl border border-border bg-surface p-5">
            <p className="mb-3 font-display text-sm text-muted">An example day</p>
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
                  className="absolute left-16 right-1 overflow-hidden rounded-xl px-3 py-1.5 text-xs font-medium text-white"
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
    </div>
  );
}
