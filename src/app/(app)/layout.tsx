import Link from "next/link";
import { Suspense } from "react";
import { SetupNotice } from "@/components/SetupNotice";
import { UserMenu } from "@/components/UserMenu";

const NAV = [
  { href: "/dashboard", label: "Timer" },
  { href: "/categories", label: "Categories" },
  { href: "/timeline", label: "Timeline" },
];

/** Shared shell for logged-in pages (protected by src/proxy.ts). */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border bg-surface">
        <nav className="mx-auto flex w-full max-w-5xl items-center gap-6 px-4 py-3 sm:px-6">
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
          <Suspense fallback={null}>
            <UserMenu />
          </Suspense>
        </nav>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        <SetupNotice />
        {children}
      </main>
    </div>
  );
}
