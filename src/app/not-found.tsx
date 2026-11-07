import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <div className="flex gap-1.5" aria-hidden>
        <span className="h-10 w-3 rounded bg-[#4f46e5]" />
        <span className="h-6 w-3 self-end rounded bg-[#b45309]" />
        <span className="h-8 w-3 self-end rounded bg-[#15803d]" />
      </div>
      <h1 className="text-2xl font-semibold">This page doesn&apos;t exist</h1>
      <p className="text-muted">The link may be broken, or the page may have moved.</p>
      <div className="flex gap-3">
        <Link
          href="/dashboard"
          className="rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground hover:opacity-90"
        >
          Go to your timer
        </Link>
        <Link href="/" className="rounded-lg border border-border px-4 py-2 font-medium hover:bg-surface">
          Home
        </Link>
      </div>
    </main>
  );
}
