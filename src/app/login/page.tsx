import Link from "next/link";
import { SetupNotice } from "@/components/SetupNotice";

// Milestone 2 (Accounts): wire this form to Supabase Auth
// (email/password + Google) using a Server Action.
export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-12">
      <SetupNotice />
      <div>
        <Link href="/" className="text-sm text-muted hover:underline">
          &larr; Blockwise
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Log in</h1>
      </div>

      <form className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Email
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="rounded-lg border border-border bg-surface px-3 py-2 font-normal"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Password
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            className="rounded-lg border border-border bg-surface px-3 py-2 font-normal"
          />
        </label>
        <button
          type="submit"
          disabled
          title="Coming in milestone 2"
          className="rounded-lg bg-accent px-4 py-2.5 font-medium text-accent-foreground disabled:opacity-50"
        >
          Log in
        </button>
        <p className="text-center text-xs text-muted">
          Sign-in is wired up in milestone 2 (Accounts).
        </p>
      </form>
    </main>
  );
}
