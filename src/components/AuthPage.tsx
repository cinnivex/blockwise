import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "./AuthForm";
import { Logo } from "./Logo";
import { SetupNotice } from "./SetupNotice";
import { ThemeSwitch } from "./ThemeSwitch";

/** Shared layout for the login and sign-up pages. */
export function AuthPage({ mode }: { mode: "login" | "signup" }) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-12">
      <SetupNotice />
      <div>
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="Blockwise home">
            <Logo />
          </Link>
          <ThemeSwitch />
        </div>
        <h1 className="mt-6 text-3xl font-medium">
          {mode === "signup" ? "Start your first block" : "Welcome back"}
        </h1>
      </div>
      {/* The form reads the URL (?next=, ?error=), so it renders at request time. */}
      <Suspense fallback={<div className="h-64" aria-hidden />}>
        <AuthForm mode={mode} />
      </Suspense>
    </main>
  );
}
