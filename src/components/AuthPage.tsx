import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "./AuthForm";
import { SetupNotice } from "./SetupNotice";

/** Shared layout for the login and sign-up pages. */
export function AuthPage({ mode }: { mode: "login" | "signup" }) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-12">
      <SetupNotice />
      <div>
        <Link href="/" className="text-sm text-muted hover:underline">
          &larr; Blockwise
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">
          {mode === "signup" ? "Create your account" : "Log in"}
        </h1>
      </div>
      {/* The form reads the URL (?next=, ?error=), so it renders at request time. */}
      <Suspense fallback={<div className="h-64" aria-hidden />}>
        <AuthForm mode={mode} />
      </Suspense>
    </main>
  );
}
