import Link from "next/link";
import { Suspense } from "react";
import { SetupNotice } from "@/components/SetupNotice";
import { UserMenu } from "@/components/UserMenu";
import { HeaderTimer } from "@/components/timer/HeaderTimer";
import { TimerProvider } from "@/components/timer/TimerProvider";

const NAV = [
  { href: "/dashboard", label: "Timer" },
  { href: "/categories", label: "Categories" },
  { href: "/timeline", label: "Timeline" },
];

/** Shared shell for logged-in pages (protected by src/proxy.ts). */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <TimerProvider>
    <div className="flex flex-1 flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-foreground"
      >
        Skip to content
      </a>
      <header className="border-b border-border bg-surface">
        <nav className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <Link href="/" className="font-semibold">
            Blockwise
          </Link>
          <ul className="flex gap-4 text-sm">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-muted hover:text-foreground">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="ml-auto flex items-center gap-3">
            <HeaderTimer />
            <Suspense fallback={null}>
              <UserMenu />
            </Suspense>
          </div>
        </nav>
      </header>
      <main id="main" className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        <SetupNotice />
        {children}
      </main>
    </div>
    </TimerProvider>
  );
}
