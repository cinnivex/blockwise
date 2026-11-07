"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";

/** Shown if a logged-in page fails to load (e.g. the database is unreachable). */
export default function AppError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface px-6 py-12 text-center">
      <h1 className="text-xl font-medium">Something went wrong</h1>
      <p className="max-w-sm text-sm text-muted">
        We couldn&apos;t load this page. Your saved time is safe. Check your connection and try again.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="rounded-full bg-accent px-4 py-2 font-medium text-accent-foreground hover:opacity-90"
      >
        Try again
      </button>
    </section>
  );
}
