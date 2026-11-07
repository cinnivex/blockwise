"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { login, signup, type AuthState } from "@/app/auth/actions";

const inputClass =
  "rounded-lg border border-border bg-surface px-3 py-2 font-normal focus:outline-2 focus:outline-accent";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const isSignup = mode === "signup";
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    isSignup ? signup : login,
    {},
  );
  const params = useSearchParams();
  const next = params.get("next") ?? "";
  const linkError =
    params.get("error") === "confirm"
      ? "That confirmation link is invalid or expired. Log in, or sign up again for a new link."
      : undefined;
  const error = state.error ?? linkError;

  if (state.message) {
    return (
      <div role="status" className="rounded-lg border border-border bg-surface p-4 text-sm">
        <p className="font-medium">Check your email</p>
        <p className="mt-1 text-muted">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />

      {isSignup && (
        <label className="flex flex-col gap-1 text-sm font-medium">
          <span>
            Name <span className="font-normal text-muted">(optional)</span>
          </span>
          <input type="text" name="name" autoComplete="name" maxLength={60} className={inputClass} />
        </label>
      )}

      <label className="flex flex-col gap-1 text-sm font-medium">
        Email
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          defaultValue={state.email}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Password
        <input
          type="password"
          name="password"
          required
          minLength={isSignup ? 8 : undefined}
          autoComplete={isSignup ? "new-password" : "current-password"}
          className={inputClass}
        />
        {isSignup && <span className="text-xs font-normal text-muted">At least 8 characters</span>}
      </label>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-accent px-4 py-2.5 font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
      >
        {pending ? (isSignup ? "Creating account…" : "Logging in…") : isSignup ? "Create account" : "Log in"}
      </button>

      <p className="text-center text-sm text-muted">
        {isSignup ? "Already have an account? " : "New to Blockwise? "}
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="font-medium text-foreground underline underline-offset-2"
        >
          {isSignup ? "Log in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
